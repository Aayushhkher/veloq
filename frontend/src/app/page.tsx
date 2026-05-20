'use client'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, TrendingUp, Users, Shield, Zap, Sparkles, Building2, ChevronRight, PieChart } from 'lucide-react'
import SiteFooter from '@/components/layout/SiteFooter'
import PricingSection from '@/components/PricingSection'
import { useRef } from 'react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function LandingPage() {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 1000], [0, 200])
  const opacity1 = useTransform(scrollY, [0, 500], [1, 0])

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-hidden flex flex-col font-sans selection:bg-emerald-500/30">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      
      {/* Dynamic ambient backgrounds */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Ultra-minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-2xl transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center transition-transform group-hover:scale-105">
              <TrendingUp className="w-4 h-4 text-black" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-[var(--text-primary)]">VeLOQ</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="text-sm font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] px-5 py-2 rounded-full hover:scale-105 transition-transform">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 relative z-10 pt-32 pb-20">
        
        {/* Hero Section */}
        <section className="relative px-6 pt-20 pb-32 max-w-7xl mx-auto text-center">
          <motion.div style={{ y: y1, opacity: opacity1 }} variants={stagger} initial="hidden" animate="visible" className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The new standard for market research</span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-bold tracking-tighter text-[var(--text-primary)] mb-8 leading-[1.1]">
              Your opinion. <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500">
                True value.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-xl md:text-2xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto font-light leading-relaxed tracking-tight">
              A premium marketplace connecting real people with top companies. Get paid instantly for your genuine insights.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register?role=user" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--text-primary)] text-[var(--bg-primary)] hover:scale-105 transition-transform font-medium px-8 py-4 rounded-full text-lg">
                Start Earning <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/auth/register?role=company" className="w-full sm:w-auto flex items-center justify-center gap-2 glass glass-hover text-[var(--text-primary)] font-medium px-8 py-4 rounded-full text-lg">
                Post a Survey <Building2 className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Interface Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-24 relative mx-auto max-w-5xl rounded-[2.5rem] border border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-3xl shadow-apple-lg overflow-hidden p-2"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
            <div className="aspect-[16/9] rounded-[2rem] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center overflow-hidden relative">
              {/* Mockup UI Elements */}
              <div className="absolute inset-0 grid grid-cols-3 gap-6 p-8">
                <div className="col-span-1 space-y-4">
                  <div className="h-32 rounded-2xl glass flex flex-col justify-center px-6">
                    <div className="text-sm text-[var(--text-secondary)] mb-1">Total Earnings</div>
                    <div className="text-3xl font-bold text-emerald-400">₹14,500.00</div>
                  </div>
                  <div className="h-48 rounded-2xl glass p-6">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 mb-4" />
                    <div className="h-2 w-3/4 bg-[var(--border)] rounded-full mb-2" />
                    <div className="h-2 w-1/2 bg-[var(--border)] rounded-full" />
                  </div>
                </div>
                <div className="col-span-2 rounded-2xl glass p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[60px] rounded-full" />
                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <div className="text-xl font-semibold">Available Surveys</div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">New</div>
                  </div>
                  <div className="space-y-4 relative z-10">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]/50 flex items-center px-6 justify-between">
                        <div className="space-y-2">
                          <div className="h-3 w-48 bg-[var(--border)] rounded-full" />
                          <div className="h-2 w-24 bg-[var(--border)] rounded-full opacity-50" />
                        </div>
                        <div className="h-8 w-24 rounded-full bg-emerald-500/20" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Bento Grid Features */}
        <section className="px-6 py-32 max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-4">Brilliantly designed.</h2>
            <p className="text-xl text-[var(--text-secondary)] font-light">Built for trust, speed, and absolute clarity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Large Card */}
            <div className="md:col-span-2 glass rounded-[2.5rem] p-10 flex flex-col justify-end relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 blur-[80px] rounded-full mix-blend-screen transition-transform duration-700 group-hover:scale-110" />
              <Zap className="w-10 h-10 text-emerald-400 mb-6 relative z-10" />
              <h3 className="text-3xl font-semibold text-[var(--text-primary)] mb-2 relative z-10">Lightning Fast Payouts</h3>
              <p className="text-[var(--text-secondary)] max-w-md relative z-10">Direct to your bank via UPI. The moment you complete a survey, the money is yours.</p>
            </div>

            {/* Small Card */}
            <div className="glass rounded-[2.5rem] p-10 flex flex-col justify-end relative overflow-hidden">
               <Shield className="w-10 h-10 text-[var(--text-primary)] mb-6" />
               <h3 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">DPDP Compliant</h3>
               <p className="text-[var(--text-secondary)] text-sm">Your data is strictly yours. Download, delete, or manage it instantly.</p>
            </div>

            {/* Small Card */}
            <div className="glass rounded-[2.5rem] p-10 flex flex-col justify-end relative overflow-hidden">
               <PieChart className="w-10 h-10 text-[var(--text-primary)] mb-6" />
               <h3 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Deep Analytics</h3>
               <p className="text-[var(--text-secondary)] text-sm">For companies: get pristine, verified data with real-time dashboards.</p>
            </div>

            {/* Large Card */}
            <div className="md:col-span-2 glass rounded-[2.5rem] p-10 flex flex-col justify-end relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
              <Users className="w-10 h-10 text-emerald-400 mb-6 relative z-10" />
              <h3 className="text-3xl font-semibold text-[var(--text-primary)] mb-2 relative z-10">Verified Audiences</h3>
              <p className="text-[var(--text-secondary)] max-w-md relative z-10">Every respondent is KYC verified. Say goodbye to bots and fake responses forever.</p>
            </div>
          </div>
        </section>

      </main>

      {/* Pricing Section */}
      <PricingSection />

      <SiteFooter />
    </div>
  )
}
