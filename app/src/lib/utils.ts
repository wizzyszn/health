import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function getResolvedTimeZone(timeZone?: string | null) {
  return timeZone || getBrowserTimeZone();
}

function formatMonthForTimeZone(date: Date, timeZone?: string | null) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: getResolvedTimeZone(timeZone),
  }).format(date);
}

export function formatLocalDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatZonedDate(
  dateInput: string | Date,
  options: Intl.DateTimeFormatOptions,
  locales?: string | string[],
  timeZone?: string | null,
) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  return new Intl.DateTimeFormat(locales, {
    ...options,
    timeZone: getResolvedTimeZone(timeZone),
  }).format(date);
}

export function formatUtcDate(
  dateInput: string | Date,
  options: Intl.DateTimeFormatOptions,
  locales?: string | string[],
  timeZone?: string | null,
) {
  return formatZonedDate(dateInput, options, locales, timeZone);
}

export function formatZonedTime(
  dateInput: string | Date,
  {
    locales = "en-US",
    spacedMeridiem = true,
    timeZone,
  }: {
    locales?: string | string[];
    spacedMeridiem?: boolean;
    timeZone?: string | null;
  } = {},
) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const formattedTime = new Intl.DateTimeFormat(locales, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: getResolvedTimeZone(timeZone),
  }).format(date);

  return spacedMeridiem
    ? formattedTime
    : formattedTime.replace(/\s(?=[AP]M$)/, "");
}

export function formatZonedTimeRange(
  startDateInput: string | Date,
  endDateInput: string | Date,
  options?: {
    locales?: string | string[];
    spacedMeridiem?: boolean;
    timeZone?: string | null;
  },
) {
  return `${formatZonedTime(startDateInput, options)} - ${formatZonedTime(endDateInput, options)}`;
}

export function getZonedAppointmentDateTime(
  scheduledStartAtUtc?: string | null,
  scheduledEndAtUtc?: string | null,
  timeZone?: string | null,
) {
  if (!scheduledStartAtUtc || !scheduledEndAtUtc) {
    return { date: { day: 0, month: "N/A" }, time: "N/A" };
  }

  const startDate = new Date(scheduledStartAtUtc);
  const endDate = new Date(scheduledEndAtUtc);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { date: { day: 0, month: "N/A" }, time: "N/A" };
  }

  const resolvedTimeZone = getResolvedTimeZone(timeZone);

  return {
    date: {
      day: parseInt(
        new Intl.DateTimeFormat("en-US", {
          day: "numeric",
          timeZone: resolvedTimeZone,
        }).format(startDate),
      ),
      month: formatMonthForTimeZone(startDate, resolvedTimeZone),
    },
    time: formatZonedTimeRange(scheduledStartAtUtc, scheduledEndAtUtc, {
      spacedMeridiem: false,
      timeZone: resolvedTimeZone,
    }),
  };
}

// ─── Video session error handling ──────────────────────────────────────────

function getErrorData(error: unknown): Record<string, unknown> | null {
  if (!error || typeof error !== "object") return null;

  const errorRecord = error as Record<string, unknown>;
  const response = errorRecord.response;

  if (response && typeof response === "object" && "data" in response) {
    const data = (response as Record<string, unknown>).data;
    if (data && typeof data === "object") {
      return data as Record<string, unknown>;
    }
  }

  if ("data" in errorRecord && typeof errorRecord.data === "object") {
    return errorRecord.data as Record<string, unknown>;
  }

  return null;
}

function extractScheduledTimeFromMessage(message: string): Date | null {
  const match = message.match(
    /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)/,
  );

  if (!match?.[1]) return null;

  const scheduledTime = new Date(match[1]);
  return isNaN(scheduledTime.getTime()) ? null : scheduledTime;
}

function formatVideoScheduledTimeError(message: string, code?: string) {
  const scheduledTime = extractScheduledTimeFromMessage(message);
  const isScheduledTimeErrorMessage =
    code === "006" || message.toLowerCase().includes("scheduled time");

  if (!isScheduledTimeErrorMessage || !scheduledTime) {
    return null;
  }

  return `Video session can only be started at ${formatScheduledTimeMessage(scheduledTime)}. Please join at the scheduled time.`;
}

function getRawApiErrorMessage(error: unknown): {
  message: string;
  code?: string;
} {
  const data = getErrorData(error);
  const responseDescription = data?.response_description;
  const responseMessage = data?.message;
  const responseCode = data?.response_code as string | undefined;

  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return { message: responseMessage, code: responseCode };
  }

  if (typeof responseDescription === "string" && responseDescription.trim()) {
    return { message: responseDescription, code: responseCode };
  }

  if (error instanceof Error && error.message.trim()) {
    return {
      message: error.message.replace(/,\s*status:\s*\d+$/i, ""),
      code: responseCode,
    };
  }

  if (typeof error === "string" && error.trim()) {
    return { message: error, code: responseCode };
  }

  return { message: "", code: responseCode };
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const { message, code } = getRawApiErrorMessage(error);

  if (message) {
    return formatVideoScheduledTimeError(message, code) || message;
  }

  return fallback;
}

export function isScheduledTimeError(
  error: unknown,
): error is { response: { data: { response_code: string } } } {
  const data = getErrorData(error);
  const message = getApiErrorMessage(error, "");
  const code = data?.response_code as string | undefined;

  return message.includes("scheduled time") || code === "006";
}

export function extractScheduledTimeFromError(error: unknown): Date | null {
  const { message } = getRawApiErrorMessage(error);
  return extractScheduledTimeFromMessage(message);
}

export function formatScheduledTimeMessage(scheduledTime: Date): string {
  return scheduledTime.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
