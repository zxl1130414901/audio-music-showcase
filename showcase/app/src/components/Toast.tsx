import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
}

/** 轻量非阻塞提示：4 秒自动消失，不打断操作。 */
export function Toast({ message }: ToastProps) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
    if (!message) return;
    const timer = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!visible || !message) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
