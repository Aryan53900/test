'use client'

import React, { useState } from 'react'
import { Investment } from '@/types/investment'
import { Project } from '@/types/project'
import { updateInvestment } from '@/lib/firestore'
import { auth } from '@/lib/firebase'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

interface InvestmentDetailsProps {
  investment: Investment & { project: Project }
  isCreator?: boolean
  onUpdate?: () => void
}

export default function InvestmentDetails({ investment, isCreator = false, onUpdate }: InvestmentDetailsProps) {
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleUpdateCallStatus = async (status: 'successful' | 'scheduled') => {
    try {
      await updateInvestment(investment.id, {
        callStatus: status
      })
      onUpdate?.()
    } catch (error) {
      console.error('Error updating call status:', error)
      setError('Failed to update call status')
    }
  }

  const handleUpdateDealStatus = async (status: 'confirmed' | 'thinking') => {
    try {
      await updateInvestment(investment.id, {
        dealStatus: status
      })
      onUpdate?.()
    } catch (error) {
      console.error('Error updating deal status:', error)
      setError('Failed to update deal status')
    }
  }

  const handleMouUpload = async (file: File) => {
    try {
      setUploading(true)
      setError('')

      // Check authentication status
      const user = auth.currentUser
      if (!user) {
        console.error('No authenticated user found')
        throw new Error('Please sign in to upload files')
      }

      console.log('User authenticated:', {
        uid: user.uid,
        email: user.email
      })

      // Validate file type
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed')
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }

      console.log('Starting MOU upload...')
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      })

      // Create a unique filename with user ID for better security
      const timestamp = new Date().getTime()
      const filename = `${user.uid}_${investment.id}_${isCreator ? 'creator' : 'investor'}_${timestamp}.pdf`
      const storageRef = ref(storage, `mou/${filename}`)

      console.log('Attempting to upload to path:', `mou/${filename}`)
      
      // Upload the file with metadata
      const metadata = {
        contentType: 'application/pdf',
        customMetadata: {
          'userId': user.uid,
          'investmentId': investment.id,
          'uploadedBy': isCreator ? 'creator' : 'investor'
        }
      }

      const uploadResult = await uploadBytes(storageRef, file, metadata)
      console.log('Upload successful:', uploadResult)

      console.log('Getting download URL...')
      const downloadUrl = await getDownloadURL(storageRef)
      console.log('Download URL obtained:', downloadUrl)

      console.log('Updating investment record...')
      // Update the investment with the appropriate MOU URL
      await updateInvestment(investment.id, {
        [isCreator ? 'creatorMouUrl' : 'investorMouUrl']: downloadUrl
      })
      console.log('Investment record updated successfully')

      onUpdate?.()
    } catch (error) {
      console.error('Detailed error in MOU upload:', error)
      if (error instanceof Error) {
        setError(`Failed to upload MOU: ${error.message}`)
      } else {
        setError('Failed to upload MOU. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{investment.project.name}</h2>
        <p className="text-gray-600">{investment.project.description}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Investment Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Investment Amount</h3>
            <p className="text-lg font-semibold">{investment.amount} EDU</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              investment.status === 'completed' ? 'bg-green-100 text-green-800' :
              investment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Calendly Link */}
        {investment.calendlyLink && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Calendly Link</h3>
            <div className="flex items-center gap-2">
              <a
                href={investment.calendlyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 break-all flex-1"
              >
                {investment.calendlyLink}
              </a>
              <button
                onClick={() => {
                  if (investment.calendlyLink) {
                    navigator.clipboard.writeText(investment.calendlyLink)
                  }
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Copy link"
              >
                📋
              </button>
            </div>
          </div>
        )}

        {/* Call Status */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Call Status</h3>
          <div className="flex items-center gap-4">
            {investment.callStatus ? (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                investment.callStatus === 'successful' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {investment.callStatus === 'successful' ? 'Call Completed' : 'Call Scheduled'}
              </span>
            ) : (
              <p className="text-gray-500">No call scheduled yet</p>
            )}
            {investment.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateCallStatus('scheduled')}
                  className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 text-sm"
                >
                  Mark as Scheduled
                </button>
                <button
                  onClick={() => handleUpdateCallStatus('successful')}
                  className="bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600 text-sm"
                >
                  Mark as Completed
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Deal Status */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Deal Status</h3>
          <div className="flex items-center gap-4">
            {investment.dealStatus ? (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                investment.dealStatus === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {investment.dealStatus === 'confirmed' ? 'Deal Confirmed' : 'Under Consideration'}
              </span>
            ) : (
              <p className="text-gray-500">Deal status not set</p>
            )}
            {investment.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateDealStatus('confirmed')}
                  className="bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600 text-sm"
                >
                  Confirm Deal
                </button>
                <button
                  onClick={() => handleUpdateDealStatus('thinking')}
                  className="bg-yellow-500 text-white py-1 px-3 rounded-md hover:bg-yellow-600 text-sm"
                >
                  Under Consideration
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MOU Documents */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">MOU Documents</h3>
          <div className="space-y-4">
            {/* Creator's MOU */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Creator's MOU</h4>
              {investment.creatorMouUrl ? (
                <div className="space-y-2">
                  <a
                    href={investment.creatorMouUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 block"
                  >
                    View Creator's MOU
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-500">Creator's MOU not uploaded yet</p>
                  {isCreator && investment.dealStatus === 'confirmed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Your Signed MOU
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => e.target.files?.[0] && handleMouUpload(e.target.files[0])}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary file:text-white
                          hover:file:bg-primary/90
                          disabled:opacity-50"
                      />
                      {uploading && (
                        <p className="mt-2 text-sm text-gray-500">Uploading...</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Investor's MOU */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Investor's MOU</h4>
              {investment.investorMouUrl ? (
                <div className="space-y-2">
                  <a
                    href={investment.investorMouUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 block"
                  >
                    View Investor's MOU
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-500">Investor's MOU not uploaded yet</p>
                  {!isCreator && investment.dealStatus === 'confirmed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Your Signed MOU
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => e.target.files?.[0] && handleMouUpload(e.target.files[0])}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary file:text-white
                          hover:file:bg-primary/90
                          disabled:opacity-50"
                      />
                      {uploading && (
                        <p className="mt-2 text-sm text-gray-500">Uploading...</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Accept Investment Button (Creator only) */}
        {isCreator && 
         investment.status === 'pending' && 
         investment.callStatus === 'successful' && 
         investment.dealStatus === 'confirmed' && 
         investment.creatorMouUrl && 
         investment.investorMouUrl && (
          <button
            onClick={() => {
              updateInvestment(investment.id, { status: 'completed' })
              onUpdate?.()
            }}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
          >
            Accept Investment
          </button>
        )}
      </div>
    </div>
  )
} 