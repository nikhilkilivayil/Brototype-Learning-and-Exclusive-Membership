import { DEMO_MODE, db } from "@/lib/db";
import { subscribeMockChanges } from "@/lib/db/mock";

export const dynamic = "force-dynamic";

/**
 * GET /api/live — Server-Sent Events stream that pushes the data version to
 * the browser whenever something changes (new question, reply, purchase,
 * admin edit…). LiveRefresher listens and re-renders the page instantly —
 * no manual refresh, no client polling.
 *
 * Demo mode: writes notify subscribers in-process → truly instant push.
 * Supabase mode: the stream checks the trigger-maintained data_version row
 * every 2s server-side and pushes on change (one HTTP connection per client
 * instead of request polling). On serverless hosts that cap long-lived
 * connections the client falls back to polling automatically; Supabase
 * Realtime on data_version is the optional upgrade there.
 */
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;

      const send = (payload: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          closed = true;
        }
      };
      const sendVersion = (version: number) =>
        send(`data: ${version}\n\n`);

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed by the runtime
        }
      };

      // Initial version so the client has a baseline immediately.
      try {
        sendVersion(await db.getDataVersion());
      } catch {
        // Ignore — the first change event will establish the baseline.
      }

      // Comment-frame heartbeat keeps proxies from idling the connection out.
      const heartbeat = setInterval(() => send(": ping\n\n"), 15000);

      let unsubscribe: () => void;
      if (DEMO_MODE) {
        unsubscribe = subscribeMockChanges(sendVersion);
      } else {
        let last = -1;
        const poller = setInterval(async () => {
          try {
            const version = await db.getDataVersion();
            if (version !== last) {
              last = version;
              sendVersion(version);
            }
          } catch {
            // Transient DB hiccup — retry on the next tick.
          }
        }, 2000);
        unsubscribe = () => clearInterval(poller);
      }

      cleanup = () => {
        unsubscribe();
        clearInterval(heartbeat);
        close();
      };
      request.signal.addEventListener("abort", () => cleanup?.());
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
