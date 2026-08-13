"use client";

import Link from "next/link";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import type { TutorialSeries } from "@/lib/types";
import { formatINR } from "@/lib/format";

/**
 * Reusable catalog card for a tutorial series. Entire card links to the
 * series detail page; footer shows either the membership price or an
 * "Owned" badge for learners who already purchased. When a discounted
 * `finalPrice` is provided (returning-member pricing, computed server-side),
 * the price chip shows the discounted amount alongside the struck-through
 * base price.
 */
export default function SeriesCard({
  series,
  owned = false,
  videoCount,
  finalPrice,
  discountPercentage,
}: {
  series: TutorialSeries;
  owned?: boolean;
  videoCount?: number;
  finalPrice?: number;
  discountPercentage?: number;
}) {
  const discounted =
    typeof finalPrice === "number" && finalPrice < series.base_price;
  return (
    <Card
      sx={{
        height: "100%",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
      }}
    >
      <CardActionArea
        component={Link}
        href={`/series/${series.id}`}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <CardMedia
          component="img"
          image={series.thumbnail_url}
          alt={series.title}
          sx={{ aspectRatio: "16 / 9", objectFit: "cover" }}
        />
        <CardContent
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            width: "100%",
          }}
        >
          <Typography variant="h6" component="h3" sx={{ lineHeight: 1.3 }}>
            {series.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {series.description}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: "auto", pt: 1, rowGap: 0.75, columnGap: 1 }}
          >
            {owned ? (
              <Chip
                size="small"
                color="success"
                icon={<CheckCircleRoundedIcon />}
                label="Owned"
              />
            ) : discounted ? (
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={formatINR(finalPrice)}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textDecoration: "line-through" }}
                >
                  {formatINR(series.base_price)}
                </Typography>
                {typeof discountPercentage === "number" && (
                  <Chip
                    size="small"
                    color="success"
                    label={`−${discountPercentage}%`}
                  />
                )}
              </Stack>
            ) : (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={formatINR(series.base_price)}
              />
            )}
            {typeof videoCount === "number" && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <PlayCircleOutlineRoundedIcon
                  sx={{ fontSize: 18, color: "text.secondary" }}
                />
                <Typography variant="caption" color="text.secondary">
                  {videoCount} {videoCount === 1 ? "video" : "videos"}
                </Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
