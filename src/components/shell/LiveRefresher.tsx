"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 4000;
const SSE_ERRORS_BEFORE_FALLBACK = 3;

/**
 * Keeps every page live without manual reloads.
 *
 * Primary channel: an SSE stream (/api/live) PUSHES the data version the
 * moment anything changes — new question, reply, purchase, admin edit —
 * and the page's server data re-renders in place via router.refresh().
 * Client state (text being typed, open dialogs, in-progress recordings)
 * is preserved.
 *
 * Fallback: if the stream can't be established (some proxies/serverless
 * hosts cap long-lived connections), it degrades to polling the tiny
 * /api/data-version endpoint every few seconds, pausing while the tab is
 * hidden. A one-shot check on focus/visibility catches up background tabs
 * either way.
 */
export default function LiveRefresher() {
  const router = useRouter();
  const lastVersion = React.useRef<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let source: EventSource | null = null;
    let sseErrors = 0;

    const apply = (version: number) => {
      if (cancelled || !Number.isFinite(version)) return;
      if (lastVersion.current !== null && version !== lastVersion.current) {
        router.refresh();
      }
      lastVersion.current = version;
    };

    async function checkOnce() {
      try {
        const res = await fetch("/api/data-version", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as { version?: number };
        if (typeof body.version === "number") apply(body.version);
      } catch {
        // Transient network hiccup — next tick/event catches up.
      }
    }

    function startPolling() {
      if (pollId || cancelled) return;
      pollId = setInterval(() => {
        if (document.visibilityState === "visible") void checkOnce();
      }, POLL_MS);
    }

    if (typeof EventSource !== "undefined") {
      source = new EventSource("/api/live");
      source.onmessage = (event) => {
        sseErrors = 0;
        apply(Number(event.data));
      };
      source.onerror = () => {
        // EventSource retries on its own; only give up (and fall back to
        // polling) after repeated failures.
        sseErrors += 1;
        if (sseErrors >= SSE_ERRORS_BEFORE_FALLBACK && source) {
          source.close();
          source = null;
          startPolling();
        }
      };
    } else {
      startPolling();
    }

    const onWake = () => {
      if (document.visibilityState === "visible") void checkOnce();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      if (source) source.close();
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, [router]);

  return null;
}
