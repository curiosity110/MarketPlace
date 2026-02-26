/**
 * Color Scheme Utilities for Marketplace Design System
 * Primary: Orange (#FF6600)
 * Secondary: Blue (#0366D6)
 * Accent: White
 */

export const colors = {
  // Primary Orange
  primary: {
    100: "#fff7ed",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ff6600", // Main orange
    700: "#ea580c",
    800: "#c2410c",
    900: "#7c2d12",
  },

  // Secondary Blue
  secondary: {
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#0366d6", // Main blue
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },

  // Neutral grayscale
  neutral: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },

  // Status colors
  success: "#22c55e",
  warning: "#f59e0b",
  destructive: "#ef4444",
  info: "#3b82f6",

  // Dark mode specific
  dark: {
    background: "#0a0c14",
    surface: "#141928",
    border: "#334155",
  },
};

export const gradients = {
  primary:
    "linear-gradient(135deg, rgb(255, 102, 0) 0%, rgb(255, 140, 30) 100%)",
  secondary:
    "linear-gradient(135deg, rgb(3, 102, 214) 0%, rgb(96, 165, 250) 100%)",
  accent:
    "linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(240, 243, 250) 100%)",
  warm: "linear-gradient(135deg, rgb(255, 102, 0) 0%, rgb(245, 158, 11) 100%)",
  cool: "linear-gradient(135deg, rgb(3, 102, 214) 0%, rgb(59, 130, 246) 100%)",
};

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  glow: "0 0 20px rgb(255 102 0 / 0.3)",
};

export const categoryColors = {
  electronics: "orange",
  fashion: "blue",
  home: "purple",
  sports: "green",
  other: "neutral",
} as const;

/**
 * Get tailwind color class based on category
 */
export function getCategoryColorClass(
  category?: string,
): "orange" | "blue" | "purple" | "green" {
  const categoryLower = category?.toLowerCase() || "";
  if (categoryLower.includes("electron")) return "orange";
  if (categoryLower.includes("fashion") || categoryLower.includes("cloth"))
    return "blue";
  if (categoryLower.includes("home") || categoryLower.includes("furniture"))
    return "purple";
  if (categoryLower.includes("sport") || categoryLower.includes("outdoor"))
    return "green";
  return "blue"; // Default fallback
}
