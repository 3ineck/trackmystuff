import { motion } from "framer-motion";

interface Props {
  running: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export default function TimerButton({ running, disabled, onClick }: Props) {
  const label = running ? "STOP" : "START";

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
      className={`relative flex h-56 w-56 select-none items-center justify-center rounded-full text-2xl font-bold tracking-wide text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        running ? "bg-red-500" : "bg-accent"
      }`}
    >
      {label}
    </motion.button>
  );
}
