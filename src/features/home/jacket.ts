import type { Jacket } from "@/shared/types";

/** Notebook cloth + its readable text colour (complete class names so Tailwind can see them). */
export const JACKET_CLASS: Record<Jacket, string> = {
  indigo: "bg-indigo text-indigo-fg",
  kangkong: "bg-kangkong text-kangkong-fg",
  mango: "bg-mango text-mango-fg",
  gumamela: "bg-gumamela text-gumamela-fg",
};
