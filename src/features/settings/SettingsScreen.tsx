"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, Download, Sticker, Trash2, Vibrate, Volume2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import InstallAppButton from "@/components/InstallAppButton";
import Mascot from "@/components/Mascot";
import Owl from "@/components/owl/Owl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useT } from "@/hooks/useT";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { buzz } from "@/lib/haptics";
import { offlinePackStatus, warmOfflinePack } from "@/lib/ocr/tesseract";
import { play } from "@/lib/sound";
import { speak } from "@/lib/tts";
import { cn } from "@/lib/utils";
import { syncVocabularyProgress } from "@/lib/vocabulary";
import { clearAllData, queueSize } from "@/stores/db";
import { useProgress } from "@/stores/progress";
import { useSettings, type ColorOverlay, type FontSize, type Theme } from "@/stores/settings";
import type { Language } from "@/shared/schemas";
import { APP_VERSION } from "./version";

/** A settings group: one calm paper surface, heading, then rows divided by fine rules. */
function Section({ id, title, children, className }: { id: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("rounded-lg border-[1.5px] border-line bg-card shadow-sm", className)}>
      <h2 id={id} className="px-5 pt-5 font-heading text-xl font-bold">
        {title}
      </h2>
      <div className="divide-y divide-line px-5">{children}</div>
    </section>
  );
}

function Row({
  label,
  help,
  htmlFor,
  children,
  id,
  preview,
}: {
  label: string;
  help?: string;
  htmlFor?: string;
  children: ReactNode;
  id?: string;
  preview?: ReactNode;
}) {
  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
      <div className="min-w-0">
        {htmlFor ? (
          <Label htmlFor={htmlFor} className="text-base leading-snug font-bold">
            {label}
          </Label>
        ) : (
          <p id={id} className="text-base leading-snug font-bold">
            {label}
          </p>
        )}
        {help && <p className="mt-1 text-[0.9375rem] text-ink-2">{help}</p>}
      </div>
      <div className="min-w-0">{children}</div>
      {preview && <div className="sm:col-span-2">{preview}</div>}
    </div>
  );
}

