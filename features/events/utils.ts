export function isPastEvent(dateISO?: string | null): boolean {
  if (!dateISO) return false;
  const ts = new Date(dateISO).getTime();
  if (isNaN(ts)) return false;
  return ts < Date.now();
}

export function splitEventsByDate<T extends { fecha?: string }>(events: T[]) {
  const upcoming: T[] = [];
  const past: T[] = [];
  events.forEach((e) => {
    const d = e.fecha ? new Date(e.fecha).getTime() : NaN;
    if (!e.fecha || isNaN(d) || d >= Date.now()) upcoming.push(e);
    else past.push(e);
  });
  return { upcoming, past };
}
