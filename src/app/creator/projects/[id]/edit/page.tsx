'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProjectForm from '@/components/ProjectForm'
import { getProjectById, updateProject } from '@/lib/firestore'
import { auth } from '@/lib/firebase'
import { Project } from '@/types/project'
import { toast } from 'react-hot-toast'

export default function EditProject({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
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

        const projectData = await getProjectById(params.id)
        if (!projectData) {
          toast.error('Project not found')
          router.push('/creator/projects')
          return
        }

        // Verify the user owns this project
        if (projectData.creatorId !== user.uid) {
          toast.error('You do not have permission to edit this project')
          router.push('/creator/projects')
          return
        }

        setProject(projectData)
      } catch (error) {
        console.error('Error loading project:', error)
        toast.error('Failed to load project')
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
  }, [router, params.id])

  const handleSubmit = async (data: Omit<Project, 'id' | 'creatorId' | 'createdAt' | 'updatedAt' | 'status'>) => {
    try {
      if (!project) {
        throw new Error('Project not found')
      }

      const updatedProject: Partial<Project> = {
        ...data,
        updatedAt: new Date().toISOString()
      }

      await updateProject(project.id, updatedProject)
      toast.success('Project updated successfully')
      router.push('/creator/projects')
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
      throw error
    }
  }

  // Show loading state
  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Project not found</h3>
          <p className="mt-2 text-sm text-gray-500">The project you're looking for doesn't exist.</p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/creator/projects')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Edit Project
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Update your project details to keep investors informed.
              </p>
            </div>
            <div className="mt-5">
              <ProjectForm 
                onSubmit={handleSubmit} 
                initialData={project}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 