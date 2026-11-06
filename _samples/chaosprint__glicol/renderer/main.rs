// 用 glicol 引擎离线渲染「带时间轴的 live coding 乐谱」为 wav
// score 文件格式：以 @秒数 开头的行为时间点，其后到下一个 @ 之前为 glicol 代码
use std::env;
use std::fs::File;
use std::io::Write;

const BLOCK: usize = 128;

fn write_wav_header(f: &mut File, sr: u32, ch: u16, frames: u32) -> std::io::Result<()> {
    let bits: u16 = 16;
    let block_align = ch * bits / 8;
    let byte_rate = sr * block_align as u32;
    let data_size = frames * block_align as u32;
    f.write_all(b"RIFF")?;
    f.write_all(&(36 + data_size).to_le_bytes())?;
    f.write_all(b"WAVEfmt ")?;
    f.write_all(&16u32.to_le_bytes())?;
    f.write_all(&1u16.to_le_bytes())?;
    f.write_all(&ch.to_le_bytes())?;
    f.write_all(&sr.to_le_bytes())?;
    f.write_all(&byte_rate.to_le_bytes())?;
    f.write_all(&block_align.to_le_bytes())?;
    f.write_all(&bits.to_le_bytes())?;
    f.write_all(b"data")?;
    f.write_all(&data_size.to_le_bytes())?;
    Ok(())
}

fn parse_score(text: &str) -> Vec<(f32, String)> {
    let mut out = Vec::new();
    let mut cur_t: Option<f32> = None;
    let mut cur_code = String::new();
    for raw in text.lines() {
        let line = raw.trim_end();
        if let Some(rest) = line.trim_start().strip_prefix('@') {
            if let Some(t) = cur_t {
                out.push((t, cur_code.clone()));
                cur_code.clear();
            }
            cur_t = Some(rest.trim().parse().expect("score time"));
        } else if cur_t.is_some() {
            cur_code.push_str(line);
            cur_code.push('\n');
        }
    }
    if let Some(t) = cur_t {
        out.push((t, cur_code));
    }
    out
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 4 {
        eprintln!("usage: glicol_render <score_file> <out_wav> <seconds> [sr]");
        std::process::exit(2);
    }
    let raw = std::fs::read_to_string(&args[1]).expect("read score");
    let score = parse_score(raw.trim_start_matches('\u{feff}'));
    let out_path = &args[2];
    let secs: f32 = args[3].parse().expect("seconds");
    let sr: usize = args.get(4).and_then(|s| s.parse().ok()).unwrap_or(44100);

    let mut engine = glicol::Engine::<BLOCK>::new();
    engine.set_sr(sr);
    engine.set_bpm(120.0);

    let total = (secs * sr as f32) as usize;
    let mut collected: Vec<Vec<f32>> = Vec::new();
    let mut rendered = 0usize;
    let mut next_cue = 0usize;
    while rendered < total {
        let t_now = rendered as f32 / sr as f32;
        while next_cue < score.len() && score[next_cue].0 <= t_now {
            let (ct, code) = &score[next_cue];
            if let Err(e) = engine.update_with_code(code) {
                eprintln!("glicol code error at {}s: {:?}", ct, e);
                std::process::exit(1);
            }
            eprintln!("cue @{}s applied", ct);
            next_cue += 1;
        }
        let block = engine.next_block(vec![]);
        if collected.is_empty() {
            collected = vec![Vec::new(); block.len()];
        }
        if rendered == 0 {
            let peak = block.iter().flat_map(|b| b.iter()).fold(0.0f32, |m, v| m.max(v.abs()));
            eprintln!("first block: {} ch, peak {}", block.len(), peak);
        }
        for (c, buf) in block.iter().enumerate() {
            collected[c].extend_from_slice(buf);
        }
        rendered += BLOCK;
    }
    let overall = collected.iter().flat_map(|b| b.iter()).fold(0.0f32, |m, v| m.max(v.abs()));
    eprintln!("overall peak {}", overall);
    let ch = collected.len().max(1);
    let frames = total as u32;
    let mut f = File::create(out_path).expect("create wav");
    write_wav_header(&mut f, sr as u32, ch as u16, frames).unwrap();
    for i in 0..total {
        for c in 0..ch {
            let v = collected.get(c).and_then(|b| b.get(i)).copied().unwrap_or(0.0);
            let s = (v.clamp(-1.0, 1.0) * 32767.0) as i16;
            f.write_all(&s.to_le_bytes()).unwrap();
        }
    }
    eprintln!("wrote {} ({} ch, {} frames @ {} Hz)", out_path, ch, total, sr);
}
