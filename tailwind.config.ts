import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{jsx,tsx,mdx}'],
  theme: {
    colors: {
      light: {
        100: 'hsl(0 0% 100%)',
        200: 'hsl(0 0% 95%)',
        400: 'hsl(0 0% 75%)',
      },
      dark: {
        800: 'hsl(210 100% 14%)',
      },
      red: {
        500: 'hsl(0, 100%, 65%)',
      },
      orange: {
        200: 'hsl(29 100% 85%)',
        300: 'hsl(29 100% 80%)',
        500: 'hsl(29 100% 65%)',
      },
      green: {
        600: 'hsl(140, 60%, 50%)',
      },
      blue: {
        500: 'hsl(230, 100%, 65%)',
      },
    },
  },
} satisfies Config;
