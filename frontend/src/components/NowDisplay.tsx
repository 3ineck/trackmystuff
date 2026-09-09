import { useEffect, useState } from "react";

function formatDayName(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function NowDisplay() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      <div className="text-3xl font-semibold capitalize text-ink sm:text-5xl">
        {formatDayName(now)}
      </div>
      <div className="mt-4 text-6xl font-bold tabular-nums text-ink sm:text-8xl">
        {formatTime(now)}
      </div>
      <div className="mt-3 text-base text-muted sm:text-xl">
        {formatDate(now)}
      </div>
    </div>
  );
}
