import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Calendar,
  Menu,
  X,
  BarChart3
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/teams', label: 'Teams', icon: Trophy },
  { path: '/players', label: 'Players', icon: Users },
  { path: '/matches', label: 'Matches', icon: Calendar },
  // { path: '/betting', label: 'Betting', icon: BarChart3 },
]

export default function Layout({ children }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a0a14] via-[#0f0f1a] to-[#1a1025] bg-cricket-pattern">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-ipl-blue/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-ipl-gold/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ipl-navy/80 backdrop-blur-xl border-b border-ipl-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ipl-blue to-ipl-navy flex items-center justify-center border-2 border-ipl-gold/50 group-hover:border-ipl-gold transition-colors">
                <Trophy className="w-5 h-5 text-ipl-gold" />
              </div>
              <div>
                <h1 className="font-display text-2xl tracking-wider text-white">
                  IPL<span className="text-ipl-gold">2022</span>
                </h1>
                <p className="text-[10px] text-gray-400 -mt-1 tracking-widest">ANALYTICS</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-ipl-gold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-ipl-blue/20 rounded-lg border border-ipl-gold/30"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-ipl-navy/95 border-t border-ipl-gold/10"
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-6 py-4 border-b border-white/5 ${
                    isActive ? 'text-ipl-gold bg-ipl-blue/10' : 'text-gray-400'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </motion.nav>
        )}
      </header>

      {/* Main Content */}
      <main className="relative flex-grow pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative mt-auto border-t border-ipl-gold/10 bg-ipl-navy/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2022 IPL Analytics. Built with React & Prisma.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>Season: 2022</span>
              <span>•</span>
              <span>10 Teams</span>
              <span>•</span>
              <span>74 Matches</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

