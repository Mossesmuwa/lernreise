import { motion } from "motion/react";

export default function SegmentedControl({ name, options, value, onChange }) {
  return (
    <div className="inline-flex bg-paper border border-mist rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="relative px-3 py-1.5 text-xs rounded-md"
        >
          {value === opt.value && (
            <motion.span
              layoutId={`segmented-${name}`}
              className="absolute inset-0 bg-card rounded-md"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span
            className={`relative ${value === opt.value ? "text-ink font-medium" : "text-ink/50"}`}
          >
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}
