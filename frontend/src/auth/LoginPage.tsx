import { motion } from "framer-motion";
import { loginUrl } from "../api/client";

export default function LoginPage() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl border border-border bg-panel p-8 text-center shadow-xl"
      >
        <h1 className="text-2xl font-semibold">TrackMyStuff</h1>
        <p className="mt-2 text-sm text-muted">
          Track how you spend your time. Log in with Discord to begin.
        </p>
        <motion.a
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          href={loginUrl}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-3 font-medium text-white shadow"
        >
          Login with Discord
        </motion.a>
      </motion.div>
    </div>
  );
}
