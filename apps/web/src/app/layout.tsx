import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VibeTrip',
  description: 'Your vibe-coded travel companion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
