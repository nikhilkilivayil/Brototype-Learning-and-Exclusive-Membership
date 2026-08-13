"use client";

import * as React from "react";

/**
 * Registers the service worker that makes the app installable (desktop app
 * via Chrome/Edge "Install", mobile app via "Add to Home Screen") and serves
 * the offline fallback. Skipped in development — a SW caching dev bundles
 * breaks hot reload.
 */
export default function PWARegister() {
  React.useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {
        // Install-ability is progressive enhancement — never break the app.
      });
  }, []);

  return null;
}
