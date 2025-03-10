'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileForm, { ProfileData } from '@/components/ProfileForm'
import { saveProfileToLocal, getProfileFromLocal, isProfileComplete } from '@/lib/localStorage'
import { auth } from '@/lib/firebase'

export default function InvestorProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/investor/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleSubmit = async (data: ProfileData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      // Validate data
      if (!data.name || !data.email || !data.githubLink || !data.linkedinLink || !data.contactNo || !data.calendlyLink) {
        throw new Error('All fields are required')
      }

      // Validate URLs
      try {
        new URL(data.githubLink)
        new URL(data.linkedinLink)
        new URL(data.calendlyLink)
      } catch {
        throw new Error('Invalid URL format')
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        throw new Error('Invalid email format')
      }

      // Get current user
      const user = auth.currentUser
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Save profile data to local storage
      saveProfileToLocal({
        ...data,
        userType: 'investor',
        userId: user.uid,
        updatedAt: new Date().toISOString()
      })

      setSuccess(true)
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/investor/dashboard')
      }, 1500)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Complete Your Investor Profile
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Please provide your information to complete your profile. This information will be visible to creators.
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">Profile saved successfully! Redirecting to dashboard...</p>
              </div>
            )}

            <div className="mt-5">
              <ProfileForm 
                onSubmit={handleSubmit} 
                userType="investor"
                initialData={getProfileFromLocal()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 