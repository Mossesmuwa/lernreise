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

export async function uploadAvatar(file) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Profile images must be smaller than 5 MB.");
  }
  const { data: userData } = await supabase.auth.getUser();
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${userData.user.id}/avatar-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  await updatePublicProfile({ avatar_url: data.publicUrl });
  return data.publicUrl;
}
