"use client";

import { useMemo, useState } from "react";
import { Copy, Download, FileText, WrapText } from "lucide-react";
import { ControlSelect } from "@/components/control-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type LogTailCount = 10 | 50 | 100 | 200 | 500;

const logTailOptions: Array<{ value: string; label: string }> = [10, 50, 100, 200, 500].map(
  (count) => ({ value: String(count), label: String(count) })
);

const warningPattern = /\bwarn(?:ing)?\b/i;
const errorPattern = /\b(?:error|err|fatal|panic|exception)\b/i;

export function ContainerLogReader({
  logs,
  loading,
  error,
  onReload,
  tail,
  onTailChange,
  timestamps,
  onTimestampsChange,
}: {
  logs: string | null;
  loading: boolean;
  error: string | null;
  onReload: () => void;
  tail: LogTailCount;
  onTailChange: (tail: LogTailCount) => void;
  timestamps: boolean;
  onTimestampsChange: (timestamps: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [wrap, setWrap] = useState(true);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const filteredText = useMemo(() => {
    if (logs == null) {
      return "";
    }
    const query = search.trim().toLowerCase();
    if (!query) {
      return logs;
    }
    return logs
      .split(/\r?\n/)
      .filter((line) => line.toLowerCase().includes(query))
      .join("\n");
  }, [logs, search]);

  const lines = useMemo(
    () => (filteredText ? filteredText.split(/\r?\n/) : []),
    [filteredText]
  );

  async function copyVisible() {
    if (!filteredText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(filteredText);
      setCopyStatus("Copied visible logs.");
    } catch {
      setCopyStatus("Could not copy logs.");
    }
  }

  function downloadVisible() {
    if (!filteredText) {
      return;
    }
    const blob = new Blob([filteredText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "container-logs.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="min-w-0 flex-1 space-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Filter lines</span>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search visible log text"
            aria-label="Filter log lines"
          />
        </label>
        <ControlSelect
          label="Lines"
          value={String(tail)}
          options={logTailOptions}
          onChange={(value) => onTailChange(Number(value) as LogTailCount)}
          className="min-w-[6rem]"
        />
        <div className="flex flex-wrap items-center gap-3 pb-0.5">
          <div className="flex items-center gap-2">
            <Switch
              id="log-timestamps"
              checked={timestamps}
              onCheckedChange={onTimestampsChange}
            />
            <Label htmlFor="log-timestamps" className="text-xs">
              Timestamps
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="log-wrap" checked={wrap} onCheckedChange={setWrap} />
            <Label htmlFor="log-wrap" className="text-xs">
              Wrap
            </Label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onReload} disabled={loading}>
            <FileText />
            {loading ? "Loading…" : "Reload"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void copyVisible()}
            disabled={!filteredText}
          >
            <Copy />
            Copy
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={downloadVisible}
            disabled={!filteredText}
          >
            <Download />
            Download
          </Button>
        </div>
      </div>

      {copyStatus ? (
        <p className="text-xs text-muted-foreground" role="status">
          {copyStatus}
        </p>
      ) : null}

      {loading && logs == null ? (
        <p className="text-sm text-muted-foreground">Loading logs…</p>
      ) : error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : logs == null ? (
        <p className="text-sm text-muted-foreground">Logs have not been loaded yet.</p>
      ) : lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matching logs returned.</p>
      ) : (
        <pre
          className={cn(
            "max-h-[min(28rem,50dvh)] overflow-auto rounded-lg border border-emerald-500/20 bg-background/70 p-3 font-mono text-xs leading-relaxed",
            wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
          )}
        >
          {lines.map((line, index) => (
            <span
              key={`${index}-${line.slice(0, 24)}`}
              className={cn(
                "block",
                severityClass(line)
              )}
            >
              {line || " "}
            </span>
          ))}
        </pre>
      )}

      <p className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
        <WrapText className="size-3" />
        Warn/error keywords are highlighted. Copy and download use the filtered text only.
      </p>
    </div>
  );
}

function severityClass(line: string) {
  if (errorPattern.test(line)) {
    return "text-rose-200/95 bg-rose-500/10";
  }
  if (warningPattern.test(line)) {
    return "text-amber-200/90 bg-amber-500/10";
  }
  return "text-foreground/90";
}
