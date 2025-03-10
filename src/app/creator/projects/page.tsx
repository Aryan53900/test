'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Project } from '@/types/project'
import { getCreatorProjects, updateProject, deleteProject, getProjectById } from '@/lib/firestore'
import { auth } from '@/lib/firebase'
import { toast } from 'react-hot-toast'

export default function CreatorProjects() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Handle client-side initialization
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle authentication and data loading
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeData = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          router.push('/creator/login')
          return
        }

        const userProjects = await getCreatorProjects(user.uid)
        setProjects(userProjects)
      } catch (error) {
        console.error('Error loading projects:', error)
        toast.error('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    // Set up auth listener
    unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/creator/login')
        return
      }
      initializeData()
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [router])

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id)
        setProjects(prev => prev.filter(project => project.id !== id))
        toast.success('Project deleted successfully')
      } catch (error) {
        console.error('Error deleting project:', error)
        toast.error('Failed to delete project')
      }
    }
  }

  const handleStatusChange = async (project: Project, newStatus: Project['status']) => {
    try {
      const existingProject = await getProjectById(project.id)
      if (!existingProject) {
        throw new Error('Project not found in Firestore')
      }

      await updateProject(project.id, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })

      setProjects(prev => prev.map(p => 
        p.id === project.id 
          ? { ...p, status: newStatus }
          : p
      ))

      toast.success(`Project ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating project status:', error)
      toast.error('Failed to update project status')
    }
  }

  // Show loading state
  if (!isClient || loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <Link
            href="/creator/projects/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Create New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
            <div className="mt-6">
              <Link
                href="/creator/projects/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Create New Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
              >
                <div className="relative h-48">
                  <Image
                    src={project.imageUrl}
                    alt={project.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      project.status === 'funded' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-3">{project.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{project.fundingAmount}</span> EDU
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{project.equityOffered}</span>% Equity
                    </div>
                  </div>
                </div>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Link
                        href={`/creator/projects/${project.id}/edit`}
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                    {project.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(project, 'active')}
                        className="text-sm text-green-600 hover:text-green-800"
                      >
                        Activate
                      </button>
                    )}
                    {project.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(project, 'closed')}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 