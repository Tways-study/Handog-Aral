import Mascot from "@/components/Mascot";
import { cn } from "@/lib/utils";

interface EmptyPanelPromptProps {
  title: string;
  body: string;
  className?: string;
}

/**
 * The docked panel before anything is chosen: the thinking owl, one short instruction, one line of help.
 * Shared by the Reader's right column and the Words detail column so the two never drift apart.
 */
export default function EmptyPanelPrompt({ title, body, className }: EmptyPanelPromptProps) {
  return (
    <div data-slot="empty-panel" className={cn("flex flex-col items-center gap-3 px-2 py-10 text-center", className)}>
      <Mascot mood="think" size={96} />
      <h2 className="font-heading text-2xl font-bold">{title}</h2>
      <p className="max-w-[16rem] text-base text-ink-2">{body}</p>
    </div>
  );
}
