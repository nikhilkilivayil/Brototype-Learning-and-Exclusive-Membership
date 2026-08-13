"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useColorScheme } from "@mui/material/styles";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import type { Role, User } from "@/lib/types";
import { logoutAction } from "@/lib/auth-actions";
import UnlockSupportCTA from "./UnlockSupportCTA";

const NAV_ITEMS: Array<{ label: string; href: string; roles: Array<Role | "guest"> }> = [
  { label: "Browse", href: "/", roles: ["guest", "learner", "admin", "support", "sales"] },
  { label: "My Learning", href: "/my-learning", roles: ["learner"] },
  { label: "Admin", href: "/admin", roles: ["admin"] },
  { label: "Support Desk", href: "/support", roles: ["support", "admin"] },
  { label: "Sales", href: "/sales", roles: ["sales", "admin"] },
];

const ROLE_LABEL: Record<Role, string> = {
  learner: "Learner",
  admin: "Admin",
  support: "Support Executive",
  sales: "Sales",
};

function ModeToggle() {
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <IconButton size="small" aria-label="Toggle color scheme" disabled>
        <DarkModeRoundedIcon fontSize="small" />
      </IconButton>
    );
  }
  const isDark = mode === "dark";
  return (
    <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        size="small"
        aria-label="Toggle color scheme"
        onClick={() => setMode(isDark ? "light" : "dark")}
      >
        {isDark ? (
          <LightModeRoundedIcon fontSize="small" />
        ) : (
          <DarkModeRoundedIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}

function UserMenu({ user }: { user: User }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const initial = user.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <>
      <Tooltip title={user.name}>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontSize: "0.95rem",
              fontWeight: 600,
            }}
          >
            {initial}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 230, borderRadius: 3 } } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="subtitle2">{user.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {user.phone_number}
          </Typography>
          <Chip
            label={ROLE_LABEL[user.role]}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mt: 0.75 }}
          />
        </Box>
        <Divider />
        <MenuItem
          onClick={async () => {
            setAnchorEl(null);
            await logoutAction();
          }}
        >
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}

/**
 * Global chrome rendered on every page: sticky Material AppBar with brand,
 * role-aware navigation, the persistent "Unlock Exclusive Support" CTA,
 * dark-mode toggle and the account menu.
 */
export default function AppShell({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const role: Role | "guest" = user?.role ?? "guest";
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  // The CTA drives learner conversions — hide it only for back-office staff.
  const showCTA = role === "guest" || role === "learner";
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 1.5, minHeight: 64 }}>
            <IconButton
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(true)}
              sx={{ display: { xs: "inline-flex", md: "none" } }}
            >
              <MenuRoundedIcon />
            </IconButton>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              component={Link}
              href="/"
              sx={{ textDecoration: "none", color: "inherit", mr: 1 }}
            >
              <Avatar
                variant="rounded"
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  width: 36,
                  height: 36,
                  borderRadius: 2.5,
                }}
              >
                <SchoolRoundedIcon fontSize="small" />
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                  Brototype Learn
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                  Malayalam coding tutorials
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" } }}>
              {navItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Button
                    key={item.href}
                    component={Link}
                    href={item.href}
                    size="small"
                    color={active ? "primary" : "inherit"}
                    sx={{
                      px: 1.75,
                      fontWeight: active ? 700 : 500,
                      bgcolor: active ? "primary.light" : "transparent",
                      color: active ? "primary.dark" : "text.secondary",
                      "&:hover": { bgcolor: active ? "primary.light" : "action.hover" },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Stack>

            <Box sx={{ flexGrow: 1 }} />

            {showCTA && (
              <>
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  <UnlockSupportCTA />
                </Box>
                <Box sx={{ display: { xs: "block", sm: "none" } }}>
                  <UnlockSupportCTA compact />
                </Box>
              </>
            )}

            <ModeToggle />

            {user ? (
              <UserMenu user={user} />
            ) : (
              <Button
                component={Link}
                href="/login"
                variant="outlined"
                size="small"
                sx={{ whiteSpace: "nowrap" }}
              >
                Sign in
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="left"
        open={mobileNavOpen}
        onClose={closeMobileNav}
        sx={{ display: { xs: "block", md: "none" } }}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              borderTopRightRadius: 16,
              borderBottomRightRadius: 16,
            },
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 2 }}>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              width: 36,
              height: 36,
              borderRadius: 2.5,
            }}
          >
            <SchoolRoundedIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              Brototype Learn
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
              Malayalam coding tutorials
            </Typography>
          </Box>
        </Stack>
        <Divider />
        <List sx={{ px: 1 }}>
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={active}
                onClick={closeMobileNav}
                sx={{ borderRadius: 2 }}
              >
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { fontWeight: active ? 700 : 500 } }}
                />
              </ListItemButton>
            );
          })}
          {!user && (
            <ListItemButton
              component={Link}
              href="/login"
              onClick={closeMobileNav}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LoginRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Sign in" />
            </ListItemButton>
          )}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>

      <Box
        component="footer"
        sx={{ borderTop: 1, borderColor: "divider", py: 3, mt: 6 }}
      >
        <Container maxWidth="xl">
          <Typography variant="body2" color="text.secondary" align="center">
            Brototype Learning Portal — Learn free. Get unstuck with Exclusive
            Support. 🚀
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
