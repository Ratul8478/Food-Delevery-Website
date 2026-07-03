"use client";

import { useEffect, useRef } from "react";

export default function AutoRefresh() {
  const currentVersion = useRef<string | null>(null);

  useEffect(() => {
    // 1. Fetch initial version
    const fetchVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          currentVersion.current = data.version;
        }
      } catch (err) {
        console.error("AutoRefresh: Failed to fetch initial version", err);
      }
    };

    fetchVersion();

    // 2. Set up interval to poll for updates
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          // If we have an initial version and the new version is different
          if (currentVersion.current && data.version && currentVersion.current !== data.version) {
            console.log("AutoRefresh: New version detected! Reloading page...");
            window.location.reload();
          }
        }
      } catch (err) {
        console.warn("AutoRefresh: Polling failed", err);
      }
    }, 8000); // Check every 8 seconds

    return () => clearInterval(interval);
  }, []);

  return null;
}
