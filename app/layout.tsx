import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AdPilot AI — Autonomous Advertising Copilot',
  description: 'Analyze a product, generate campaigns, and optimize advertising with an AI copilot.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
