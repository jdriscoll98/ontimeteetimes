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
        bg: "#daf5f0",
        main: "#7fbc8c",
        mainAccent: "#58a769", // not needed for shadcn
      },
      borderRadius: {
        base: "20px",
      },
      boxShadow: {
        base: "4px -4px 0px 0px rgba(0,0,0,1)",
      },
      translate: {
        boxShadowX: "4px",
        boxShadowY: "-4px",
      },
      fontWeight: {
        base: "500",
        heading: "900",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
