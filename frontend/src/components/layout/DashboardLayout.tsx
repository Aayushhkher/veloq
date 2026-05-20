'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, LayoutDashboard, ClipboardList, Wallet, LogOut,
  User, Menu, X, ChevronRight, Bell, Settings, Building2,
  BarChart3, Users, ShieldCheck, Sun, Moon, Shield, HelpCircle,
  Star
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const userNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/surveys', icon: ClipboardList, label: 'Discover' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet & Tax' },
  { href: '/dashboard/profile', icon: User, label: 'Account' },
  { href: '/grievance', icon: HelpCircle, label: 'Support', external: true },
]

const companyNav = [
  { href: '/dashboard/company', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/company/surveys', icon: ClipboardList, label: 'My Surveys' },
  { href: '/dashboard/company/create', icon: BarChart3, label: 'Create New' },
  { href: '/dashboard/company/wallet', icon: Wallet, label: 'Billing' },
  { href: '/dashboard/profile', icon: User, label: 'Account' },
]

const adminNav = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/surveys', icon: ClipboardList, label: 'Surveys' },
  { href: '/admin/withdrawals', icon: Wallet, label: 'Withdrawals' },
  { href: '/admin/companies', icon: Building2, label: 'Companies' },
  { href: '/admin/grievances', icon: HelpCircle, label: 'Grievances' },
  { href: '/admin/reviews', icon: Star, label: 'Reviews' },
  { href: '/admin/compliance', icon: Shield, label: 'Compliance' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!user) router.push('/auth/login')
  }, [user])

  if (!user) return null

  const nav = user.role === 'admin' ? adminNav : user.role === 'company' ? companyNav : userNav

  const handleLogout = () => { logout(); router.push('/') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden bg-transparent">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[var(--text-primary)] flex items-center justify-center flex-shrink-0 shadow-sm">
          <TrendingUp className="w-4 h-4 text-[var(--bg-primary)]" />
        </div>
        <span className="font-semibold text-[var(--text-primary)] tracking-tight text-lg">VeLOQ</span>
        {user.role === 'admin' && (
          <span className="ml-auto text-[10px] font-bold bg-emerald-500/20 text-emerald-500 px-2.5 py-1 rounded-full uppercase tracking-wider">Admin</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hidden" role="navigation" aria-label="Main navigation">
        <p className="px-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Menu</p>
        {nav.map((item) => {
          const active = pathname === item.href || ('external' in item ? false : item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[14px] font-medium transition-all group relative',
                active
                  ? 'text-[var(--text-primary)] bg-[var(--bg-card)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0 transition-colors', active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]')} aria-hidden="true" />
              {item.label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" aria-hidden="true" />}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-[1.25rem] bg-[var(--bg-card)] shadow-sm border border-[var(--border)] mb-2">
          <div className="w-9 h-9 rounded-full bg-[var(--input-bg)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={`${user.full_name} avatar`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-[var(--text-primary)]" aria-hidden="true">{user.full_name[0].toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.full_name}</p>
            <p className="text-[11px] text-[var(--text-secondary)] truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-[1.25rem] text-sm font-medium text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden font-sans">
      
      {/* Desktop Sidebar (Floating Style) */}
      <aside className="hidden lg:flex flex-col w-[260px] m-4 mr-0 rounded-[2rem] bg-[var(--sidebar-bg)] backdrop-blur-3xl border border-[var(--border)] shadow-apple-sm flex-shrink-0 relative z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} />
            <motion.aside
              className="fixed left-4 top-4 bottom-4 w-[260px] rounded-[2rem] bg-[var(--sidebar-bg)] backdrop-blur-3xl border border-[var(--border)] shadow-apple-lg z-50 lg:hidden overflow-hidden"
              initial={{ x: -300, scale: 0.95 }} animate={{ x: 0, scale: 1 }} exit={{ x: -300, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top bar (Glass) */}
        <header className="flex items-center justify-between px-6 py-4 lg:py-6 bg-[var(--bg-primary)]/70 backdrop-blur-2xl flex-shrink-0 sticky top-0 z-10 supports-[backdrop-filter]:bg-[var(--bg-primary)]/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="hidden lg:block">
              <p className="font-semibold text-[var(--text-primary)] text-lg tracking-tight">
                {nav.find(n => pathname === n.href || (('external' in n ? false : n.href !== '/dashboard' && n.href !== '/admin') && pathname.startsWith(n.href)))?.label || 'Dashboard'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'user' && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
                <Wallet className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">₹{user.wallet_balance.toFixed(2)}</span>
              </div>
            )}
            {/* KYC badge */}
            {user.role === 'user' && (
              <span className={cn('hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider', (user as any).kyc_status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500')}>
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                {(user as any).kyc_status === 'verified' ? 'Verified' : 'Action Req'}
              </span>
            )}
            
            <div className="flex items-center gap-1 ml-2">
              <button onClick={toggleTheme} className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
              </button>
              <button className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors" aria-label="Notifications">
                <Bell className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto scroll-smooth" tabIndex={-1}>
          <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
