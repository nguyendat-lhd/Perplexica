import { Merriweather } from 'next/font/google';

export const merriweather = Merriweather({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});

