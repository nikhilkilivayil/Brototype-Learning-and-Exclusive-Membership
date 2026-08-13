"use client";

import { createTheme } from "@mui/material/styles";

/**
 * Google Material Design (Material 3) inspired theme used across the whole
 * portal: M3 baseline purple palette, fully rounded "pill" buttons, 16px
 * card radii, tonal surfaces, Roboto, and light + dark color schemes.
 * The amber gradient reserved for the "Unlock Exclusive Support" CTA lives
 * in src/components/shell/UnlockSupportCTA.tsx.
 */
const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: "#6750A4",
          light: "#EADDFF",
          dark: "#4F378B",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#625B71",
          light: "#E8DEF8",
          dark: "#4A4458",
          contrastText: "#FFFFFF",
        },
        error: { main: "#B3261E" },
        warning: { main: "#F9A825", contrastText: "#1C1B1F" },
        info: { main: "#0061A4" },
        success: { main: "#2E7D32" },
        background: { default: "#FDF7FF", paper: "#FFFFFF" },
        text: { primary: "#1C1B1F", secondary: "#49454F" },
        divider: "#E7E0EC",
      },
    },
    dark: {
      palette: {
        primary: {
          main: "#D0BCFF",
          // The app uses primary.light as an M3 "primary container" surface
          // paired with primary.dark as its on-container tone. In the dark
          // scheme the container must be DARK and the on-container light —
          // otherwise tinted tiles (e.g. support answer bubbles) render as a
          // light surface with near-white text.
          light: "#4F378B",
          dark: "#EADDFF",
          contrastText: "#381E72",
        },
        secondary: {
          main: "#CCC2DC",
          light: "#E8DEF8",
          dark: "#4A4458",
          contrastText: "#332D41",
        },
        error: { main: "#F2B8B5" },
        warning: { main: "#FFB74D", contrastText: "#1C1B1F" },
        info: { main: "#9ECAFF" },
        success: { main: "#81C784" },
        background: { default: "#141218", paper: "#1D1B20" },
        text: { primary: "#E6E0E9", secondary: "#CAC4D0" },
        divider: "#49454F",
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "var(--font-roboto), Roboto, Helvetica, Arial, sans-serif",
    h1: { fontWeight: 700, fontSize: "2.75rem", letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, fontSize: "2.125rem", letterSpacing: "-0.01em" },
    h3: { fontWeight: 600, fontSize: "1.75rem" },
    h4: { fontWeight: 600, fontSize: "1.5rem" },
    h5: { fontWeight: 600, fontSize: "1.25rem" },
    h6: { fontWeight: 600, fontSize: "1.1rem" },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 20 },
        sizeLarge: { paddingInline: 28, paddingBlock: 10 },
      },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 16, backgroundImage: "none" } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 28 } },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { borderRadius: 8 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { "& .MuiTableCell-head": { fontWeight: 600 } },
      },
    },
  },
});

export default theme;
