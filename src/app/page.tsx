import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-primary">
                Idea Nest
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link href="/investor/login" className="btn-primary">
                Investor Login
              </Link>
              <Link href="/creator/login" className="btn-secondary">
                Creator Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Connect Your Ideas with the Right Investors
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Idea Nest brings together innovators and investors, creating a platform where great ideas can flourish and grow into successful businesses.
              </p>
              <div className="flex space-x-4">
                <Link href="/creator/register" className="btn-primary">
                  Start Your Project
                </Link>
                <Link href="/investor/register" className="btn-secondary">
                  Become an Investor
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[600px] bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-2xl font-semibold text-gray-600"><img src="̀assets/Untitled design.png" alt="" /></p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 