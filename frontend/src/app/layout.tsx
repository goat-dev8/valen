import type { Metadata } from 'next';
import { ValenPrivyProvider } from '@/components/app/privy-provider';
import { Providers } from '@/providers';
import { fontVariables } from '@/lib/fonts';
import './globals.css';

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
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen font-sans antialiased">
        <ValenPrivyProvider>
          <Providers>{children}</Providers>
        </ValenPrivyProvider>
      </body>
    </html>
  );
}
