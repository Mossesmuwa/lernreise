import { supabase } from "./supabaseClient";

// ---------- Journey / levels ----------

export async function getLevels() {
  const { data, error } = await supabase
    .from("levels")
    .select(
      "id, name, status, sort_order, courses(id, title, status, cover_image_url)",
    )
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getCurrentCourse() {
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, title, status, cover_image_url, level:levels(id, name), modules(id, name, sort_order, lessons(id, name, sort_order, status))",
    )
    .eq("status", "current")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateLessonStatus(lessonId, status) {
  const patch = { status };
  if (status === "in_progress")
    patch.started_at = new Date().toISOString().slice(0, 10);
  if (status === "completed")
    patch.completed_at = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("lessons")
    .update(patch)
    .eq("id", lessonId);
  if (error) throw error;
}

export async function getLessonDetail(lessonId) {
  const [
    { data: lesson, error: e1 },
    { data: sessions, error: e2 },
    { data: classes, error: e3 },
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, name, status, started_at, completed_at")
      .eq("id", lessonId)
      .single(),
    supabase
      .from("study_sessions")
      .select("id, session_date, duration_minutes, notes")
      .eq("lesson_id", lessonId)
      .is("deleted_at", null)
      .order("session_date", { ascending: false }),
    supabase
      .from("teacher_classes")
      .select(
        "id, scheduled_at, status, duration_minutes, teacher:teachers(name)",
      )
      .eq("lesson_id", lessonId)
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: false }),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;
  return { lesson, sessions: sessions ?? [], classes: classes ?? [] };
}

export async function markLevelComplete(levelId, nextLevelId) {
  const { error: e1 } = await supabase
    .from("levels")
    .update({ status: "completed" })
    .eq("id", levelId);
  if (e1) throw e1;
  if (nextLevelId) {
    const { error: e2 } = await supabase
      .from("levels")
      .update({ status: "current" })
      .eq("id", nextLevelId);
    if (e2) throw e2;
  }
}

export async function setLevelCurrent(levelId) {
  const { error } = await supabase
    .from("levels")
    .update({ status: "current" })
    .eq("id", levelId);
  if (error) throw error;
}

// ---------- Study sessions ----------

