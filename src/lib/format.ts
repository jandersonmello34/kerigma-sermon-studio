import { SermonStatus } from "@/lib/types";

export function timestampToDate(timestamp: string): Date | null {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(timestamp: string): string {
  const date = timestampToDate(timestamp);
  return date ? dateFormatter.format(date) : "Data indisponível";
}

export function formatDateTime(timestamp: string): string {
  const date = timestampToDate(timestamp);
  return date ? dateTimeFormatter.format(date) : "Data indisponível";
}

export function formatStatus(status: SermonStatus): string {
  return status === SermonStatus.ready ? "Pronto" : "Rascunho";
}

export function statusBadgeClass(status: SermonStatus): string {
  return status === SermonStatus.ready
    ? "border-success/40 bg-success/15 text-success"
    : "border-border bg-muted text-muted-foreground";
}

export function excerpt(text: string, maxLength = 140): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trimEnd()}…`;
}
