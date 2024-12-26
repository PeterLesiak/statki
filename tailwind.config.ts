import type { Config } from 'tailwindcss';

export default {
    content: ['./src/**/*.{jsx,tsx,mdx}'],
    theme: {
        colors: {
            light: {
                DEFAULT: 'hsl(0 0% 100%)',
                100: 'hsl(0 0% 98%)',
                200: 'hsl(0 0% 80%)',
                300: 'hsl(0 0% 75%)',
                400: 'hsl(0 0% 60%)',
            },
            red: {
                500: 'hsl(0 100% 55%)',
            },
            blue: {
                500: 'hsl(215 100% 60%)',
            },
            green: {
                500: 'hsl(94 100% 40%)',
                600: 'hsl(88 100% 33%)',
            },
        },
    },
} satisfies Config;
