/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        mobile: "350px",
        tablet: "640px",
        // => @media (min-width: 640px) { ... }

        laptop: "1024px",
        // => @media (min-width: 1024px) { ... }

        desktop: "1280px",
        // => @media (min-width: 1280px) { ... }
      },
      colors: {
        satu: "rgb(131 134 56)",
        dua: "rgb(22 94 98)",
        tiga: "rgb(16 45 47)",
        empat: "rgb(179 127 8)",
        lima: "rgb(220 206 162)",
      },
    },
  },
  plugins: [],
};
