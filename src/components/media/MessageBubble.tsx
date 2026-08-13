"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import type { ThreadMessageWithAuthor } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import MediaAttachmentDisplay from "./MediaAttachmentDisplay";

/**
 * One message of a question's conversation thread — used by both the
 * learner-facing watch page and the support helpdesk. Staff messages get a
 * primary-tinted bubble + support avatar; learner messages stay neutral.
 * A deleted staff author renders as "Brototype engineer".
 */
export default function MessageBubble({
  message,
}: {
  message: ThreadMessageWithAuthor;
}) {
  const isStaff =
    message.author === null || // deleted staff account
    message.author.role === "support" ||
    message.author.role === "admin";
  const name = message.author?.name ?? "Brototype engineer";
  const initial = name.trim().charAt(0).toUpperCase() || "B";

  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: "0.85rem",
          fontWeight: 600,
          bgcolor: isStaff ? "primary.main" : "secondary.light",
          color: isStaff ? "primary.contrastText" : "secondary.dark",
        }}
      >
        {isStaff ? <SupportAgentRoundedIcon fontSize="small" /> : initial}
      </Avatar>
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          borderRadius: 3,
          px: 2,
          py: 1.5,
          bgcolor: isStaff ? "primary.light" : "action.hover",
          color: "text.primary",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Typography variant="subtitle2">{name}</Typography>
          {isStaff && (
            <Chip
              label="Brototype engineer"
              size="small"
              variant="outlined"
              color="primary"
              sx={{ height: 20, fontSize: "0.65rem" }}
            />
          )}
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(message.created_at)}
          </Typography>
        </Stack>
        {message.message_text && (
          <Typography
            variant="body2"
            sx={{ mt: 0.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {message.message_text}
          </Typography>
        )}
        <MediaAttachmentDisplay
          imageUrl={message.image_url}
          audioUrl={message.audio_url}
        />
      </Box>
    </Stack>
  );
}
