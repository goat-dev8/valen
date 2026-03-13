import type { Metadata } from 'next';
import { Inter_Tight } from 'next/font/google';
import { ValenPrivyProvider } from '@/components/app/privy-provider';
import { Providers } from '@/providers';
import './globals.css';

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter-tight',
});

export const metadata: Metadata = {
  title: 'VALEN — The Permission Layer for Agentic Finance',
  description:
    'VALEN enforces compliance, risk, and policy before any agent transaction settles on Arbitrum or Robinhood Chain.',
  icons: {
    icon: '/valen-logo.svg',
    apple: '/valen-logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${interTight.variable} min-h-screen antialiased`}>
        <ValenPrivyProvider>
          <Providers>{children}</Providers>
        </ValenPrivyProvider>
      </body>
    </html>
  );
}
