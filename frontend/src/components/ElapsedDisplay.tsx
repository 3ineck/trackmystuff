import { motion } from "framer-motion";

interface Props {
  elapsed: number;
  frozen: boolean;
}

function format(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function ElapsedDisplay({ elapsed, frozen }: Props) {
  return (
    <motion.div
      animate={{ opacity: elapsed > 0 ? 1 : 0.4 }}
      className={`font-mono text-5xl tabular-nums tracking-wider ${
        frozen ? "text-muted" : "text-ink"
      }`}
    >
      {format(elapsed)}
    </motion.div>
  );
}
