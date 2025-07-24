import type { Metadata } from 'next'
import { LogoProvider } from '@/app/logoContext';
import { ZelleLogoProvider } from './zellLogoContext';
import './globals.css'
import { LogVisit } from '@/components/LogVisit';

export const metadata: Metadata = {
  title: 'Free International Banking',
  description: 'Created by Venhash',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ZelleLogoProvider>
          <LogoProvider>
            <LogVisit />
            {children}
          </LogoProvider>
        </ZelleLogoProvider>
      </body>
    </html>
  );
}

