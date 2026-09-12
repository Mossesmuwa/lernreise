import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ensureShareSession, resolveShareCode } from "../lib/api";

const CODE_LENGTH = 8;
const MAX_ATTEMPTS = 5;

export default function AccessCode() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [chars, setChars] = useState(Array(CODE_LENGTH).fill(""));
  const [attempts, setAttempts] = useState(0);
  const [checking, setChecking] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef([]);

  const locked = attempts >= MAX_ATTEMPTS;

  function handleChange(i, value) {
    const char = value.slice(-1).toUpperCase();
    setChars((prev) => {
      const next = [...prev];
      next[i] = char;
      return next;
    });
    if (char && i < CODE_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !chars[i] && i > 0)
      inputRefs.current[i - 1]?.focus();
  }

  function handlePaste(e) {
    const pasted = e.clipboardData
      .getData("text")
      .trim()
      .toUpperCase()
      .slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setChars(Array.from({ length: CODE_LENGTH }, (_, i) => pasted[i] ?? ""));
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (locked) return;
    const code = chars.join("");
    if (code.length < CODE_LENGTH) return;

    setChecking(true);
    let result = null;
    try {
      await ensureShareSession();
      result = await resolveShareCode(code);
    } catch {
      result = null;
    }
    setChecking(false);

    if (!result) {
      setAttempts((a) => a + 1);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setChars(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      return;
    }

    navigate(
      result.role === "teacher_editor"
        ? `/teacher/${result.token}`
        : `/shared/${result.token}`,
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm bg-card border border-mist rounded-2xl p-8 text-center"
      >
        <p className="font-display text-pine text-sm mb-6">Lernreise</p>
        <h1 className="font-display text-xl mb-1">Enter your access code</h1>
        <p className="text-sm text-ink/60 mb-6">
          The 8-character code you were given.
        </p>

        {locked ? (
          <p className="text-sm text-red-700">
            Too many incorrect attempts. Ask for the code again, or try again in
            a few minutes.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <motion.div
              animate={
                shake && !reduceMotion ? { x: [0, -8, 8, -6, 6, 0] } : {}
              }
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-1.5 mb-6"
              onPaste={handlePaste}
            >
              {chars.map((char, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  value={char}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  maxLength={1}
                  inputMode="text"
                  autoComplete="off"
                  aria-label={`Character ${i + 1} of ${CODE_LENGTH}`}
                  className="w-9 h-11 text-center text-lg rounded-lg border border-mist bg-paper uppercase"
                />
              ))}
            </motion.div>

            <button
              type="submit"
              disabled={checking || chars.some((c) => !c)}
              className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5 disabled:opacity-60"
            >
              {checking ? "Checking…" : "Continue"}
            </button>

            {attempts > 0 && (
              <p className="text-xs text-ink/50 mt-3">
                That code didn't match. {MAX_ATTEMPTS - attempts} attempt
                {MAX_ATTEMPTS - attempts === 1 ? "" : "s"} left.
              </p>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
}
