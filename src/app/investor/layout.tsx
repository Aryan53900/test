'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

interface InvestorLayoutProps {
  children: React.ReactNode
}

export default function InvestorLayout({ children }: InvestorLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/investor/login')
      }
    })
    return () => unsubscribe()
  }, [router])

  const navigation = [
    { name: 'Dashboard', href: '/investor' },
    { name: 'Projects', href: '/investor/projects' },
    { name: 'Investments', href: '/investor/investments' },
    { name: 'Profile', href: '/investor/profile' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <h1 className="text-xl font-bold text-primary">Investor Dashboard</h1>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={() => auth.signOut()}
              className="w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  )
} 