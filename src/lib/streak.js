// Consecutive-day study streak, computed client-side from session dates.
// Per the spec this is never stored — a streak count that lived in a
// column would go stale the moment a session was edited or deleted.

export function calculateStreak(sessionDates) {
  const uniqueDays = new Set(sessionDates);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // If today has no session yet, start counting from yesterday instead —
  // otherwise a streak would falsely reset to 0 every morning before
  // you've had a chance to study.
  const todayISO = cursor.toISOString().slice(0, 10);
  if (!uniqueDays.has(todayISO)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
