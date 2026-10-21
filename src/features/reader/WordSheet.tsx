"use client";

import type { ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import Owl, { type OwlMood } from "@/components/owl/Owl";
import OwlTag from "./OwlTag";

export interface SheetMoment {
  /** Changes for each moment, so the owl replays its reaction. */
  key: number;
  text: string;
  mood: OwlMood;
}

/**
 * The mobile word sheet: the shadcn drawer's look with a LIGHTER scrim, so the child keeps the feeling of "I am still
 * on my page" (the page text stays readable behind it). A moment (first tap, first save) perches the owl on the
 * sheet's top-right corner with a one-line tag; it overlaps the sheet's edge, never the text inside it.
 */
export default function WordSheet({
  open,
  onOpenChange,
  title,
  onCloseAutoFocus,
  moment,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onCloseAutoFocus?: (e: Event) => void;
  moment: SheetMoment | null;
  children: ReactNode;
}) {
  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange} autoFocus data-slot="drawer">
      <DrawerPrimitive.Portal data-slot="drawer-portal">
        <DrawerPrimitive.Overlay data-slot="drawer-overlay" className="ui-fade fixed inset-0 z-50 bg-scrim/50" />
        <DrawerPrimitive.Content
          data-slot="drawer-content"
          onCloseAutoFocus={onCloseAutoFocus}
          className="group/drawer-content fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[80vh] flex-col rounded-t-[1.75rem] border-t-[1.5px] bg-background shadow-sheet"
        >
          {moment && (
            <div data-slot="sheet-moment" className="pointer-events-none absolute -top-[3.25rem] right-3 flex items-end gap-1.5" role="status">
              {moment.text && (
                <OwlTag tail="right" className="mb-3 max-w-[14rem] py-1.5 text-[0.9375rem] leading-tight font-bold">
                  {moment.text}
                </OwlTag>
              )}
              <Owl mood={moment.mood} size={64} reaction={{ kind: moment.mood === "cheer" ? "cheer" : "hop", key: moment.key }} />
            </div>
          )}
          <div className="mx-auto mt-2.5 h-[5px] w-11 shrink-0 rounded-full bg-border" />
          <DrawerPrimitive.Title className="sr-only">{title}</DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">{title}</DrawerPrimitive.Description>
          <div className="max-h-[calc(60dvh-1rem)] overflow-y-auto overscroll-contain px-5 pt-3" data-vaul-no-drag>
            {children}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
