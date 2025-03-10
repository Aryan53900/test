'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface ProfileFormProps {
  onSubmit: (data: ProfileData) => Promise<void>
  initialData?: ProfileData | null
  userType: 'investor' | 'creator'
}

export interface ProfileData {
  name: string
  email: string
  githubLink: string
  linkedinLink: string
  contactNo: string
  calendlyLink: string
  photo: File | null
  photoUrl?: string | null
}

export default function ProfileForm({ onSubmit, initialData, userType }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    githubLink: initialData?.githubLink || '',
    linkedinLink: initialData?.linkedinLink || '',
    contactNo: initialData?.contactNo || '',
    calendlyLink: initialData?.calendlyLink || '',
    photo: initialData?.photo || null,
    photoUrl: initialData?.photoUrl || null,
  })
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.photoUrl || null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }))
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting profile:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
        <div className="mt-1 flex items-center space-x-4">
          <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Profile preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
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

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name
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

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      {/* GitHub Link */}
      <div>
        <label htmlFor="githubLink" className="block text-sm font-medium text-gray-700">
          GitHub Profile Link
        </label>
        <input
          type="url"
          id="githubLink"
          value={formData.githubLink}
          onChange={(e) => setFormData(prev => ({ ...prev, githubLink: e.target.value }))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      {/* LinkedIn Link */}
      <div>
        <label htmlFor="linkedinLink" className="block text-sm font-medium text-gray-700">
          LinkedIn Profile Link
        </label>
        <input
          type="url"
          id="linkedinLink"
          value={formData.linkedinLink}
          onChange={(e) => setFormData(prev => ({ ...prev, linkedinLink: e.target.value }))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      {/* Contact Number */}
      <div>
        <label htmlFor="contactNo" className="block text-sm font-medium text-gray-700">
          Contact Number
        </label>
        <input
          type="tel"
          id="contactNo"
          value={formData.contactNo}
          onChange={(e) => setFormData(prev => ({ ...prev, contactNo: e.target.value }))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      {/* Calendly Link */}
      <div>
        <label htmlFor="calendlyLink" className="block text-sm font-medium text-gray-700">
          Calendly Link
        </label>
        <input
          type="url"
          id="calendlyLink"
          value={formData.calendlyLink}
          onChange={(e) => setFormData(prev => ({ ...prev, calendlyLink: e.target.value }))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
} 