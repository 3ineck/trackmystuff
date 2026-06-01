import { useEffect, useState } from "react";

function formatDayName(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function formatDateTime(d: Date): string {
  const date = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
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
