import { motion } from "framer-motion";

export type TimerButtonState = "idle" | "running" | "paused";

interface Props {
  state: TimerButtonState;
  disabled?: boolean;
  onClick: () => void;
}

export default function TimerButton({ state, disabled, onClick }: Props) {
  const label = state === "running" ? "PAUSE" : state === "paused" ? "RESUME" : "START";
  const running = state === "running";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.04 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      animate={
        running
          ? { boxShadow: ["0 0 0px rgba(239,68,68,0.0)", "0 0 40px rgba(239,68,68,0.55)", "0 0 0px rgba(239,68,68,0.0)"] }
          : { boxShadow: "0 0 0px rgba(0,0,0,0)" }
      }
      transition={running ? { duration: 1.8, repeat: Infinity } : { duration: 0.3 }}
      className={`relative flex h-40 w-40 select-none items-center justify-center rounded-full text-xl font-bold tracking-wide text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:h-56 sm:w-56 sm:text-2xl ${
        running ? "bg-red-500" : "bg-accent"
      }`}
    >
      {label}
    </motion.button>
  );
}
