export type BookStatus = "new" | "progress" | "done";

export function bookStatus(pct: number): BookStatus {
  if (pct >= 100) return "done";
  if (pct > 0) return "progress";
  return "new";
}
