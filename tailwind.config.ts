import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FBF7EC",
          frame: "#EFE7D6",
          sunken: "rgba(255, 253, 246, 0.7)",
        },
        ink: {
          DEFAULT: "#2A1F14",
          muted: "#6B5A47",
          faint: "#8C7A60",
          ghost: "#B5A487",
        },
        border: {
          DEFAULT: "#D9CDB2",
          soft: "#E5DBC5",
          strong: "#C9B98F",
        },
        accent: {
          DEFAULT: "#B85C38",
          bg: "rgba(184, 92, 56, 0.06)",
          strong: "#A03A1A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        ui: ["var(--font-ui)", "-apple-system", "sans-serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
      fontSize: {
        "display-lg": ["32px", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "display-md": ["26px", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        deck: ["14px", { lineHeight: "1.5" }],
        body: ["14.5px", { lineHeight: "1.65" }],
        "body-sm": ["13px", { lineHeight: "1.6" }],
        ui: ["12px", { lineHeight: "1.4" }],
        "ui-sm": ["11px", { lineHeight: "1.4" }],
        eyebrow: ["10px", { lineHeight: "1.3", letterSpacing: "0.16em" }],
        tag: ["9px", { lineHeight: "1.3", letterSpacing: "0.08em" }],
        hand: ["16px", { lineHeight: "1.2" }],
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        md: "4px",
        lg: "8px",
        pill: "999px",
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "22px",
        6: "28px",
        8: "44px",
        10: "64px",
      },
    },
  },
  plugins: [],
};

export default config;
