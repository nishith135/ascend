/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
          "on-secondary": "#5e1425",
          "surface-bright": "#483435",
          "secondary": "#ffb2bb",
          "surface-container-highest": "#443030",
          "on-primary-fixed": "#40000c",
          "surface-dim": "#1f0f10",
          "on-error": "#690005",
          "secondary-container": "#7e2d3d",
          "secondary-fixed-dim": "#ffb2bb",
          "on-tertiary": "#00382d",
          "ethereal-white": "#f8fafc",
          "tertiary-fixed-dim": "#74d8bd",
          "on-error-container": "#ffdad6",
          "inverse-surface": "#fbdbdb",
          "on-secondary-fixed-variant": "#7b2b3b",
          "primary": "#ffb3b6",
          "surface-variant": "#443030",
          "primary-fixed": "#ffdada",
          "tertiary": "#74d8bd",
          "on-surface-variant": "#e5bdbe",
          "on-surface": "#fbdbdb",
          "surface-container": "#2c1b1c",
          "obsidian-void": "#050505",
          "inverse-primary": "#be0037",
          "surface": "#1f0f10",
          "surface-container-high": "#382526",
          "outline-variant": "#5c3f40",
          "on-primary-fixed-variant": "#920028",
          "surface-container-low": "#281718",
          "surface-tint": "#ffb3b6",
          "primary-fixed-dim": "#ffb3b6",
          "on-primary": "#68001a",
          "on-tertiary-fixed-variant": "#005142",
          "background": "#1f0f10",
          "on-secondary-fixed": "#400012",
          "error": "#ffb4ab",
          "secondary-fixed": "#ffd9dd",
          "on-secondary-container": "#ff9caa",
          "on-primary-container": "#fffaf9",
          "shadow-surface": "#0a0a0a",
          "on-tertiary-fixed": "#002019",
          "error-container": "#93000a",
          "surface-container-lowest": "#190a0b",
          "outline": "#ac8889",
          "on-tertiary-container": "#eefff7",
          "tertiary-container": "#00836c",
          "primary-container": "#e11d48",
          "inverse-on-surface": "#3f2b2c",
          "monarch-crimson": "#be123c",
          "on-background": "#fbdbdb",
          "tertiary-fixed": "#90f5d9"
      },
      "borderRadius": {
          "DEFAULT": "0.125rem",
          "lg": "0.25rem",
          "xl": "0.5rem",
          "full": "0.75rem"
      },
      "spacing": {
          "panel-gap": "1rem",
          "gutter": "1.5rem",
          "hud-inset": "1.5rem",
          "unit": "4px",
          "margin-safe": "2rem"
      },
      "fontFamily": {
          "body-main": ["Inter"],
          "stat-value": ["Sora"],
          "category-header": ["Sora"],
          "monarch-display": ["Sora"],
          "headline-status-mobile": ["Sora"],
          "headline-status": ["Sora"],
          "label-system": ["Sora"]
      },
      "fontSize": {
          "body-main": ["16px", { "lineHeight": "1.6", "letterSpacing": "0.01em", "fontWeight": "400" }],
          "stat-value": ["28px", { "lineHeight": "1", "letterSpacing": "0.02em", "fontWeight": "800" }],
          "category-header": ["18px", { "lineHeight": "1.4", "letterSpacing": "0.02em", "fontWeight": "600" }],
          "monarch-display": ["56px", { "lineHeight": "1.0", "letterSpacing": "-0.05em", "fontWeight": "800" }],
          "headline-status-mobile": ["24px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "700" }],
          "headline-status": ["32px", { "lineHeight": "1.2", "letterSpacing": "0.1em", "fontWeight": "700" }],
          "label-system": ["11px", { "lineHeight": "1", "letterSpacing": "0.15em", "fontWeight": "700" }]
      }
    }
  },
  plugins: [],
}
