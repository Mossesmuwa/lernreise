import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { t, getStoredLang } from "../lib/i18n";

export default function Login() {
  const navigate = useNavigate();
  const [lang] = useState(getStoredLang());
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // public_profile is anon-readable by design, specifically so this
    // screen can show a name/photo before anyone has signed in.
    supabase
      .from("public_profile")
      .select("display_name, avatar_url")
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError(t("error", lang));
      return;
    }
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-mist rounded-2xl p-8">
        <p className="font-display text-pine text-sm mb-6">Lernreise</p>

        <div className="w-16 h-16 rounded-full bg-paper border border-mist flex items-center justify-center overflow-hidden mb-4 mx-auto">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-mist"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
            </svg>
          )}
        </div>

        <h1 className="font-display text-xl text-center mb-1">
          {t("welcomeBack", lang)(profile?.display_name)}
        </h1>
        <p className="text-sm text-ink/60 text-center mb-6">
          {t("signInSubtitle", lang)}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs text-ink/60 mb-1">
              {t("email", lang)}
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

          <div>
            <label
              htmlFor="password"
              className="block text-xs text-ink/60 mb-1"
            >
              {t("password", lang)}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="text-right">
            <a href="/forgot-password" className="text-xs text-pine">
              {t("forgotPassword", lang)}
            </a>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5 disabled:opacity-60"
          >
            {t("signIn", lang)}
          </button>
        </form>
      </div>
    </div>
  );
}