export async function listStudySessions({ from, to, search } = {}) {
  let query = supabase
    .from("study_sessions")
    .select(
      "id, session_date, duration_minutes, notes, lesson:lessons(id, name)",
    )
    .is("deleted_at", null)
    .order("session_date", { ascending: false });
  if (from) query = query.gte("session_date", from);
  if (to) query = query.lte("session_date", to);
  if (search) query = query.ilike("notes", `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function addStudySession({
  lessonId,
  sessionDate,
  durationMinutes,
  notes,
}) {
  const { error } = await supabase
    .from("study_sessions")
    .insert({
      lesson_id: lessonId,
      session_date: sessionDate,
      duration_minutes: durationMinutes,
      notes,
    });
  if (error) throw error;
}

export async function updateStudySession(id, patch) {
  const { error } = await supabase
    .from("study_sessions")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function softDeleteStudySession(id) {
  const { error } = await supabase
    .from("study_sessions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function restoreStudySession(id) {
  const { error } = await supabase
    .from("study_sessions")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw error;
}

// ---------- Teacher classes ----------

export async function listTeacherClasses({ from, to } = {}) {
  let query = supabase
    .from("teacher_classes")
    .select(
      "id, scheduled_at, original_scheduled_at, mode, status, duration_minutes, notes, lesson:lessons(id, name), teacher:teachers(id, name)",
    )
    .is("deleted_at", null)
    .order("scheduled_at");
  if (from) query = query.gte("scheduled_at", from);
  if (to) query = query.lte("scheduled_at", to);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function addTeacherClass({
  lessonId,
  teacherId,
  scheduledAt,
  mode,
  notes,
}) {
  const { error } = await supabase
    .from("teacher_classes")
    .insert({
      lesson_id: lessonId,
      teacher_id: teacherId,
      scheduled_at: scheduledAt,
      mode,
      notes,
    });
  if (error) throw error;
}

export async function rescheduleTeacherClass(
  id,
  newScheduledAt,
  currentScheduledAt,
) {
  const { error } = await supabase
    .from("teacher_classes")
    .update({
      scheduled_at: newScheduledAt,
      original_scheduled_at: currentScheduledAt,
      status: "rescheduled",
    })
    .eq("id", id);
  if (error) throw error;
}

export async function markClassCompleted(id, durationMinutes) {
  const { error } = await supabase
    .from("teacher_classes")
    .update({ status: "completed", duration_minutes: durationMinutes ?? null })
    .eq("id", id);
  if (error) throw error;
}

export async function softDeleteTeacherClass(id) {
  const { error } = await supabase
    .from("teacher_classes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function restoreTeacherClass(id) {
  const { error } = await supabase
    .from("teacher_classes")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw error;
}

export async function listDeletedStudySessions() {
  const { data, error } = await supabase
    .from("study_sessions")
    .select(
      "id, session_date, duration_minutes, deleted_at, lesson:lessons(name)",
    )
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listDeletedTeacherClasses() {
  const { data, error } = await supabase
    .from("teacher_classes")
    .select("id, scheduled_at, deleted_at, lesson:lessons(name)")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listTeachers() {
  const { data, error } = await supabase
    .from("teachers")
    .select("id, name, institution_id")
    .order("name");
  if (error) throw error;
  return data;
}

// ---------- Active timer (visible across devices) ----------

export async function getActiveTimer() {
  const { data, error } = await supabase
    .from("active_timer")
    .select("lesson_id, started_at")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function startTimer(lessonId) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("active_timer")
    .upsert(
      {
        owner_id: userData.user.id,
        lesson_id: lessonId,
        started_at: new Date().toISOString(),
      },
      { onConflict: "owner_id" },
    );
  if (error) throw error;
}

export async function clearTimer() {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("active_timer")
    .update({ lesson_id: null, started_at: null })
    .eq("owner_id", userData.user.id);
  if (error) throw error;
}

// ---------- Settings & profile ----------

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

// ---------- Sharing ----------

function randomToken(length = 24) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function randomCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function listShareLinks() {
  const { data, error } = await supabase
    .from("share_links")
    .select(
      "id, role, teacher_id, teacher:teachers(name), token, code, label, expires_at, revoked, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createShareLink({
  role,
  teacherId,
  label,
  expiresAt,
  withCode,
}) {
  const { data, error } = await supabase
    .from("share_links")
    .insert({
      role,
      teacher_id: role === "teacher_editor" ? teacherId : null,
      label,
      expires_at: expiresAt || null,
      token: randomToken(),
      code: withCode ? randomCode() : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function revokeShareLink(id) {
  const { error } = await supabase
    .from("share_links")
    .update({ revoked: true })
    .eq("id", id);
  if (error) throw error;
}

// Visitor-side (anon) — uses the SECURITY DEFINER function from schema.sql,
// so it works without the visitor ever being authenticated.
export async function validateShareToken(token) {
  const { data, error } = await supabase.rpc("validate_share_token", {
    p_token: token,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function resolveShareCode(code) {
  const { data, error } = await supabase.rpc("resolve_share_code", {
    p_code: code,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function recordShareAccess(shareLinkId) {
  const { error } = await supabase.rpc("record_share_access", {
    p_share_link_id: shareLinkId,
  });
  if (error) throw error;
}

export async function getSharedDashboard(token) {
  const { data, error } = await supabase.rpc("get_shared_dashboard", {
    p_token: token,
  });
  if (error) throw error;
  return data;
}

export async function getTeacherClassesForToken(token) {
  const { data, error } = await supabase.rpc("get_teacher_classes", {
    p_token: token,
  });
  if (error) throw error;
  return data;
}

export async function teacherRescheduleClass(token, classId, newScheduledAt) {
  const { data, error } = await supabase.rpc("teacher_reschedule_class", {
    p_token: token,
    p_class_id: classId,
    p_new_scheduled_at: newScheduledAt,
  });
  if (error) throw error;
  return data;
}
