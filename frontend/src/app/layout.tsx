import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'VALEN Operator Dashboard',
  description: 'Internal validation dashboard for VALEN infrastructure',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-950 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
