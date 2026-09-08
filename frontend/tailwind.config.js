/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#F85127", // Accent Orange-Red
        "secondary": "#2BAB9A", // New Teal Shade
        "pending": "#FAA422", // New Pending Color (Orange-Gold)
        "brand-purple": "#872B90", // Purple Authority
        "brand-purple-dark": "#631F6A", // Darker Purple
        "brand-orange": "#F85127",
        "sidebar-bg": "#872B90",
        "sidebar-active": "#6b2273",
        "surface": "#F9F8FA",
        "on-surface": "#1A141C",
        "on-surface-variant": "#5F5563",
        "outline-variant": "#E8E2EA"
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
    },
  },
  plugins: [],
}
