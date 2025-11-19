'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  Download,
  Calendar
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

const sidebarItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'jobs',
    label: 'Job Postings',
    icon: Briefcase,
    href: '/dashboard/jobs',
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    href: '/dashboard/reports',
  },
  {
    id: 'interviews',
    label: 'Interviews',
    icon: Calendar,
    href: '/dashboard/interviews',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: Settings,
    href: '/dashboard/profile',
  },
]

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { signOut } = useAuth()
  const router = useRouter()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc =
    resolvedTheme === 'light'
      ? '/assets/logo/black_logo.png'
      : '/assets/logo/ChatGPT%20Image%20Nov%208,%202025,%2010_47_18%20PM.png'

  const handleLogout = async () => {
    await signOut()
    // The redirect will be handled by the auth state change
    window.location.href = '/'
  }

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-black border-r border-border shadow-lg h-screen sticky top-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      } transition-all duration-300 overflow-y-auto`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              {mounted ? (
                <Image
                  src={logoSrc}
                  alt="Hirebit logo"
                  fill
                  sizes="40px"
                  className="object-contain"
                  priority
                />
              ) : (
                <span className="block h-full w-full rounded-lg bg-muted-foreground/20" />
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-figtree font-extralight text-gray-900 dark:text-white">HR AI Dashboard</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-figtree font-light">Recruitment Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 sm:p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#2D2DDD]/10 to-[#2D2DDD]/5 dark:from-[#2D2DDD]/20 dark:to-[#2D2DDD]/10 text-[#2D2DDD] dark:text-white border border-[#2D2DDD]/30 dark:border-[#2D2DDD]/50'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#2D2DDD] dark:hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#2D2DDD]' : 'text-gray-500 dark:text-gray-400 group-hover:text-[#2D2DDD]'}`} />
                {!isCollapsed && (
                  <>
                    <span className="font-figtree font-medium">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto text-[#2D2DDD]" />
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* Reports Section */}
        {!isCollapsed && (
          <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-[#2D2DDD]/5 to-[#2D2DDD]/10 dark:from-[#2D2DDD]/10 dark:to-[#2D2DDD]/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-4 h-4 text-[#2D2DDD]" />
                <span className="text-sm font-semibold font-figtree text-gray-900 dark:text-white">Quick Reports</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-figtree font-light mb-3">
                Download comprehensive reports from Google Sheets
              </p>
              <Button
                size="sm"
                className="w-full text-xs bg-[#2D2DDD] hover:bg-[#2D2DDD]/90 text-white"
                onClick={() => onSectionChange('reports')}
              >
                <Download className="w-3 h-3 mr-1" />
                Generate Report
              </Button>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="default"
            onClick={handleLogout}
            className="w-full justify-start bg-[#2D2DDD] text-white hover:bg-[#2D2DDD] hover:text-white"
          >
            <LogOut className="w-5 h-5 mr-3" />
            {!isCollapsed && <span className="font-figtree font-medium">Sign Out</span>}
          </Button>
        </div>

        {/* Collapse Toggle */}
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
