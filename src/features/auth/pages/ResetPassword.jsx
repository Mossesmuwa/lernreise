import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updatePassword } from "../authApi";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (password.length < 12) {
      setError("Use at least 12 characters for your new password.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: updateError } = await updatePassword(password);
    setSubmitting(false);
    if (updateError) {
      setError("That link may have expired — request a new one.");
      return;
    }
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-mist rounded-2xl p-8">
        <p className="font-display text-pine text-sm mb-6">Lernreise</p>
        <h1 className="font-display text-xl mb-4">Choose a new password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm" />
          <input type="password" required minLength={12} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Confirm new password" className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm" />
          <p className="text-xs text-ink/50">Use 12 or more characters. A passphrase is easiest to remember.</p>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5 disabled:opacity-60"
          >
            Save password
          </button>
        </form>
      </div>
    </div>
  );
}
