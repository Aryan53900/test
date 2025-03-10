'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { getInvestmentsByInvestorId, getProjectById } from '@/lib/firestore'
import { Investment } from '@/types/investment'
import { Project } from '@/types/project'
import InvestmentDetails from '@/components/InvestmentDetails'

interface PageProps {
  params: {
    id: string
  }
}

export default function InvestorInvestmentDetails({ params }: PageProps) {
  const router = useRouter()
  const [investment, setInvestment] = useState<(Investment & { project: Project }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchInvestment = async () => {
    try {
      if (!auth.currentUser) {
        router.push('/investor/login')
        return
      }

      const investments = await getInvestmentsByInvestorId(auth.currentUser.uid)
      const foundInvestment = investments.find(inv => inv.id === params.id)

      if (!foundInvestment) {
        setError('Investment not found')
        return
      }

      const project = await getProjectById(foundInvestment.projectId)
      if (!project) {
        setError('Project not found')
        return
      }

      setInvestment({
        ...foundInvestment,
        project
      })
    } catch (error) {
      console.error('Error fetching investment:', error)
      setError('Failed to load investment details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvestment()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !investment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error || 'Investment not found'}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-primary hover:text-primary/80 flex items-center gap-2"
        >
          ← Back to Investments
        </button>
      </div>

      <InvestmentDetails
        investment={investment}
        onUpdate={fetchInvestment}
      />
    </div>
  )
} 