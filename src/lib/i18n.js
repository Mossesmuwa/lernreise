// Seed of the DE/EN interface-language pattern described in the spec:
// only the app's own chrome is translated here. Anything the owner typed
// themselves (course titles, teacher names, notes) is never routed
// through this dictionary — it's stored and shown exactly as entered.

export const strings = {
  de: {
    welcomeBack: (name) => (name ? `Willkommen zurück, ${name}` : 'Willkommen zurück'),
    signInSubtitle: 'Melde dich für deine Deutschreise an',
    email: 'E-Mail',
    password: 'Passwort',
    forgotPassword: 'Passwort vergessen?',
    signIn: 'Anmelden',
    error: 'E-Mail oder Passwort ist falsch.',
  },
  en: {
    welcomeBack: (name) => (name ? `Welcome back, ${name}` : 'Welcome back'),
    signInSubtitle: 'Sign in to your German journey',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    signIn: 'Sign in',
    error: 'That email or password is incorrect.',
  },
};

export function t(key, lang = 'de') {
  return strings[lang]?.[key] ?? strings.de[key];
}
