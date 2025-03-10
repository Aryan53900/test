'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Project } from '@/types/project'
import { getProjectById } from '@/lib/firestore'
import { auth } from '@/lib/firebase'
import InvestmentFlow from '@/components/InvestmentFlow'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProjectDetails({ params }: PageProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInvestmentFlow, setShowInvestmentFlow] = useState(false)
  const { id: projectId } = React.use(params)

  useEffect(() => {
    console.log('Loading project with ID:', projectId)
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/investor/login')
        return
      }

      try {
        const projectData = await getProjectById(projectId)
        console.log('Project data:', projectData)
        if (!projectData) {
          setError('Project not found')
          setLoading(false)
          return
        }

        if (projectData.status !== 'active') {
          router.push('/investor/projects')
          return
        }

        setProject(projectData)
      } catch (error) {
        console.error('Error loading project:', error)
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router, projectId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link
            href="/investor/projects"
            className="mt-4 inline-block text-primary hover:text-primary/80"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Project not found</p>
          <Link
            href="/investor/projects"
            className="mt-4 inline-block text-primary hover:text-primary/80"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/investor/projects"
            className="text-primary hover:text-primary/80 mb-4 inline-block"
          >
            ← Back to Projects
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src={project.imageUrl}
                alt={project.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900">Project Description</h2>
              <p className="mt-2 text-gray-600">{project.description}</p>
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Funding Amount</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{project.fundingAmount} EDU</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Equity Offered</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{project.equityOffered}%</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Make an Investment</h2>
            <button
              onClick={() => setShowInvestmentFlow(true)}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Invest Now
            </button>
          </div>
        </div>
      </div>

      {showInvestmentFlow && (
        <InvestmentFlow
          project={project}
          onClose={() => setShowInvestmentFlow(false)}
        />
      )}
    </div>
  )
} 