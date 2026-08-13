"use client";

import Link from "next/link";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

export type QueueTabValue = "open" | "answered" | "closed" | "all";

/**
 * Helpdesk queue tabs. Each tab is a plain link (?tab=…) so the server page
 * renders the matching list — no client-side data fetching involved.
 */
export default function QueueTabs({
  value,
  counts,
}: {
  value: QueueTabValue;
  counts: { open: number; answered: number; closed: number; all: number };
}) {
  return (
    <Tabs
      value={value}
      variant="scrollable"
      allowScrollButtonsMobile
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Tab
        value="open"
        label={`Open (${counts.open})`}
        component={Link}
        href="/support?tab=open"
      />
      <Tab
        value="answered"
        label={`Answered (${counts.answered})`}
        component={Link}
        href="/support?tab=answered"
      />
      <Tab
        value="closed"
        label={`Resolved (${counts.closed})`}
        component={Link}
        href="/support?tab=closed"
      />
      <Tab
        value="all"
        label={`All (${counts.all})`}
        component={Link}
        href="/support?tab=all"
      />
    </Tabs>
  );
}
