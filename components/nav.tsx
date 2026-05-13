'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BarChart3, ClipboardList, Database, Home, Menu, Settings, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/master-data', label: 'Master Data', icon: Database },
  { href: '/sessions', label: 'Count Sessions', icon: ClipboardList },
  { href: '/variance', label: 'Variance Report', icon: BarChart3 },
  { href: '/admin', label: 'Admin', icon: Settings },
]

export function Nav() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-navy-900 border-b border-navy-700 sticky top-0 z-50" style={{ backgroundColor: '#0f1729', borderColor: '#1e3a5f' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-pink-500 flex items-center justify-center text-white font-bold text-xs">VI</div>
            <span className="text-white font-semibold text-sm hidden sm:block">Stock Count</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded text-sm transition-colors',
                  pathname === href
                    ? 'bg-pink-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-slate-300 hover:text-white p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-2" style={{ backgroundColor: '#0f1729' }}>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded text-sm transition-colors mb-1',
                pathname === href
                  ? 'bg-pink-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
