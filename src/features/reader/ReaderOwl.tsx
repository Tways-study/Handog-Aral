"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Owl, { type OwlMood, type OwlReaction } from "@/components/owl/Owl";
import { cn } from "@/lib/utils";
import OwlTag from "./OwlTag";

/** How long the mobile owl's one-line tag stays before it fades, in ms. */
export const PEEK_TAG_MS = 4000;
export const PEEK_OWL_SIZE = 72;

/**
 * Mobile Reader: the hero owl peeks over the bottom nav with a one-line tag that fades after ~4 s (once per mount, not
 * on every tap). It never covers the page: it only shows while the page text ends above it (measured with one rect per
 * animation frame while scrolling), it is hidden while the word sheet is open, ignores pointers and is decorative.
 */
export function PeekOwl({
  contentRef,
  hidden,
  tag,
  mood = "idle",
  reaction,
}: {
  /** The block holding all the page's text; the owl shows only when this ends above it. */
  contentRef: RefObject<HTMLElement | null>;
  hidden: boolean;
  tag: string;
  mood?: OwlMood;
  reaction?: OwlReaction;
}) {
  const owlRef = useRef<HTMLDivElement>(null);
  const [clear, setClear] = useState(true);
  const [tagOn, setTagOn] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setTagOn(false), PEEK_TAG_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const content = contentRef.current;
      const owl = owlRef.current;
      if (!content || !owl) return;
      setClear(content.getBoundingClientRect().bottom <= owl.getBoundingClientRect().top - 6);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const ro = typeof ResizeObserver !== "undefined" && contentRef.current ? new ResizeObserver(schedule) : null;
    if (ro && contentRef.current) ro.observe(contentRef.current);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro?.disconnect();
    };
  }, [contentRef]);

  const shown = clear && !hidden;
  return (
    <div
      ref={owlRef}
      data-slot="peek-owl"
      data-shown={shown || undefined}
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed right-3 z-30 flex items-end gap-1.5 transition-opacity duration-200 lg:hidden",
        shown ? "opacity-100" : "opacity-0",
      )}
      style={{ bottom: "calc(var(--nav-h) + env(safe-area-inset-bottom, 0px) - 14px)" }}
    >
      <OwlTag
        tail="right"
        className={cn("mb-5 max-w-[11.5rem] py-1.5 text-[0.8125rem] leading-snug font-bold transition-opacity duration-300", tagOn ? "opacity-100" : "opacity-0")}
      >
        {tag}
      </OwlTag>
      <Owl mood={mood} size={PEEK_OWL_SIZE} priority="hero" reaction={reaction} />
    </div>
  );
}

/**
 * Desktop Reader: the right pane's hero owl with its tag. The tag says how many words of this page the child has already
 * saved, or what to do next; moments (first tap, first save) borrow it for a moment.
 */
export function PaneOwl({ tag, mood = "idle", reaction }: { tag: string; mood?: OwlMood; reaction?: OwlReaction }) {
  return (
    <div data-slot="pane-owl" className="flex items-end gap-3">
      <Owl mood={mood} size={88} priority="hero" reaction={reaction} className="-mb-1" />
      <OwlTag tail="left" className="mb-4 min-w-0 flex-1 text-[0.9375rem] leading-snug font-bold" role="status" aria-live="polite">
        {tag}
      </OwlTag>
    </div>
  );
}
