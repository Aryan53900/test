'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { getProjectInvestments } from '@/lib/firestore'
import { Investment } from '@/types/investment'
import { Project } from '@/types/project'
import InvestmentDetails from '@/components/InvestmentDetails'

export default function CreatorInvestments() {
  const router = useRouter()
  const [investments, setInvestments] = useState<(Investment & { project: Project })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchInvestments = async () => {
    try {
      if (!auth.currentUser) {
        router.push('/creator/login')
        return
      }

      const creatorInvestments = await getProjectInvestments(auth.currentUser.uid)
      // Sort investments: pending first, then completed, then cancelled
      const sortedInvestments = creatorInvestments.sort((a, b) => {
        const statusOrder = { pending: 0, completed: 1, cancelled: 2 }
        return statusOrder[a.status] - statusOrder[b.status]
      })
      setInvestments(sortedInvestments)
    } catch (error) {
      console.error('Error fetching investments:', error)
      setError('Failed to load investment requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvestments()
  }, [router])

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
      <h1 className="text-3xl font-bold mb-8">Investment Requests</h1>
      
      {investments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No investment requests found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {investments.map((investment) => (
            <InvestmentDetails
              key={investment.id}
              investment={investment}
              isCreator={true}
              onUpdate={fetchInvestments}
            />
          ))}
        </div>
      )}
    </div>
  )
} 