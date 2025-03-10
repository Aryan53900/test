'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Project } from '@/types/project'
import { getActiveProjects } from '@/lib/firestore'
import { auth } from '@/lib/firebase'
import { connectMetaMask, getCurrentAccount, listenToAccountChanges, isMetaMaskInstalled } from '@/lib/web3'

export default function InvestorProjects() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/investor/login')
        return
      }
      
      try {
        // Load active projects from Firestore
        const activeProjects = await getActiveProjects()
        console.log('Loaded active projects:', activeProjects)
        setProjects(activeProjects)

        // Check if MetaMask is installed and connected
        if (isMetaMaskInstalled()) {
          const account = await getCurrentAccount()
          if (account) {
            setIsWalletConnected(true)
            setWalletAddress(account)
          }
        }
      } catch (error) {
        console.error('Error loading projects:', error)
        setError('Failed to load projects')
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    // Listen for account changes
    const cleanup = listenToAccountChanges((account) => {
      setIsWalletConnected(!!account)
      setWalletAddress(account || '')
    })

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  const handleConnectWallet = async () => {
    try {
      if (!isMetaMaskInstalled()) {
        throw new Error('Please install MetaMask to continue')
      }

      const account = await connectMetaMask()
      setIsWalletConnected(true)
      setWalletAddress(account)
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setError(error instanceof Error ? error.message : 'Failed to connect wallet')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Projects</h1>
          <div className="flex items-center space-x-4">
            {!isWalletConnected ? (
              <button
                onClick={handleConnectWallet}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Connected:</span>
                <span className="text-sm font-medium text-primary">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error}
                </h3>
                {error.includes('install') && (
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-xs text-primary hover:text-primary/80 underline"
                  >
                    Install MetaMask
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={project.imageUrl}
                  alt={project.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
                <p className="mt-2 text-gray-600 line-clamp-2">{project.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Funding Amount</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">{project.fundingAmount} EDU</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Equity Offered</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">{project.equityOffered}%</dd>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href={`/investor/projects/${project.id}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 