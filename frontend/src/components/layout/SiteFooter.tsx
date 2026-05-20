import Link from 'next/link'
import { TrendingUp, Mail, Phone, MapPin, Shield, FileText, RefreshCw, HelpCircle } from 'lucide-react'

export default function SiteFooter() {
  return (
    <footer className="relative z-10 bg-[var(--bg-secondary)] border-t border-[var(--border)] mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-[var(--text-primary)] flex items-center justify-center shadow-apple-sm">
                <TrendingUp className="w-4 h-4 text-[var(--bg-primary)]" />
              </div>
              <span className="font-semibold text-[var(--text-primary)] text-lg tracking-tight">VeLOQ</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 font-medium">
              India's most trusted paid survey platform. Earn real money sharing your opinion.
            </p>
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-[var(--text-muted)] flex-shrink-0" />
                <span className="leading-snug">VeLOQ Platform Pvt Ltd<br />Virtual Office, WeWork Galaxy<br />Residency Road, Bengaluru — 560025</span>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-6">Legal</h3>
            <ul className="space-y-4">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
                { href: '/refund', label: 'Refund Policy' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-6">Support</h3>
            <ul className="space-y-4">
              {[
                { href: '/grievance', label: 'Grievance Redressal' },
                { href: '/dashboard/profile', label: 'Privacy Portal' },
                { href: 'mailto:support@veloq.in', label: 'Contact Us' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Grievance Officer */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-6">Grievance Officer</h3>
            <div className="bg-[var(--bg-primary)] rounded-[1.5rem] p-5 space-y-3 border border-[var(--border)]">
              <div>
                <p className="font-semibold text-[var(--text-primary)] text-sm">Rajesh Kumar Sharma</p>
                <p className="text-xs text-[var(--text-muted)]">Grievance & Compliance</p>
              </div>
              <div className="pt-3 space-y-2.5 border-t border-[var(--border)] text-sm font-medium">
                <a href="mailto:grievance@veloq.in" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                  grievance@veloq.in
                </a>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                  +91 80 4567 8902
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom / Compliance badges */}
        <div className="border-t border-[var(--border)] pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {['DPDP Act 2023', 'IT Act 2000', 'IS 19000', 'SSL Secured', 'TDS Compliant'].map(badge => (
              <span key={badge} className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-[var(--input-bg)] text-[var(--text-secondary)] border border-[var(--border)] uppercase tracking-wider">
                {badge}
              </span>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)] font-medium text-center md:text-right">
            © {new Date().getFullYear()} VeLOQ Platform Pvt Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
