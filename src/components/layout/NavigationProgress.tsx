'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { TravelLoader } from '@/components/ui/TravelLoader'

export function NavigationProgress() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPathnameRef = useRef(pathname)

  // Detect link clicks and show loader if navigation takes time
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return
      // Skip: external, anchor-only, same page, new tab, modified clicks
      if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) return
      if (href === pathname) return
      if ((anchor as HTMLAnchorElement).target === '_blank') return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      if (timerRef.current) clearTimeout(timerRef.current)
      // Only show loader if navigation actually takes time (>120ms)
      timerRef.current = setTimeout(() => setLoading(true), 120)
    }

    document.addEventListener('click', onLinkClick, true)
    return () => {
      document.removeEventListener('click', onLinkClick, true)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname])

  // Hide when navigation completes (pathname changed)
  useEffect(() => {
    if (pathname === prevPathnameRef.current) return
    prevPathnameRef.current = pathname
    if (timerRef.current) clearTimeout(timerRef.current)
    setLoading(false)
  }, [pathname])

  // Safety valve: never stay stuck
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setLoading(false), 10_000)
    return () => clearTimeout(t)
  }, [loading])

  return <TravelLoader visible={loading} />
}