/** The one choice control for the screen: same height, radius and selected state (fill plus a check) everywhere. */
function Segmented<T extends string>({
  value,
  onChange,
  options,
  labelledBy,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  labelledBy: string;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={2}
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-labelledby={labelledBy}
      className="w-full flex-wrap sm:w-auto"
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} className="h-auto min-h-12 flex-auto px-4 py-2 text-center leading-tight whitespace-normal sm:flex-none">
          {value === o.value && <Check aria-hidden="true" />}
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

const mb = (bytes: number) => `${Math.max(0.1, bytes / 1_048_576).toFixed(1)} MB`;

export default function SettingsScreen() {
  const t = useT();
  const s = useSettings();
  return (
    <PageContainer>
      <PageHeader
        title={t.settings.title}
        subtitle={t.settings.subtitle}
        hideSettings
        trailing={<Owl size={64} outfit="glasses" mood="idle" className="-mt-1" />}
      />
      <div className="flex max-w-2xl flex-col gap-6 pt-2">
        <Section id="sec-child" title={t.settings.childHeading}>
          <Row label={t.settings.nameLabel} help={t.settings.nameHelp} htmlFor="child-name">
            <Input
              id="child-name"
              value={s.childName}
              maxLength={30}
              placeholder={t.settings.namePlaceholder}
              onChange={(e) => s.setChildName(e.target.value)}
              className="sm:w-64"
              autoComplete="off"
            />
          </Row>
          <Row label={t.settings.languageLabel} help={t.settings.languageHelp} id="lbl-language">
            <Segmented<Language>
              value={s.language}
              onChange={s.setLanguage}
              labelledBy="lbl-language"
              options={[
                { value: "hiligaynon", label: t.settings.hiligaynon },
                { value: "tagalog", label: t.settings.tagalog },
              ]}
            />
          </Row>
        </Section>

        <ReadingSection />
        <FunSection />

        <Section id="sec-appearance" title={t.settings.appearanceHeading}>
          <Row label={t.settings.themeLabel} help={t.settings.themeHelp} id="lbl-theme">
            <Segmented<Theme>
              value={s.theme}
              onChange={s.setTheme}
              labelledBy="lbl-theme"
              options={[
                { value: "light", label: t.settings.light },
                { value: "dark", label: t.settings.dark },
                { value: "system", label: t.settings.system },
              ]}
            />
          </Row>
        </Section>

        {/* Hidden while the install control renders nothing (already installed, native app, unsupported browser). */}
        <section aria-labelledby="sec-app" className="rounded-lg border-[1.5px] border-line bg-card shadow-sm has-[.install-slot:empty]:hidden">
          <h2 id="sec-app" className="px-5 pt-5 font-heading text-xl font-bold">
            {t.settings.appHeading}
          </h2>
          <div className="install-slot px-5 py-4">
            <InstallAppButton />
          </div>
        </section>

        <OfflineSection />
        <DataSection />

        <Section id="sec-about" title={t.settings.aboutHeading}>
          <div className="flex items-center gap-4 py-4">
            <Mascot size={72} className="shrink-0" />
            <div className="min-w-0">
              <p className="font-heading text-xl font-bold">{t.settings.appName}</p>
              <p>{t.settings.tagline}</p>
              <p className="text-[0.9375rem] text-ink-2">{t.settings.version(APP_VERSION)}</p>
              <p className="mt-1 text-[0.9375rem] text-ink-2">{t.settings.owlCredit}</p>
            </div>
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

function FunSection() {
  const t = useT();
  const owl3d = useSettings((s) => s.owl3d);
  const setOwl3d = useSettings((s) => s.setOwl3d);
  const sound = useSettings((s) => s.sound);
  const setSound = useSettings((s) => s.setSound);
  const haptics = useSettings((s) => s.haptics);
  const setHaptics = useSettings((s) => s.setHaptics);

  return (
    <>
      <Section id="sec-fun" title={t.settings.funHeading}>
        <Row label={t.settings.owl3dLabel} help={t.settings.owl3dHelp} htmlFor="owl-3d">
          <Switch id="owl-3d" checked={owl3d} onCheckedChange={setOwl3d} />
        </Row>
        <Row label={t.settings.soundLabel} help={t.settings.soundHelp} htmlFor="sound-fx">
          <div className="flex flex-wrap items-center gap-3">
            <Switch id="sound-fx" checked={sound} onCheckedChange={setSound} />
            <Button variant="secondary" size="sm" className="h-auto min-h-11 max-w-full shrink py-2 whitespace-normal" disabled={!sound} onClick={() => play("chime")}>
              <Volume2 aria-hidden="true" />
              {t.settings.soundTest}
            </Button>
          </div>
        </Row>
        <Row label={t.settings.vibrationLabel} help={t.settings.vibrationHelp} htmlFor="vibration">
          <div className="flex flex-wrap items-center gap-3">
            <Switch id="vibration" checked={haptics} onCheckedChange={setHaptics} />
            <Button variant="secondary" size="sm" className="h-auto min-h-11 max-w-full shrink py-2 whitespace-normal" disabled={!haptics} onClick={() => buzz("success")}>
              <Vibrate aria-hidden="true" />
              {t.settings.vibrationTest}
            </Button>
          </div>
        </Row>
      </Section>
      <Section id="sec-owl" title={t.settings.owlHeading}>
        <Row label={t.settings.owlRowLabel} help={t.settings.owlRowHelp}>
          <Button asChild variant="secondary" className="h-auto min-h-12 max-w-full py-2 whitespace-normal">
            <Link href="/stickers">
              <Sticker aria-hidden="true" />
              {t.settings.owlRowLink}
            </Link>
          </Button>
        </Row>
      </Section>
    </>
  );
}

function ReadingSection() {
  const t = useT();
  const fontSize = useSettings((s) => s.fontSize);
  const setFontSize = useSettings((s) => s.setFontSize);
  const dyslexiaFont = useSettings((s) => s.dyslexiaFont);
  const setDyslexiaFont = useSettings((s) => s.setDyslexiaFont);
  const overlay = useSettings((s) => s.colorOverlay);
  const setOverlay = useSettings((s) => s.setColorOverlay);
  const ttsSpeed = useSettings((s) => s.ttsSpeed);
  const setTtsSpeed = useSettings((s) => s.setTtsSpeed);

  return (
    <Section id="sec-reading" title={t.settings.readingHeading}>
      <Row label={t.settings.fontSizeLabel} help={t.settings.fontSizeHelp} id="lbl-size">
        <Segmented<FontSize>
          value={fontSize}
          onChange={setFontSize}
          labelledBy="lbl-size"
          options={[
            { value: "small", label: t.settings.small },
            { value: "medium", label: t.settings.medium },
            { value: "large", label: t.settings.large },
          ]}
        />
      </Row>

      <Row
        label={t.settings.dyslexiaLabel}
        help={t.settings.dyslexiaHelp}
        htmlFor="dyslexia-font"
        preview={
          <p
            data-testid="dyslexia-preview"
            data-dyslexic={dyslexiaFont ? "on" : "off"}
            className="rounded-lg bg-paper-2 px-4 py-3 text-lg"
            style={{
              fontFamily: dyslexiaFont ? "var(--font-opendyslexic), var(--font-atkinson), system-ui, sans-serif" : "var(--font-atkinson), system-ui, sans-serif",
              wordSpacing: dyslexiaFont ? "0.3em" : undefined,
              letterSpacing: dyslexiaFont ? "0.05em" : undefined,
            }}
          >
            {t.settings.dyslexiaPreview}
          </p>
        }
      >
        <Switch id="dyslexia-font" checked={dyslexiaFont} onCheckedChange={setDyslexiaFont} />
      </Row>

      <Row
        label={t.settings.overlayLabel}
        help={t.settings.overlayHelp}
        id="lbl-overlay"
        preview={
          <p
            data-testid="overlay-preview"
            className={`rounded-lg border-[1.5px] border-line px-4 py-3 text-lg ${overlay === "none" ? "bg-paper" : `overlay-${overlay}`}`}
          >
            {t.settings.overlayPreview}
          </p>
        }
      >
        <Segmented<ColorOverlay>
          value={overlay}
          onChange={setOverlay}
          labelledBy="lbl-overlay"
          options={[
            { value: "none", label: t.settings.overlayNone },
            { value: "yellow", label: t.settings.overlayYellow },
            { value: "blue", label: t.settings.overlayBlue },
            { value: "pink", label: t.settings.overlayPink },
          ]}
        />
      </Row>

      <Row label={t.settings.speedLabel} help={t.settings.speedHelp} id="lbl-speed">
        <div className="flex flex-col gap-3 sm:items-end">
          <Segmented<"0.5" | "0.8" | "1.2">
            value={String(ttsSpeed) as "0.5" | "0.8" | "1.2"}
            onChange={(v) => setTtsSpeed(Number(v))}
            labelledBy="lbl-speed"
            options={[
              { value: "0.5", label: t.settings.slow },
              { value: "0.8", label: t.settings.normal },
              { value: "1.2", label: t.settings.fast },
            ]}
          />
          <Button variant="ink" size="sm" onClick={() => void speak(t.settings.listenSample, { rate: ttsSpeed })}>
            <Volume2 aria-hidden="true" />
            {t.settings.listen}
          </Button>
        </div>
      </Row>
    </Section>
  );
}

type PackInfo = { cached: boolean; bytes: number; total: number };

function OfflineSection() {
  const t = useT();
  const { online } = useOnlineStatus();
  const [pack, setPack] = useState<PackInfo | "checking">("checking");
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const downloading = progress !== null;

  const refresh = useCallback(async () => {
    const [p, q] = await Promise.all([offlinePackStatus(), queueSize()]);
    setPack(p);
    setPending(q);
  }, []);

  useEffect(() => {
    // Initial async read of external state (Cache Storage and IndexedDB).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  async function download() {
    setProgress(0);
    try {
      await warmOfflinePack((p) => setProgress(Math.round(p * 100)));
      toast.success(t.settings.packDone);
    } catch {
      toast.error(t.settings.packFailed);
    } finally {
      setProgress(null);
      void refresh();
    }
  }

  let status: string;
  if (pack === "checking") status = t.settings.packChecking;
  else if (pack.total === 0) status = t.settings.packUnknown;
  else if (pack.cached) status = t.settings.packReady(mb(pack.bytes));
  else if (pack.bytes > 0) status = t.settings.packPartial(mb(pack.bytes), mb(pack.total));
  else status = t.settings.packMissing(mb(pack.total));

  const ready = pack !== "checking" && pack.cached;

  return (
    <Section id="sec-offline" title={t.settings.offlineHeading}>
      <Row label={t.settings.connectionLabel}>
        <p className="flex items-center gap-2 font-bold" data-testid="connection">
          {online ? <Wifi aria-hidden="true" className="size-5 text-success" /> : <WifiOff aria-hidden="true" className="size-5 text-warning-text" />}
          {online ? t.settings.online : t.settings.offline}
        </p>
      </Row>
      <div className="py-4">
        <p className="font-bold">{t.settings.packLabel}</p>
        <p className="mt-1 text-[0.9375rem] text-ink-2">{t.settings.packHelp}</p>
        <p className="mt-2 font-bold" data-testid="pack-status">
          {status}
        </p>
        {progress !== null && (
          <div className="mt-3 flex items-center gap-3">
            <Progress value={progress} aria-label={t.settings.downloadingPct(progress)} />
            <span className="w-12 shrink-0 text-right font-bold tabular-nums">{progress}%</span>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button className="h-auto min-h-12 max-w-full shrink py-2 whitespace-normal" variant={ready ? "secondary" : "ink"} disabled={!online || downloading} onClick={() => void download()}>
            <Download aria-hidden="true" />
            {downloading ? t.settings.downloading : ready ? t.settings.downloadAgain : t.settings.download}
          </Button>
          {!online && <p className="text-[0.9375rem] text-warning-text">{t.settings.needOnline}</p>}
        </div>
      </div>
      <Row label={t.settings.pendingLabel} help={t.settings.pendingHelp}>
        <p className="font-bold" data-testid="pending">
          {pending === null ? t.settings.packChecking : t.settings.pendingCount(pending)}
        </p>
      </Row>
    </Section>
  );
}

function DataSection() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function reset() {
    setBusy(true);
    try {
      await clearAllData();
      useProgress.getState().resetAll();
      await syncVocabularyProgress();
      setOpen(false);
      toast.success(t.settings.resetDone);
    } catch {
      toast.error(t.settings.resetFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section id="sec-data" title={t.settings.dataHeading}>
      <Row label={t.settings.resetLabel} help={t.settings.resetHelp}>
        <Button className="h-auto min-h-12 max-w-full shrink py-2 whitespace-normal" variant="outline" onClick={() => setOpen(true)}>
          <Trash2 aria-hidden="true" />
          {t.settings.resetButton}
        </Button>
      </Row>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{t.settings.resetTitle}</DialogTitle>
            <DialogDescription>{t.settings.resetBody}</DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-1 pl-5">
            {t.settings.resetItems.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <p className="text-[0.9375rem] text-ink-2">{t.settings.resetKept}</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t.settings.resetCancel}
            </Button>
            <Button variant="destructive" disabled={busy} onClick={() => void reset()}>
              {t.settings.resetConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
