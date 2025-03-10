'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { getInvestmentsByInvestorId, getProjectById } from '@/lib/firestore'
import { Investment } from '@/types/investment'
import { Project } from '@/types/project'
import InvestmentDetails from '@/components/InvestmentDetails'

export default function InvestorInvestments() {
  const router = useRouter()
  const [investments, setInvestments] = useState<(Investment & { project: Project })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all')

  const fetchInvestments = async () => {
    try {
      if (!auth.currentUser) {
        router.push('/investor/login')
        return
      }

      const investorInvestments = await getInvestmentsByInvestorId(auth.currentUser.uid)
      
      // Fetch project details for each investment
      const investmentsWithProjects = await Promise.all(
        investorInvestments.map(async (investment) => {
          try {
            const project = await getProjectById(investment.projectId)
            if (!project) {
              console.warn(`Project not found for investment ${investment.id}`)
              return null
            }
            return {
              ...investment,
              project
            }
          } catch (error) {
            console.error(`Error fetching project for investment ${investment.id}:`, error)
            return null
          }
        })
      )

      // Filter out investments with missing projects
      const validInvestments = investmentsWithProjects.filter((investment): investment is (Investment & { project: Project }) => 
        investment !== null
      )

      // Sort investments: pending first, then completed, then cancelled
      const sortedInvestments = validInvestments.sort((a, b) => {
        const statusOrder = { pending: 0, completed: 1, cancelled: 2 }
        return statusOrder[a.status] - statusOrder[b.status]
      })

      setInvestments(sortedInvestments)
    } catch (error) {
      console.error('Error fetching investments:', error)
      setError('Failed to load investments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvestments()
  }, [router])

  const filteredInvestments = investments.filter(investment => 
    filter === 'all' ? true : investment.status === filter
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Investments</h1>
        
        {/* Status Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md ${
              filter === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-md ${
              filter === 'cancelled'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {filteredInvestments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No investments found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredInvestments.map((investment) => (
            <div key={investment.id} className="relative">
              <InvestmentDetails
                investment={investment}
                onUpdate={fetchInvestments}
              />
              <button
                onClick={() => router.push(`/investor/investments/${investment.id}`)}
                className="absolute top-4 right-4 text-primary hover:text-primary/80"
                title="View Details"
              >
                →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 