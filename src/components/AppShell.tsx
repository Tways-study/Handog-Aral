"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Book, House, NotebookText, ScanLine, Settings, SquareCheckBig, type LucideIcon } from "lucide-react";
import Mascot from "@/components/Mascot";
import OfflineBanner from "@/components/OfflineBanner";
import { useT } from "@/hooks/useT";
import { fadeRoute } from "@/lib/motion";
import { tabPop } from "@/lib/motionPages";
import { cn } from "@/lib/utils";

type NavId = "home" | "books" | "scan" | "words" | "quiz";

interface NavItem {
  id: NavId;
  href: string;
  icon: LucideIcon;
  /** Extra path prefixes that count as "inside" this destination (the reader belongs to Libro). */
  also?: string[];
}

/**
 * /play (the memory game over the child's saved words) and /stickers (what the child has earned) are not tabs
 * of their own: no sixth tab. They light up Pulong, the collection the child is building.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "home", href: "/", icon: House },
  { id: "books", href: "/books", icon: Book, also: ["/read"] },
  { id: "scan", href: "/scan", icon: ScanLine },
  { id: "words", href: "/words", icon: NotebookText, also: ["/play", "/stickers"] },
  { id: "quiz", href: "/quiz", icon: SquareCheckBig },
];

const FOCUS = "focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Dispatch `new CustomEvent("handog:pop-tab", { detail: "words" })` to give that tab icon one 1.2x pop. */
export const POP_TAB_EVENT = "handog:pop-tab";

const LABEL_KEY = {
  home: "navHome",
  books: "navBooks",
  scan: "navScan",
  words: "navWords",
  quiz: "navQuiz",
} as const;

export function isActive(pathname: string, item: Pick<NavItem, "href" | "also">): boolean {
  if (item.href === "/") return pathname === "/";
  return [item.href, ...(item.also ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Gear link for page headers below lg (the rail carries Settings at lg+). */
export function SettingsLink({ className }: { className?: string }) {
  const t = useT();
  const pathname = usePathname();
  return (
    <Link
      href="/settings"
      aria-label={t.shell.navSettings}
      aria-current={pathname.startsWith("/settings") ? "page" : undefined}
      className={cn(
        "pressable grid size-11 shrink-0 place-items-center rounded-[0.875rem] border-[1.5px] border-border bg-background text-foreground outline-none hover:bg-secondary active:bg-secondary focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <Settings aria-hidden="true" className="size-[22px]" />
    </Link>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav
      aria-label={t.shell.mainNavLabel}
      data-slot="bottom-nav"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-end border-t-[1.5px] border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
      style={{ minHeight: "calc(var(--nav-h) + env(safe-area-inset-bottom, 0px))" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        const label = t.shell[LABEL_KEY[item.id]];
        if (item.id === "scan") {
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn("group flex min-h-[3.25rem] items-end justify-center pb-1.5 outline-none touch-manipulation", "[&:focus-visible>span]:outline-solid [&:focus-visible>span]:outline-3 [&:focus-visible>span]:outline-offset-2 [&:focus-visible>span]:outline-ring")}
            >
              <span
                className={cn(
                  "grid size-16 -translate-y-3.5 place-items-center rounded-[1.375rem] bg-primary text-primary-foreground shadow-cta transition-[translate,box-shadow] duration-150 group-active:shadow-pressed motion-safe:group-active:-translate-y-3 hover:bg-primary/90",
                  active && "outline-solid outline-3 outline-offset-2 outline-ink",
                )}
              >
                <Icon aria-hidden="true" className="size-7" strokeWidth={2.4} />
              </span>
            </Link>
          );
        }
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "pressable flex min-h-[3.25rem] min-w-0 flex-col items-center justify-end gap-[3px] rounded-lg px-0.5 pb-1.5 text-center text-xs leading-tight font-bold outline-none hover:text-ink",
              FOCUS,
              active ? "text-ink" : "text-ink-2",
            )}
          >
            <Icon aria-hidden="true" data-tab-icon={item.id} className="size-[22px] shrink-0" />
            <span className="line-clamp-2 max-w-full [word-spacing:0] text-balance [overflow-wrap:anywhere] [letter-spacing:0] [html.font-large_&]:text-[0.5625rem]">{label}</span>
            <span
              aria-hidden="true"
              className={cn("mt-px h-[3px] w-[18px] rounded-full", active ? "bg-primary" : "bg-transparent")}
            />
          </Link>
        );
      })}
    </nav>
  );
}

