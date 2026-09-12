import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function CopyField({ value, label }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-2 bg-paper border border-mist rounded-lg px-3 py-2">
      <div className="flex-1 min-w-0">
        {label && <p className="text-[10px] text-ink/50">{label}</p>}
        <p className="text-sm font-mono truncate">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="relative text-xs px-2.5 py-1 rounded-md border border-mist flex-shrink-0"
      >
        Copy
        <AnimatePresence>
          {copied && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] bg-ink text-paper px-2 py-0.5 rounded whitespace-nowrap"
            >
              Copied
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
