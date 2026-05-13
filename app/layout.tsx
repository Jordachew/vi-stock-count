import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/nav'
import { ToastProvider } from '@/components/toast'

export const metadata: Metadata = {
  title: {
    default: "VI Stock Count — Victoria's Intimates",
    template: "%s | VI Stock Count",
  },
  description: "Victoria's Intimates — Physical Inventory Count & Variance Management System",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ backgroundColor: '#0b1120' }}>
        <ToastProvider>
          <Nav />
          <main className="max-w-7xl mx-auto px-4 py-6">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  )
}
