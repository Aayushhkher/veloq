import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/lib/theme'
import ConsentBanner from '@/components/ConsentBanner'
import './globals.css'

export const metadata: Metadata = {
  title: 'VeLOQ — Earn Money Sharing Your Opinion',
  description: 'Complete surveys and earn real money. Companies get genuine insights from real people. DPDP Act 2023 compliant.',
  keywords: ['surveys', 'earn money', 'paid surveys', 'market research', 'India'],
  openGraph: {
    title: 'VeLOQ',
    description: 'Complete surveys and earn real money',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          :root { --font-inter: 'Inter', sans-serif; }
        ` }} />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased font-sans transition-colors duration-300">
        <ThemeProvider>
          {children}
          <ConsentBanner />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--glass-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
