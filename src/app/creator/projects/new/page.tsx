'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { auth, db } from '@/lib/firebase'
import { saveProject, getProjectById } from '@/lib/firestore'
import { Project } from '@/types/project'
import { connectMetaMask, getCurrentAccount, isMetaMaskInstalled } from '@/lib/web3'

export default function NewProject() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fundingAmount, setFundingAmount] = useState('')
  const [equityOffered, setEquityOffered] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/creator/login')
        return
      }

      // Check if MetaMask is installed and connected
      if (isMetaMaskInstalled()) {
        const account = await getCurrentAccount()
        if (account) {
          setWalletAddress(account)
        }
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleConnectWallet = async () => {
    try {
      setIsConnectingWallet(true)
      setError('')
      
      if (!isMetaMaskInstalled()) {
        throw new Error('Please install MetaMask to continue')
      }

      const account = await connectMetaMask()
      setWalletAddress(account)
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setError(error instanceof Error ? error.message : 'Failed to connect wallet')
    } finally {
      setIsConnectingWallet(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submit button clicked')
    console.log('Current state:', {
      isSubmitting,
      name,
      description,
      fundingAmount,
      equityOffered,
      walletAddress,
      authUser: auth.currentUser?.uid
    })

    if (!auth.currentUser) {
      console.error('No authenticated user found')
      setError('Please log in to create a project')
      return
    }

    if (!walletAddress) {
      setError('Please connect your wallet to receive funding')
      return
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setError('Please enter a valid Ethereum wallet address')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      // Validate funding amount with more precise decimals
      const amount = parseFloat(fundingAmount)
      if (isNaN(amount) || amount <= 0 || amount > 1) {
        throw new Error('Please enter a funding amount between 0 and 1 EDU')
      }

      // Allow up to 6 decimal places for precision
      const roundedAmount = Math.round(amount * 1000000) / 1000000

      // Validate equity offered
      const equity = parseFloat(equityOffered)
      if (isNaN(equity) || equity <= 0 || equity > 100) {
        throw new Error('Please enter a valid equity percentage (0-100)')
      }

      const project: Omit<Project, 'id'> = {
        name,
        description,
        imageUrl: 'https://picsum.photos/600/400',
        fundingAmount: roundedAmount,
        equityOffered: equity,
        status: 'draft',
        creatorId: auth.currentUser.uid,
        creatorWalletAddress: walletAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      try {
        console.log('Attempting to save project to Firestore:', {
          projectData: project,
          userId: auth.currentUser.uid,
          authState: auth.currentUser.email
        })

        // Verify Firebase is initialized
        if (!db) {
          throw new Error('Firebase is not properly initialized')
        }

        const projectId = await saveProject(project)
        console.log('Project saved successfully to Firestore with ID:', projectId)
        
        // Add a small delay to ensure Firestore has processed the document
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verify the project was saved correctly
        const savedProject = await getProjectById(projectId)
        if (!savedProject) {
          throw new Error('Project was not saved correctly')
        }
        
        console.log('Project verified in Firestore:', savedProject)
        router.push('/creator/projects')
      } catch (error) {
        console.error('Detailed error saving project to Firestore:', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          projectData: project
        })
        throw new Error(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error in handleSubmit:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      })
      setError(error instanceof Error ? error.message : 'Failed to create project')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Create New Project
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Fill in the details below to create your new project.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="mt-5 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Project Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fundingAmount" className="block text-sm font-medium text-gray-700">
                  Funding Amount (EDU)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="fundingAmount"
                    id="fundingAmount"
                    required
                    min="0"
                    max="1"
                    step="0.000001"
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="equityOffered" className="block text-sm font-medium text-gray-700">
                  Equity Offered (%)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="equityOffered"
                    id="equityOffered"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={equityOffered}
                    onChange={(e) => setEquityOffered(e.target.value)}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">
                  Wallet Address
                </label>
                <div className="mt-1 flex space-x-3">
                  <input
                    type="text"
                    name="walletAddress"
                    id="walletAddress"
                    required
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={handleConnectWallet}
                    disabled={isConnectingWallet}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnectingWallet ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Connect your wallet to receive funding for your project
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !walletAddress}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 