"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";

/**
 * Renders the optional image / audio attachments of a question or answer.
 */
export default function MediaAttachmentDisplay({
  imageUrl,
  audioUrl,
}: {
  imageUrl?: string | null;
  audioUrl?: string | null;
}) {
  if (!imageUrl && !audioUrl) return null;
  return (
    <Stack spacing={1.25} sx={{ mt: 1.5 }}>
      {imageUrl && (
        <Link href={imageUrl} target="_blank" rel="noopener" sx={{ lineHeight: 0 }}>
          <Box
            component="img"
            src={imageUrl}
            alt="Attached screenshot"
            sx={{
              maxWidth: "100%",
              maxHeight: 300,
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              display: "block",
            }}
          />
        </Link>
      )}
      {audioUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio controls src={audioUrl} style={{ maxWidth: "100%", height: 40 }} />
      )}
    </Stack>
  );
}
