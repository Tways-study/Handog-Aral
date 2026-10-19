"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Download, Trash2, Volume2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import Mascot from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useT } from "@/hooks/useT";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { offlinePackStatus, warmOfflinePack } from "@/lib/ocr/tesseract";
import { speak } from "@/lib/tts";
import { syncVocabularyProgress } from "@/lib/vocabulary";
import { clearAllData, queueSize } from "@/stores/db";
import { useProgress } from "@/stores/progress";
import { useSettings, type ColorOverlay, type FontSize, type Theme } from "@/stores/settings";
import type { Language } from "@/shared/schemas";
import { APP_VERSION } from "./version";

/** A settings group: heading, then rows divided by rules. No cards. */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="py-6 first:pt-2">
      <h2 id={id} className="mb-1 font-heading text-2xl font-bold">
        {title}
      </h2>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

function Row({ label, help, htmlFor, children, id }: { label: string; help?: string; htmlFor?: string; children: ReactNode; id?: string }) {
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
    </div>
  );
}

const mb = (bytes: number) => `${Math.max(0.1, bytes / 1_048_576).toFixed(1)} MB`;

export default function SettingsScreen() {
  const t = useT();
  const s = useSettings();
  return (
    <PageContainer>
      <PageHeader title={t.settings.title} subtitle={t.settings.subtitle} hideSettings />
      <div className="mx-auto max-w-2xl divide-y divide-line">
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
        </Section>

        <Section id="sec-language" title={t.settings.languageHeading}>
          <Row label={t.settings.languageLabel} help={t.settings.languageHelp} id="lbl-language">
            <ToggleGroup type="single" variant="outline" value={s.language} onValueChange={(v) => v && s.setLanguage(v as Language)} aria-labelledby="lbl-language">
              <ToggleGroupItem value="hiligaynon">{t.settings.hiligaynon}</ToggleGroupItem>
              <ToggleGroupItem value="tagalog">{t.settings.tagalog}</ToggleGroupItem>
            </ToggleGroup>
          </Row>
        </Section>

        <ReadingSection />

        <Section id="sec-appearance" title={t.settings.appearanceHeading}>
          <Row label={t.settings.themeLabel} help={t.settings.themeHelp} id="lbl-theme">
            <ToggleGroup type="single" variant="outline" value={s.theme} onValueChange={(v) => v && s.setTheme(v as Theme)} aria-labelledby="lbl-theme" className="flex-wrap">
              <ToggleGroupItem value="light">{t.settings.light}</ToggleGroupItem>
              <ToggleGroupItem value="dark">{t.settings.dark}</ToggleGroupItem>
              <ToggleGroupItem value="system">{t.settings.system}</ToggleGroupItem>
            </ToggleGroup>
          </Row>
        </Section>

        <OfflineSection />
        <DataSection />

        <Section id="sec-about" title={t.settings.aboutHeading}>
          <div className="flex items-center gap-4 py-4">
            <Mascot size={72} />
            <div>
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

const SPEEDS = [0.5, 0.8, 1.2] as const;

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
        <ToggleGroup type="single" variant="outline" value={fontSize} onValueChange={(v) => v && setFontSize(v as FontSize)} aria-labelledby="lbl-size">
          <ToggleGroupItem value="small">{t.settings.small}</ToggleGroupItem>
          <ToggleGroupItem value="medium">{t.settings.medium}</ToggleGroupItem>
          <ToggleGroupItem value="large">{t.settings.large}</ToggleGroupItem>
        </ToggleGroup>
      </Row>

      <Row label={t.settings.dyslexiaLabel} help={t.settings.dyslexiaHelp} htmlFor="dyslexia-font">
        <Switch id="dyslexia-font" checked={dyslexiaFont} onCheckedChange={setDyslexiaFont} />
      </Row>
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

      <div>
        <Row label={t.settings.overlayLabel} help={t.settings.overlayHelp} id="lbl-overlay">
          <ToggleGroup type="single" variant="outline" value={overlay} onValueChange={(v) => v && setOverlay(v as ColorOverlay)} aria-labelledby="lbl-overlay" className="flex-wrap">
            <ToggleGroupItem value="none">{t.settings.overlayNone}</ToggleGroupItem>
            <ToggleGroupItem value="yellow">{t.settings.overlayYellow}</ToggleGroupItem>
            <ToggleGroupItem value="blue">{t.settings.overlayBlue}</ToggleGroupItem>
            <ToggleGroupItem value="pink">{t.settings.overlayPink}</ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <p
          data-testid="overlay-preview"
          className={`mb-4 rounded-lg border-[1.5px] border-line px-4 py-3 text-lg ${overlay === "none" ? "bg-paper" : `overlay-${overlay}`}`}
        >
          {t.settings.overlayPreview}
        </p>
      </div>

      <Row label={t.settings.speedLabel} help={t.settings.speedHelp} id="lbl-speed">
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            type="single"
            variant="outline"
            value={String(ttsSpeed)}
            onValueChange={(v) => v && setTtsSpeed(Number(v))}
            aria-labelledby="lbl-speed"
          >
            <ToggleGroupItem value="0.5">{t.settings.slow}</ToggleGroupItem>
            <ToggleGroupItem value="0.8">{t.settings.normal}</ToggleGroupItem>
            <ToggleGroupItem value="1.2">{t.settings.fast}</ToggleGroupItem>
          </ToggleGroup>
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
          <Button variant={ready ? "secondary" : "ink"} disabled={!online || downloading} onClick={() => void download()}>
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
        <Button variant="outline" onClick={() => setOpen(true)}>
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
