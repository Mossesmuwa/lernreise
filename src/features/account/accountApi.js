import { supabase } from "../../lib/supabaseClient";

export async function getSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSettings(patch) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("settings")
    .upsert(
      { owner_id: userData.user.id, ...patch },
      { onConflict: "owner_id" },
    );
  if (error) throw error;
}

export async function getPublicProfile() {
  const { data, error } = await supabase
    .from("public_profile")
    .select("display_name, avatar_url")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updatePublicProfile(patch) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("public_profile")
    .upsert(
      { id: true, owner_id: userData.user.id, ...patch },
      { onConflict: "id" },
    );
  if (error) throw error;
}
