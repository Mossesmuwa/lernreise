import { supabase } from "../../lib/supabaseClient";

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function requestPasswordReset(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

export async function updatePassword(password) {
  return supabase.auth.updateUser({ password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
