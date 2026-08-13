"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { keyframes } from "@mui/material/styles";

const glow = keyframes`
  0%, 100% { box-shadow: 0 2px 14px rgba(251, 140, 0, 0.45); }
  50% { box-shadow: 0 2px 26px rgba(255, 179, 0, 0.85); }
`;

/**
 * The persistent, high-visibility "Unlock Exclusive Support" CTA rendered in
 * the global AppBar on every page. Amber gradient + soft pulsing glow so it
 * stands out against the Material purple chrome without being obnoxious.
 */
export default function UnlockSupportCTA({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <Button
      component={Link}
      href="/pricing"
      startIcon={<BoltRoundedIcon />}
      size={compact ? "small" : "medium"}
      sx={{
        color: "#1C1B1F",
        fontWeight: 700,
        whiteSpace: "nowrap",
        px: compact ? 1.5 : 2.5,
        background: "linear-gradient(135deg, #FFD54F 0%, #FFB300 45%, #FB8C00 100%)",
        animation: `${glow} 2.6s ease-in-out infinite`,
        "&:hover": {
          background:
            "linear-gradient(135deg, #FFCA28 0%, #FFA000 45%, #F57C00 100%)",
        },
      }}
    >
      {compact ? "Unlock Support" : "Unlock Exclusive Support"}
    </Button>
  );
}
