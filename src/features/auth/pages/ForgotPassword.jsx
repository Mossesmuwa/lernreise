import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../authApi';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: resetError } = await requestPasswordReset(email);
    setSubmitting(false);
    if (resetError) {
      setError('Something went wrong sending that email. Try again.');
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-mist rounded-2xl p-8">
        <p className="font-display text-pine text-sm mb-6">Lernreise</p>
        <h1 className="font-display text-xl mb-1">Reset your password</h1>

        {sent ? (
          <p className="text-sm text-ink/70">
            If an account exists for {email}, a reset link is on its way.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label htmlFor="email" className="block text-xs text-ink/60 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5 disabled:opacity-60"
            >
              Send reset link
            </button>
          </form>
        )}

        <Link to="/login" className="block text-center text-xs text-pine mt-6">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
