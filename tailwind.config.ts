import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0a0a0a",
        "bg-secondary": "#141414",
        "bg-card": "#1a1a1a",
        "bg-elevated": "#222222",
        border: "#2a2a2a",
        "text-primary": "#f0f0f0",
        "text-secondary": "#a0a0a0",
        "text-muted": "#666666",
        accent: "#e8e8e8",
        "accent-subtle": "#2a2a2a",
        win: "#22c55e",
        loss: "#ef4444",
        submission: "#f59e0b"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"]
      }
    }
  },
  plugins: []
}

export default config
