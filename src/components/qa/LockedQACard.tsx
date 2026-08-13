"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import CheckoutButton from "@/components/checkout/CheckoutButton";
import type { PriceQuote, User } from "@/lib/types";

/**
 * Mirrors formatINR from "@/lib/pricing". That module transitively imports the
 * server-only db layer (next/headers), so it cannot be bundled into this
 * client component — keep this formatter's output identical.
 */
function inr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

const BENEFITS = [
  "Ask unlimited doubts on every video of this series",
  "Attach screenshots & record voice notes",
  "Personal answers from Brototype engineers",
  "Answers with text, images & audio",
];

/**
 * The conversion moment — shown in place of the Q&A composer when the learner
 * has not purchased the Exclusive Membership for this series.
 */
export default function LockedQACard({
  quote,
  user,
  seriesTitle,
}: {
  quote: PriceQuote;
  user: User | null;
  seriesTitle: string;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: "rgba(249, 168, 37, 0.55)",
        overflow: "hidden",
      }}
    >
      {/* Warning-tinted header band */}
      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: { xs: 2.5, sm: 3 },
          background:
            "linear-gradient(120deg, rgba(249, 168, 37, 0.24) 0%, rgba(255, 183, 77, 0.12) 55%, rgba(249, 168, 37, 0.04) 100%)",
        }}
      >
        <Stack
          direction="row"
          spacing={1.75}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Box
            sx={{
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "warning.main",
              color: "warning.contrastText",
              flexShrink: 0,
            }}
          >
            <LockRoundedIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              component="h3"
              sx={{ fontSize: { xs: "1.15rem", sm: "1.25rem" } }}
            >
              Stuck? Get unstuck by real engineers.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Exclusive Membership for “{seriesTitle}”
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: { xs: 2.5, sm: 3 }, pt: 1 }}>
        <List dense disablePadding>
          {BENEFITS.map((benefit) => (
            <ListItem key={benefit} disableGutters sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 34 }}>
                <CheckCircleRoundedIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={benefit}
                slotProps={{ primary: { variant: "body2" } }}
              />
            </ListItem>
          ))}
        </List>

        {/* Price row */}
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 2, mb: 2 }}
        >
          {quote.discount_applied ? (
            <>
              <Typography
                variant="h6"
                component="span"
                color="text.secondary"
                sx={{ textDecoration: "line-through", fontWeight: 400 }}
              >
                {inr(quote.base_price)}
              </Typography>
              <Typography variant="h4" component="span">
                {inr(quote.final_price)}
              </Typography>
              <Chip
                size="small"
                color="success"
                label={`MEMBER DISCOUNT −${quote.discount_percentage}%`}
              />
            </>
          ) : (
            <Typography variant="h4" component="span">
              {inr(quote.final_price)}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            one-time · this series
          </Typography>
        </Stack>

        <CheckoutButton
          seriesId={quote.series_id}
          seriesTitle={seriesTitle}
          quote={quote}
          user={user}
          fullWidth
          size="large"
          label="Unlock Exclusive Support"
        />

        {!user && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center", mt: 1 }}
          >
            Sign in with your phone to purchase
          </Typography>
        )}
      </Box>
    </Card>
  );
}
