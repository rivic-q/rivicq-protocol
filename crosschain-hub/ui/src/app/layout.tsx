import type { Metadata } from 'next';
import './styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'CrossChain Hub | Next-Gen Blockchain Bridge',
  description: 'Secure cross-chain bridge with eIDAS compliance, zero-knowledge proofs, and multi-chain support',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />
          <div className="fixed inset-0 noise-overlay pointer-events-none" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
