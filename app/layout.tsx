import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VisionAgents.ai - Video Streaming Demo',
  description: 'Real-time video streaming demo using VisionAgents.ai and Next.js',
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
