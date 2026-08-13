import { redirect } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import { getCurrentUser, homePathForRole, safeNext } from "@/lib/auth";
import { db, DEMO_MODE } from "@/lib/db";
import type { User } from "@/lib/types";
import LoginClient from "./LoginClient";

/**
 * Sign-in screen. In demo mode learners pick one of the seeded profiles;
 * in production mode they sign in with a phone-number OTP via Supabase.
 * Already-authenticated visitors are bounced straight to their role home.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  const user = await getCurrentUser();
  if (user) {
    // Honor a safe ?next= target (e.g. middleware sent them here) instead of
    // dropping it — otherwise fall back to the role home.
    redirect(safeNext(next) ?? homePathForRole(user.role));
  }

  let demoUsers: User[] = [];
  if (DEMO_MODE) {
    demoUsers = await db.listUsers();
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 4, md: 5 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              mb: 4,
            }}
          >
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                width: 56,
                height: 56,
                borderRadius: 3.5,
                mb: 2,
              }}
            >
              <SchoolRoundedIcon fontSize="large" />
            </Avatar>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontSize: { xs: "1.35rem", sm: "1.5rem" } }}
            >
              Sign in to Brototype Learn
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {DEMO_MODE
                ? "Explore the portal as any of the seeded profiles below."
                : "Sign in with your phone number — we'll text you a one-time code."}
            </Typography>
          </Box>

          <LoginClient
            demoMode={DEMO_MODE}
            demoUsers={demoUsers}
            next={next ?? null}
          />
        </CardContent>
      </Card>
    </Container>
  );
}
