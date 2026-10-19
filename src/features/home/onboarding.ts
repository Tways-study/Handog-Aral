/**
 * First-run rule. A child is sent to /welcome only when nothing says they have been here before:
 * not onboarded, no name, and no saved words. Existing users (a name or saved progress) stay.
 */
export function needsWelcome(s: { onboarded: boolean; childName: string; savedWordCount: number }): boolean {
  return !s.onboarded && !s.childName.trim() && s.savedWordCount <= 0;
}
