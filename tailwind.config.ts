import type { Config } from 'tailwindcss';
import type { DefaultColors } from 'tailwindcss/types/generated/colors';

const themeDark = (colors: DefaultColors) => ({
  50: '#0d1117',
  100: '#161b22',
  200: '#21262d',
  300: '#30363d',
});

const themeLight = (colors: DefaultColors) => ({
  50: '#ffffff',
  100: '#f6f8fa',
  200: '#d0d7de',
  300: '#afb8c1',
});

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Arial', 'sans-serif'],
      },
      colors: ({ colors }) => {
        const colorsDark = themeDark(colors);
        const colorsLight = themeLight(colors);

        return {
          // TrangVang OKLCH Theme Colors
          background: 'oklch(var(--background) / <alpha-value>)',
          foreground: 'oklch(var(--foreground) / <alpha-value>)',
          primary: {
            DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
            foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
          },
          secondary: {
            DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
            foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
          },
          muted: {
            DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
            foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
          },
          accent: {
            DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
            foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
          },
          destructive: {
            DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
            foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
          },
          border: 'oklch(var(--border) / <alpha-value>)',
          input: 'oklch(var(--input) / <alpha-value>)',
          ring: 'oklch(var(--ring) / <alpha-value>)',
          card: {
            DEFAULT: 'oklch(var(--card) / <alpha-value>)',
            foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
          },
          // Brand Yellow Colors
          yellow: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15', // Primary brand yellow
            500: '#eab308',
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
          },
          // Legacy dark/light color schemes (for backward compatibility)
          dark: {
            primary: colorsDark[50],
            secondary: colorsDark[100],
            ...colorsDark,
          },
          light: {
            primary: colorsLight[50],
            secondary: colorsLight[100],
            ...colorsLight,
          },
        };
      },
      borderColor: ({ colors }) => {
        return {
          light: themeLight(colors),
          dark: themeDark(colors),
        };
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@headlessui/tailwindcss')({ prefix: 'headless' })],
};
export default config;
