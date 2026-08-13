import Link from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import SettingsForm from "./SettingsForm";

export default async function AdminSettingsPage() {
  const user = await requireRole(["admin"], "/admin/settings");
  void user;

  const settings = await db.getSettings();

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
          <Typography color="text.primary">Pricing settings</Typography>
        </Breadcrumbs>

        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
          >
            Pricing settings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Control the dynamic pricing applied across the portal.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Avatar
                    sx={{
                      bgcolor: "primary.light",
                      color: "primary.dark",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <LocalOfferRoundedIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Add-on discount
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Applied automatically to every purchase after a
                      learner&apos;s first series. The first series is always
                      billed at its full base price; every additional series
                      the learner buys gets this percentage off.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Set it to 0% to turn the returning-learner discount off
                      entirely.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SettingsForm
              initialPercentage={settings.addon_discount_percentage}
            />
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
