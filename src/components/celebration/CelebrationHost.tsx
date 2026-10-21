"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import Owl from "@/components/owl/Owl";
import StickerArt from "@/components/stickers/StickerArt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/hooks/useT";
import { buzz } from "@/lib/haptics";
import { confettiBurst, stampIn } from "@/lib/motion";
import { OUTFIT_UNLOCKS, stickerHint, stickerTitle } from "@/lib/stickers/catalog";
import { play } from "@/lib/sound";
import { useSettings } from "@/stores/settings";
import { useCelebrations, type CelebrationItem } from "./queue";

/**
 * Mounted once in Providers. Shows the first queued moment as a calm modal: the owl cheers, the sticker
 * stamps in, a small burst of confetti (none with reduced motion), and one clear button. It never
 * auto-advances; Escape, a tap outside, or the button closes it and the next one (if any) follows.
 */
export default function CelebrationHost() {
  const item = useCelebrations((s) => s.queue[0]);
  const waiting = useCelebrations((s) => s.queue.length - 1);
  const next = useCelebrations((s) => s.next);
  const t = useT();

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && next()}>
      {item && <Moment key={item.id} item={item} waiting={waiting} onDone={next} closeText={t.rewards.ok} />}
    </Dialog>
  );
}

function Moment({ item, waiting, onDone, closeText }: { item: CelebrationItem; waiting: number; onDone: () => void; closeText: string }) {
  const t = useT();
  const language = useSettings((s) => s.language);
  const stickerRef = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const title = item.sticker ? stickerTitle(item.sticker, language) : (item.title ?? "");
  const body = item.sticker ? stickerHint(item.sticker, language) : item.body;
  const outfit = item.sticker ? (Object.keys(OUTFIT_UNLOCKS) as (keyof typeof OUTFIT_UNLOCKS)[]).find((o) => OUTFIT_UNLOCKS[o] === item.sticker) : undefined;

  useEffect(() => {
    play(item.sticker ? "stamp" : "chime");
    buzz("success");
    const stop = [stickerRef.current ? stampIn(stickerRef.current, { delay: 0.12 }) : () => {}];
    const rect = (stage.current ?? document.body).getBoundingClientRect();
    stop.push(confettiBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.45 }, { count: 18 }));
    return () => stop.forEach((fn) => fn());
  }, [item.sticker]);

  return (
    <DialogContent showCloseButton={false} className="items-center text-center" data-testid="celebration">
      <div ref={stage} className="flex flex-col items-center gap-3">
        <Owl mood={item.owlMood ?? "cheer"} size={112} reaction={{ kind: "cheer", key: item.id }} />
        {item.sticker && (
          <>
            <p className="rounded-full bg-mango px-3 py-1 text-sm font-bold text-mango-fg">{t.rewards.newSticker}</p>
            <div ref={stickerRef} className="grid place-items-center">
              <StickerArt id={item.sticker} size={132} />
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <DialogTitle className="font-heading text-2xl leading-tight font-extrabold text-balance">{title}</DialogTitle>
        <DialogDescription className="text-base text-ink-2 text-balance">{body}</DialogDescription>
        {outfit && <p className="font-bold text-ink">{t.rewards.outfitUnlocked(t.stickers.outfits[outfit])}</p>}
      </div>
      <div className="flex w-full flex-col items-center gap-2">
        <Button size="lg" className="w-full sm:w-auto sm:min-w-48" onClick={onDone} autoFocus>
          <Check aria-hidden="true" />
          {closeText}
        </Button>
        {waiting > 0 && <p className="text-sm text-ink-2">{t.rewards.more(waiting)}</p>}
      </div>
    </DialogContent>
  );
}
