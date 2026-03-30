import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VibeTrip - 你的氛围感旅行搭子',
  description: '用 AI 一句话规划你的完美旅程，支持带父母、亲子、情侣、闺蜜等场景',
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
