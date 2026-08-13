"use client";

import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FilterAltRounded from "@mui/icons-material/FilterAltRounded";
import type { SalesFilters } from "./filters";

/**
 * Filter controls for the sales dashboard. Submits as a plain GET form to
 * /sales so all filtering happens server-side via the URL query string —
 * which also means the Export CSV link can reuse the exact same params.
 */
export default function FilterBar({
  filters,
  seriesOptions,
}: {
  filters: SalesFilters;
  seriesOptions: { id: string; title: string }[];
}) {
  const shrink = { inputLabel: { shrink: true } } as const;
  const nativeSelect = {
    select: { native: true },
    inputLabel: { shrink: true },
  } as const;

  return (
    <Paper
      variant="outlined"
      component="form"
      method="get"
      action="/sales"
      sx={{ p: { xs: 2, sm: 2.5 } }}
    >
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        Filter learners
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            name="q"
            label="Search name / phone"
            placeholder="e.g. Anjali or 98470…"
            defaultValue={filters.q ?? ""}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            name="reg_from"
            label="Registered from"
            defaultValue={filters.regFrom ?? ""}
            slotProps={shrink}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            name="reg_to"
            label="Registered to"
            defaultValue={filters.regTo ?? ""}
            slotProps={shrink}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            select
            size="small"
            name="status"
            label="Membership status"
            defaultValue={filters.status ?? "all"}
            slotProps={nativeSelect}
          >
            <option value="all">All</option>
            <option value="paying">Paying members</option>
            <option value="free">Free learners</option>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            select
            size="small"
            name="series"
            label="Purchased series"
            defaultValue={filters.seriesId ?? "all"}
            slotProps={nativeSelect}
          >
            <option value="all">All series</option>
            {seriesOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            name="pur_from"
            label="Purchased from"
            defaultValue={filters.purFrom ?? ""}
            slotProps={shrink}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            name="pur_to"
            label="Purchased to"
            defaultValue={filters.purTo ?? ""}
            slotProps={shrink}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            select
            size="small"
            name="activity"
            label="Doubt activity"
            defaultValue={filters.activity ?? "all"}
            slotProps={nativeSelect}
          >
            <option value="all">All</option>
            <option value="asked">Has asked doubts</option>
            <option value="never">Never asked</option>
          </TextField>
        </Grid>
        <Grid size={12}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            flexWrap="wrap"
            useFlexGap
          >
            <Button
              type="submit"
              variant="contained"
              startIcon={<FilterAltRounded />}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Apply filters
            </Button>
            <Button
              component="a"
              href="/sales"
              variant="text"
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Reset
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
}
