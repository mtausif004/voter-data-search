import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Live Voter Data Search',
  description: 'ভোটার লিস্ট সার্চ টুল',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
