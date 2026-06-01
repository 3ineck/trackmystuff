import { useEffect, useState } from "react";

function formatDayName(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "long" });
}

function formatDateTime(d: Date): string {
  const date = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${date} · ${time}`;
}

export default function NowDisplay() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      <div className="text-xl font-semibold capitalize text-ink sm:text-2xl">
        {formatDayName(now)}
      </div>
      <div className="mt-1 text-sm tabular-nums text-muted">
        {formatDateTime(now)}
      </div>
    </div>
  );
}
