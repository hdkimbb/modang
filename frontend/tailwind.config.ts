import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "gray-disabled": "#D1D3D8",
        "seed-gray": {
          "00": "#FFFFFF",
          "100": "#F2F3F6",
          "200": "#EAEBEE",
          "300": "#DCDEE3",
          "400": "#D1D3D8",
          "500": "#ADB1BA",
          "600": "#868B94",
          "900": "#212124",
          active: "#4D5159",
        },
        "seed-carrot": {
          "500": "#FF6F0F",
        },
        "seed-accent": "#079AE3",
      },
    },
  },
  plugins: [],
};
export default config;
