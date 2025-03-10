'use client'

import React, { useState } from 'react'
import { Investment } from '@/types/investment'
import { Project } from '@/types/project'
import { auth } from '@/lib/firebase'
import { 
  updateCallStatus, 
  updateDealStatus, 
  uploadMOUFile, 
  updateMOUStatus,
  updateInvestmentStatus 
} from '@/lib/api'
import { web3Service, Web3Service } from '@/lib/web3'
import Modal from './Modal'
import { ethers } from 'ethers'

interface InvestmentDetailsProps {
  investment: Investment & { project: Project }
  isCreator?: boolean
  onUpdate?: () => void
}

export default function InvestmentDetails({ investment, isCreator = false, onUpdate }: InvestmentDetailsProps) {
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isAcceptingDeal, setIsAcceptingDeal] = useState(false)

  const handleUpdateCallStatus = async (status: 'successful' | 'scheduled') => {
    try {
      await updateCallStatus(investment.id, status)
      onUpdate?.()
    } catch (error) {
      console.error('Error updating call status:', error)
      setError('Failed to update call status')
    }
  }

  const handleUpdateDealStatus = async (status: 'confirmed' | 'thinking') => {
    try {
      await updateDealStatus(investment.id, status)
      onUpdate?.()
    } catch (error) {
      console.error('Error updating deal status:', error)
      setError('Failed to update deal status')
    }
  }

  const handleAcceptDeal = async () => {
    try {
      setIsAcceptingDeal(true)
      setError('')

      // Call smart contract to confirm deal and lock funds
      await web3Service.confirmDeal(Number(investment.id))

      // Update investment status in Firestore
      await updateInvestmentStatus(investment.id, { 
        status: 'completed',
        updatedAt: new Date().toISOString()
      })

      onUpdate?.()
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Error accepting deal:', error)
      setError(error instanceof Error ? error.message : 'Failed to accept deal')
    } finally {
      setIsAcceptingDeal(false)
    }
  }

  const handleMouUpload = async (file: File) => {
    try {
      setUploading(true)
      setError('')

      // Validate file type
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed')
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB')
      }

      // Upload MOU with retry logic
      let downloadUrl = null
      let retries = 3
      while (retries > 0 && !downloadUrl) {
        try {
          downloadUrl = await uploadMOUFile(file, investment.id, isCreator)
          break
        } catch (uploadError) {
          console.error(`Upload attempt failed. Retries left: ${retries - 1}`, uploadError)
          retries--
          if (retries === 0) throw uploadError
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (!downloadUrl) {
        throw new Error('Failed to upload MOU after multiple attempts')
      }

      // Update investment record with MOU URL
      await updateMOUStatus(investment.id, isCreator, downloadUrl)

      onUpdate?.()
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload MOU')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
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
              <p className="text-lg font-semibold">
                {Web3Service.formatAmount(investment.amount)} EDU
              </p>
              <p className="text-sm text-gray-500">
                (Set by {isCreator ? 'you' : 'creator'})
              </p>
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
            <div className="flex flex-col gap-4">
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
              </div>
              {investment.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateCallStatus('scheduled')}
                    className={`flex-1 py-1 px-3 rounded-md text-sm ${
                      investment.callStatus === 'scheduled' 
                        ? 'bg-blue-100 text-blue-800 cursor-default'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    disabled={investment.callStatus === 'scheduled'}
                  >
                    Mark as Scheduled
                  </button>
                  <button
                    onClick={() => handleUpdateCallStatus('successful')}
                    className={`flex-1 py-1 px-3 rounded-md text-sm ${
                      investment.callStatus === 'successful'
                        ? 'bg-green-100 text-green-800 cursor-default'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    disabled={investment.callStatus === 'successful'}
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
            <div className="flex flex-col gap-4">
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
              </div>
              {investment.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateDealStatus('confirmed')}
                    className={`flex-1 py-1 px-3 rounded-md text-sm ${
                      investment.dealStatus === 'confirmed'
                        ? 'bg-green-100 text-green-800 cursor-default'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    disabled={investment.dealStatus === 'confirmed'}
                  >
                    Confirm Deal
                  </button>
                  <button
                    onClick={() => handleUpdateDealStatus('thinking')}
                    className={`flex-1 py-1 px-3 rounded-md text-sm ${
                      investment.dealStatus === 'thinking'
                        ? 'bg-yellow-100 text-yellow-800 cursor-default'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                    }`}
                    disabled={investment.dealStatus === 'thinking'}
                  >
                    Under Consideration
                  </button>
                </div>
              )}

              {/* Accept Deal Button */}
              {!isCreator && 
               investment.status === 'pending' && 
               investment.dealStatus === 'confirmed' && 
               investment.callStatus === 'successful' && (
                <button
                  onClick={handleAcceptDeal}
                  disabled={isAcceptingDeal}
                  className={`w-full mt-4 py-2 px-4 rounded-md text-white ${
                    isAcceptingDeal 
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isAcceptingDeal ? 'Processing...' : `Accept Deal & Lock ${Web3Service.formatAmount(investment.amount)} EDU`}
                </button>
              )}
            </div>
          </div>

          {/* MOU Upload Section */}
          {investment.dealStatus === 'confirmed' && investment.status === 'pending' && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">MOU Documents</h3>
              <div className="space-y-4">
                {/* Creator's MOU */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {isCreator ? 'Your MOU' : "Creator's MOU"}
                  </h4>
                  {investment.creatorMouUrl ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={investment.creatorMouUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 flex-1"
                      >
                        View Creator's MOU
                      </a>
                      <span className="text-green-600">✓ Uploaded</span>
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      {isCreator ? 'Upload your MOU below' : 'Creator has not uploaded their MOU yet'}
                    </p>
                  )}
                </div>

                {/* Investor's MOU */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {!isCreator ? 'Your MOU' : "Investor's MOU"}
                  </h4>
                  {investment.investorMouUrl ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={investment.investorMouUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 flex-1"
                      >
                        View Investor's MOU
                      </a>
                      <span className="text-green-600">✓ Uploaded</span>
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      {!isCreator ? 'Upload your MOU below' : 'Investor has not uploaded their MOU yet'}
                    </p>
                  )}
                </div>

                {/* Upload Section */}
                {((isCreator && !investment.creatorMouUrl) || (!isCreator && !investment.investorMouUrl)) && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Your Signed MOU (PDF only, max 5MB)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
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
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Success!</h3>
          <p className="text-sm text-gray-500 mb-4">
            {isAcceptingDeal 
              ? 'Deal accepted and investment locked successfully.'
              : 'Your MOU has been successfully uploaded.'}
          </p>
          <button
            onClick={() => setShowSuccessModal(false)}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  )
} 