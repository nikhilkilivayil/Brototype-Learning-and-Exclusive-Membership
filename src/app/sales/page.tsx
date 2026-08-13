import NextLink from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import CurrencyRupeeRounded from "@mui/icons-material/CurrencyRupeeRounded";
import FileDownloadRounded from "@mui/icons-material/FileDownloadRounded";
import PeopleOutlineRounded from "@mui/icons-material/PeopleOutlineRounded";
import SchoolRounded from "@mui/icons-material/SchoolRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import WorkspacePremiumRounded from "@mui/icons-material/WorkspacePremiumRounded";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";
import {
  applySalesFilters,
  buildLearnerRows,
  parseSalesFilters,
} from "./filters";
import FilterBar from "./FilterBar";

const MAX_SERIES_CHIPS = 3;

function StatCard({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Avatar
            sx={{
              bgcolor: "primary.light",
              color: "primary.dark",
              width: 40,
              height: 40,
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              component="p"
              sx={{
                fontSize: { xs: "1.25rem", md: "1.5rem" },
                wordBreak: "break-word",
              }}
            >
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {caption ? (
              <Typography variant="caption" color="text.secondary">
                {caption}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default async function SalesDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole(["sales", "admin"], "/sales");
  const rawParams = await searchParams;

  // Flatten repeated params (first value wins) for the filter parser, and
  // rebuild the raw query string for the Export CSV link so the download
  // carries the exact same filters as the current view.
  const flatParams: Record<string, string | undefined> = {};
  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    const values = Array.isArray(value) ? value : value !== undefined ? [value] : [];
    if (values.length > 0) flatParams[key] = values[0];
    for (const v of values) exportParams.append(key, v);
  }
  const exportQuery = exportParams.toString();
  const exportHref = exportQuery
    ? `/sales/export?${exportQuery}`
    : "/sales/export";

  const filters = parseSalesFilters(flatParams);

  // Learners only — sales must never see admin/support/sales accounts.
  const [learners, purchases, series, questionCounts] = await Promise.all([
    db.listUsersByRole("learner"),
    db.listPurchases(),
    db.listSeries(),
    db.countQuestionsByLearner(),
  ]);

  const seriesById = new Map(series.map((s) => [s.id, s]));
  const allRows = buildLearnerRows(
    learners,
    purchases,
    seriesById,
    questionCounts
  ).sort(
    (a, b) =>
      new Date(b.user.created_at).getTime() -
      new Date(a.user.created_at).getTime()
  );

  // --- Stats over ALL learners (unfiltered) --------------------------------
  const registeredLearners = allRows.length;
  const payingMembers = allRows.filter((r) => r.purchases.length > 0).length;
  const totalRevenue = allRows.reduce((sum, r) => sum + r.totalSpent, 0);
  const conversion =
    registeredLearners > 0
      ? ((payingMembers / registeredLearners) * 100).toFixed(1)
      : "0.0";

  const rows = applySalesFilters(allRows, filters);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={2}
          sx={{ flexWrap: "wrap", rowGap: 1.5 }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontSize: { xs: "1.75rem", md: "2.125rem" } }}
            >
              Sales dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Learner registrations and Exclusive Membership sales across{" "}
              {series.length} tutorial series. Signed in as {user.name}.
            </Typography>
          </Box>
          <Button
            component="a"
            href={exportHref}
            variant="contained"
            startIcon={<FileDownloadRounded />}
          >
            Export CSV
          </Button>
        </Stack>

        {/* Stat cards — always across all learners, filters don't apply */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<SchoolRounded fontSize="small" />}
              label="Registered learners"
              value={registeredLearners.toLocaleString("en-IN")}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<WorkspacePremiumRounded fontSize="small" />}
              label="Paying members"
              value={payingMembers.toLocaleString("en-IN")}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<CurrencyRupeeRounded fontSize="small" />}
              label="Total revenue"
              value={formatINR(totalRevenue)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              icon={<TrendingUpRounded fontSize="small" />}
              label="Conversion"
              value={`${conversion}%`}
              caption="Paying members / registered learners"
            />
          </Grid>
        </Grid>

        {/* Filters */}
        <FilterBar
          filters={filters}
          seriesOptions={series.map((s) => ({ id: s.id, title: s.title }))}
        />

        {/* Learners table */}
        <Card variant="outlined">
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1.5 }}>
            <Typography variant="h6" component="h2">
              Registered learners
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Showing {rows.length} of {allRows.length} learners
            </Typography>
          </Box>

          {rows.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <PeopleOutlineRounded
                sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
              />
              <Typography variant="subtitle1" gutterBottom>
                {allRows.length === 0
                  ? "No registered learners yet"
                  : "No learners match these filters"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {allRows.length === 0
                  ? "New sign-ups will appear here as soon as they register."
                  : "Try widening the date ranges or resetting the filters."}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 900 }} aria-label="Registered learners">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Registered</TableCell>
                    <TableCell>Enrolled series</TableCell>
                    <TableCell align="right">Purchases</TableCell>
                    <TableCell align="right">Total spent</TableCell>
                    <TableCell align="right">Questions</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const extraSeries =
                      row.seriesTitles.length - MAX_SERIES_CHIPS;
                    return (
                      <TableRow key={row.user.id} hover>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "primary.light",
                                color: "primary.dark",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                              }}
                            >
                              {row.user.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>
                              {row.user.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{row.user.phone_number}</TableCell>
                        <TableCell>{formatDate(row.user.created_at)}</TableCell>
                        <TableCell>
                          {row.seriesTitles.length === 0 ? (
                            <Typography
                              variant="body2"
                              color="text.disabled"
                            >
                              —
                            </Typography>
                          ) : (
                            <Stack
                              direction="row"
                              spacing={0.5}
                              sx={{ flexWrap: "wrap", rowGap: 0.5 }}
                            >
                              {row.seriesTitles
                                .slice(0, MAX_SERIES_CHIPS)
                                .map((title) => (
                                  <Chip
                                    key={title}
                                    label={title}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              {extraSeries > 0 && (
                                <Chip
                                  label={`+${extraSeries} more`}
                                  size="small"
                                />
                              )}
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {row.purchases.length}
                        </TableCell>
                        <TableCell align="right">
                          {formatINR(row.totalSpent)}
                        </TableCell>
                        <TableCell align="right">
                          {row.questionCount}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            component={NextLink}
                            href={`/sales/learners/${row.user.id}`}
                            size="small"
                            aria-label={`View ${row.user.name}`}
                          >
                            <ChevronRightRounded />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
