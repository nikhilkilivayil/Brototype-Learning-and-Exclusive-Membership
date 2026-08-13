"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import PlaylistPlayRoundedIcon from "@mui/icons-material/PlaylistPlayRounded";
import type { TutorialSeries, Video } from "@/lib/types";
import { formatINR } from "@/lib/format";

const clamp2 = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

function Thumb({ src, alt }: { src: string; alt: string }) {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        width: { xs: 100, sm: 120 },
        maxWidth: "100%",
        aspectRatio: "16 / 9",
        objectFit: "cover",
        borderRadius: 2,
        flexShrink: 0,
        bgcolor: "action.hover",
      }}
    />
  );
}

function PanelHeading({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2, pt: 2, pb: 1 }}>
      {icon}
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
    </Stack>
  );
}

/**
 * Watch-page sidebar: the next few videos of the current series, followed by
 * compact cards for every OTHER series in the catalog.
 */
export default function SuggestionsSidebar({
  upNext,
  otherSeries,
}: {
  /** The next videos (by order) of the series being watched. */
  upNext: Video[];
  /**
   * Every other series in the catalog, with the learner's ownership flag and
   * (for returning members) the server-computed discounted price.
   */
  otherSeries: Array<{
    series: TutorialSeries;
    owned: boolean;
    finalPrice?: number;
  }>;
}) {
  return (
    <Stack spacing={3}>
      {upNext.length > 0 && (
        <Card variant="outlined">
          <PanelHeading
            icon={<PlaylistPlayRoundedIcon color="primary" />}
            label="Up next in this series"
          />
          <Stack sx={{ p: 1 }}>
            {upNext.map((video) => (
              <CardActionArea
                key={video.id}
                component={Link}
                href={`/watch/${video.id}`}
                sx={{ borderRadius: 2, p: 1 }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Thumb
                    src={`https://i.ytimg.com/vi/${video.youtube_id}/mqdefault.jpg`}
                    alt={video.title}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, ...clamp2 }}>
                      {video.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Video {video.order_index}
                    </Typography>
                  </Box>
                </Stack>
              </CardActionArea>
            ))}
          </Stack>
        </Card>
      )}

      {otherSeries.length > 0 && (
        <Card variant="outlined">
          <PanelHeading
            icon={<ExploreRoundedIcon color="primary" />}
            label="Continue exploring"
          />
          <Divider />
          <Stack sx={{ p: 1 }}>
            {otherSeries.map(({ series, owned, finalPrice }) => (
              <CardActionArea
                key={series.id}
                component={Link}
                href={`/series/${series.id}`}
                sx={{ borderRadius: 2, p: 1 }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Thumb src={series.thumbnail_url} alt={series.title} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, ...clamp2 }}>
                      {series.title}
                    </Typography>
                    {owned ? (
                      <Chip
                        size="small"
                        color="success"
                        icon={<CheckCircleRoundedIcon />}
                        label="Owned"
                        sx={{ mt: 0.5 }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={formatINR(
                          typeof finalPrice === "number" &&
                            finalPrice < series.base_price
                            ? finalPrice
                            : series.base_price
                        )}
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>
                </Stack>
              </CardActionArea>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
