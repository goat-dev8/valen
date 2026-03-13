import { Instrument_Serif, Space_Grotesk } from 'next/font/google';

/** Primary UI — geometric, bold, tech-forward (dashboard + app shell) */
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

/** Marketing hero headlines only */
export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument-serif',
  display: 'swap',
});

export const fontVariables = `${spaceGrotesk.variable} ${instrumentSerif.variable}`;
