// Seed of the DE/EN interface-language pattern described in the spec:
// only the app's own chrome is translated here. Anything the owner typed
// themselves (course titles, teacher names, notes) is never routed
// through this dictionary — it's stored and shown exactly as entered.

export const strings = {
  de: {
    welcomeTitle: (name) =>
      name ? `Willkommen bei ${name}s Lernreise` : "Willkommen bei Lernreise",
    welcomeSubtitle: "Wessen Zugang ist das?",
    imOwner: "Ich bin es",
    imOwnerSubtitle: "Anmelden, um deine Reise zu verwalten",
    haveCode: "Ich habe einen Zugangscode",
    haveCodeSubtitle: "Ansehen oder verwalten, was geteilt wurde",
    welcomeBack: (name) =>
      name ? `Willkommen zurück, ${name}` : "Willkommen zurück",
    signInSubtitle: "Melde dich für deine Deutschreise an",
    email: "E-Mail",
    password: "Passwort",
    forgotPassword: "Passwort vergessen?",
    signIn: "Anmelden",
    error: "E-Mail oder Passwort ist falsch.",
  },
  en: {
    welcomeTitle: (name) =>
      name ? `Welcome to ${name}'s Lernreise` : "Welcome to Lernreise",
    welcomeSubtitle: "Whose access is this?",
    imOwner: "It's me",
    imOwnerSubtitle: "Sign in to manage your journey",
    haveCode: "I have an access code",
    haveCodeSubtitle: "View or manage what's been shared with you",
    welcomeBack: (name) => (name ? `Welcome back, ${name}` : "Welcome back"),
    signInSubtitle: "Sign in to your German journey",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    signIn: "Sign in",
    error: "That email or password is incorrect.",
  },
};

export function t(key, lang = "de") {
  return strings[lang]?.[key] ?? strings.de[key];
}

const LANG_KEY = "lernreise_lang";

export function getStoredLang() {
  return localStorage.getItem(LANG_KEY) || "de";
}

export function setStoredLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
}
