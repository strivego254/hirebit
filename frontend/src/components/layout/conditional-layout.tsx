'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/footer/footer'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR, always show navbar/footer to prevent hydration mismatch
  if (!mounted) {
    return (
      <>
        <Navbar />
        <main className="pt-0">{children}</main>
        <Footer />
      </>
    )
  }

  const isDashboard = pathname?.startsWith('/dashboard') || false
  const isAuth = pathname?.startsWith('/auth') || false
  const isAdmin = pathname?.startsWith('/admin') || false

  // Hide navbar and footer for dashboard, auth, and admin pages
  if (isDashboard || isAuth || isAdmin) {
    return <>{children}</>
  }

  // Show navbar and footer for all other pages
  return (
    <>
      <Navbar />
      <main className="pt-0">{children}</main>
      <Footer />
    </>
  )
}
