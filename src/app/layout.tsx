import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/context';
import { BrandingProvider } from '@/lib/branding/context';
import { RoleSwitcher } from '@/components/ui/RoleSwitcher';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'lead2b - Event Lead Capture & Sales Engagement Platform',
  description: 'Fast, offline-first mobile lead capture and retrieval for exhibitions and conferences',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'lead2b',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          <BrandingProvider>
            <RoleSwitcher />
            <ServiceWorkerRegister />
            {children}
          </BrandingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
