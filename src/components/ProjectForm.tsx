'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Project } from '@/types/project'

interface ProjectFormProps {
  onSubmit: (data: Omit<Project, 'id' | 'creatorId' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>
  initialData?: Project
  isEditing?: boolean
}

export default function ProjectForm({ onSubmit, initialData, isEditing = false }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    imageUrl: initialData?.imageUrl || '',
    githubLink: initialData?.githubLink || '',
    fundingAmount: initialData?.fundingAmount || 0,
    equityOffered: initialData?.equityOffered || 0,
  })
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
      // In a real app, you would upload this to a storage service
      // For now, we'll just use the local URL
      setFormData(prev => ({ ...prev, imageUrl: URL.createObjectURL(file) }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting project:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Project Image</label>
        <div className="mt-1 flex items-center space-x-4">
          <div className="relative h-48 w-48 rounded-lg overflow-hidden bg-gray-100">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Project preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required={!previewUrl}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary/90"
            />
          </div>
        </div>
      </div>

      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Project Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      {/* Project Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Project Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      {/* GitHub Link */}
      <div>
        <label htmlFor="githubLink" className="block text-sm font-medium text-gray-700">
          GitHub Link (Optional)
        </label>
        <input
          type="url"
          id="githubLink"
          value={formData.githubLink}
          onChange={(e) => setFormData(prev => ({ ...prev, githubLink: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      {/* Funding Amount */}
      <div>
        <label htmlFor="fundingAmount" className="block text-sm font-medium text-gray-700">
          Funding Amount (in eduTokens)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            id="fundingAmount"
            min="0"
            step="1"
            value={formData.fundingAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, fundingAmount: Number(e.target.value) }))}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">EDU</span>
          </div>
        </div>
      </div>

      {/* Equity Offered */}
      <div>
        <label htmlFor="equityOffered" className="block text-sm font-medium text-gray-700">
          Equity Offered (%)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            id="equityOffered"
            min="0"
            max="100"
            step="0.1"
            value={formData.equityOffered}
            onChange={(e) => setFormData(prev => ({ ...prev, equityOffered: Number(e.target.value) }))}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">%</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  )
} 