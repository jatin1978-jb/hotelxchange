import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: {
            DEFAULT: "#0A4D7E",
            50: "#f0f7ff",
            100: "#e0effe",
            200: "#bae0fd",
            500: "#0A4D7E",
            600: "#083e66",
            700: "#063050",
            900: "#031728",
          },
          gold: {
            DEFAULT: "#B89759",
            50: "#fdfbf7",
            100: "#f8f3e8",
            200: "#eddcb9",
            500: "#B89759",
            600: "#a38243",
            700: "#856832",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