function Rail() {
  const pathname = usePathname();
  const t = useT();
  const railLink = (active: boolean) =>
    cn(
      "pressable flex min-h-16 w-[4.75rem] flex-col items-center justify-center gap-1 rounded-2xl text-[0.8125rem] font-bold outline-none hover:bg-secondary/70 active:bg-secondary",
      FOCUS,
      active ? "bg-secondary text-ink" : "text-ink-2",
    );
  return (
    <nav
      aria-label={t.shell.mainNavLabel}
      data-slot="nav-rail"
      className="fixed inset-y-0 left-0 z-40 hidden w-[var(--rail-w)] flex-col items-center gap-1.5 border-r-[1.5px] border-border bg-background py-5 lg:flex"
    >
      <Mascot size={52} className="mb-4" />
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        const label = t.shell[LABEL_KEY[item.id]];
        if (item.id === "scan") {
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "pressable my-2 grid size-[3.75rem] place-items-center rounded-[1.25rem] bg-primary text-primary-foreground shadow-cta outline-none hover:bg-primary/90 active:shadow-pressed",
                FOCUS,
                active && "outline-solid outline-3 outline-offset-2 outline-ink",
              )}
            >
              <Icon aria-hidden="true" className="size-7" strokeWidth={2.4} />
            </Link>
          );
        }
        return (
          <Link key={item.id} href={item.href} aria-current={active ? "page" : undefined} className={railLink(active)}>
            <Icon aria-hidden="true" data-tab-icon={item.id} className="size-[22px]" />
            {label}
          </Link>
        );
      })}
      <span className="flex-1" />
      <Link
        href="/settings"
        aria-current={pathname.startsWith("/settings") ? "page" : undefined}
        className={railLink(pathname.startsWith("/settings"))}
      >
        <Settings aria-hidden="true" className="size-[22px]" />
        {t.shell.navSettings}
      </Link>
    </nav>
  );
}

/**
 * The app frame: bottom nav below lg, a left rail at lg+, a skip link, the offline banner and one
 * <main>. Screens render inside it with <PageContainer> and <PageHeader>. Full-bleed routes
 * (/welcome) get no navigation.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const t = useT();
  const bare = pathname.startsWith("/welcome");
  const mainRef = useRef<HTMLElement>(null);

  // A subtle fade on route change (no-op under prefers-reduced-motion).
  useEffect(() => fadeRoute(mainRef.current), [pathname]);

  // Other screens ask for a tab to pop once ("something new is in Pulong").
  useEffect(() => {
    const stops = new Set<() => void>();
    const onPop = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (typeof id !== "string" || !(id in LABEL_KEY)) return;
      document.querySelectorAll(`[data-tab-icon="${id}"]`).forEach((icon) => {
        const stop = tabPop(icon);
        stops.add(stop);
      });
    };
    window.addEventListener(POP_TAB_EVENT, onPop);
    return () => {
      window.removeEventListener(POP_TAB_EVENT, onPop);
      stops.forEach((stop) => stop());
    };
  }, []);

  return (
    <div className="min-h-dvh text-foreground">
      <a
        href="#main"
        className="sr-only z-50 rounded-[0.875rem] bg-foreground px-4 py-3 font-bold text-background focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        {t.shell.skipToContent}
      </a>
      {!bare && <Rail />}
      <div className={cn(!bare && "lg:pl-[var(--rail-w)]")}>
        <OfflineBanner />
        <main id="main" ref={mainRef} tabIndex={-1} className="outline-none">
          {children}
        </main>
      </div>
      {!bare && <BottomNav />}
    </div>
  );
}
