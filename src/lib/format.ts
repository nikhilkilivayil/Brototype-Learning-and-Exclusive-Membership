/** Strips everything but digits and +, for spacing-insensitive comparisons. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/** ₹ formatter used across the UI (en-IN digit grouping). Client-safe. */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Deterministic date formatting (explicit locale + options) so server and
 * client render identical strings — avoids hydration mismatches.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso)
    .toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
    // ICU versions differ on the space before am/pm (NNBSP vs ASCII);
    // normalize so server and client always render identical strings.
    .replace(/[  ]/g, " ");
}
