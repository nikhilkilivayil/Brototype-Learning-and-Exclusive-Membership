import Link from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";

export default async function AdminLearnersPage() {
  await requireRole(["admin"], "/admin/users/learners");

  const [learners, purchases, series, questionCounts] = await Promise.all([
    db.listUsersByRole("learner"),
    db.listPurchases(),
    db.listSeries(),
    db.countQuestionsByLearner(),
  ]);

  const seriesTitleById = new Map(series.map((s) => [s.id, s.title]));

  const rows = learners.map((learner) => {
    const own = purchases.filter((p) => p.learner_id === learner.id);
    const seriesTitles = own
      .map((p) => seriesTitleById.get(p.series_id))
      .filter((title): title is string => Boolean(title));
    const totalSpent = own.reduce((sum, p) => sum + p.amount_paid, 0);
    return {
      learner,
      seriesTitles,
      purchaseCount: own.length,
      totalSpent,
      questionCount: questionCounts[learner.id] ?? 0,
    };
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Breadcrumbs
          separator={<NavigateNextRoundedIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <MuiLink
            component={Link}
            href="/admin"
            underline="hover"
            color="inherit"
          >
            Admin
          </MuiLink>
          <MuiLink
            component={Link}
            href="/admin/users"
            underline="hover"
            color="inherit"
          >
            Users
          </MuiLink>
          <Typography color="text.primary">Learners</Typography>
        </Breadcrumbs>

        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
          >
            Learners
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Everyone who signed up with phone OTP, with their purchases and
            doubt activity.
          </Typography>
        </Box>

        <Card variant="outlined">
          {rows.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <SchoolRoundedIcon
                sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
              />
              <Typography variant="h6" color="text.secondary">
                No learners yet
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Learners appear here as soon as they register with phone OTP.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 860 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Learner</TableCell>
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
                  {rows.map((row) => (
                    <TableRow key={row.learner.id} hover>
                      <TableCell>
                        <MuiLink
                          component={Link}
                          href={`/admin/users/learners/${row.learner.id}`}
                          underline="none"
                          color="inherit"
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                bgcolor: "primary.light",
                                color: "primary.dark",
                                fontSize: 16,
                              }}
                            >
                              {row.learner.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="subtitle2" noWrap>
                              {row.learner.name}
                            </Typography>
                          </Stack>
                        </MuiLink>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {row.learner.phone_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(row.learner.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {row.seriesTitles.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        ) : (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ maxWidth: 260 }}
                          >
                            {row.seriesTitles.map((title, i) => (
                              <Chip
                                key={`${title}-${i}`}
                                label={title}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {row.purchaseCount}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatINR(row.totalSpent)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {row.questionCount}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          component={Link}
                          href={`/admin/users/learners/${row.learner.id}`}
                          size="small"
                          aria-label={`View ${row.learner.name}`}
                        >
                          <ChevronRightRoundedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
