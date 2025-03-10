'use client'

import React, { useState } from 'react'
import { Project } from '@/types/project'
import { createInvestment, updateInvestment } from '@/lib/firestore'
import { auth } from '@/lib/firebase'

interface InvestmentFlowProps {
  project: Project
  onClose: () => void
}

type Step = 'initial' | 'calendly' | 'call_status' | 'deal_status' | 'mou_upload' | 'confirmation'

export default function InvestmentFlow({ project, onClose }: InvestmentFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('initial')
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [calendlyLink, setCalendlyLink] = useState('')
  const [callStatus, setCallStatus] = useState<'successful' | 'scheduled' | null>(null)
  const [dealStatus, setDealStatus] = useState<'confirmed' | 'thinking' | null>(null)
  const [mouFile, setMouFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [investmentId, setInvestmentId] = useState<string | null>(null)

  const handleInvest = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated')
      }

      const amount = parseFloat(investmentAmount)
      if (isNaN(amount) || amount <= 0 || amount > project.fundingAmount) {
        throw new Error(`Please enter a valid amount between 0 and ${project.fundingAmount} EDU`)
      }

      // Create investment record
      const investment = {
        projectId: project.id,
        investorId: auth.currentUser.uid,
        amount,
        status: 'pending' as const,
        calendlyLink: '',
        callStatus: null,
        dealStatus: null,
        mouUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const id = await createInvestment(investment)
      setInvestmentId(id)
      setCurrentStep('calendly')
    } catch (error) {
      console.error('Error investing:', error)
      setError(error instanceof Error ? error.message : 'Failed to process investment')
    }
  }

  const handleCalendlySubmit = async () => {
    try {
      if (!calendlyLink) {
        throw new Error('Please enter your Calendly link')
      }

      if (!investmentId) {
        throw new Error('Investment ID not found')
      }

      // Update the investment with the Calendly link
      await updateInvestment(investmentId, {
        calendlyLink
      })

      setCurrentStep('call_status')
    } catch (error) {
      console.error('Error submitting Calendly link:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit Calendly link')
    }
  }

  const handleCallStatus = async (status: 'successful' | 'scheduled') => {
    try {
      if (!investmentId) {
        throw new Error('Investment ID not found')
      }

      await updateInvestment(investmentId, {
        callStatus: status
      })

      setCallStatus(status)
      setCurrentStep('deal_status')
    } catch (error) {
      console.error('Error updating call status:', error)
      setError(error instanceof Error ? error.message : 'Failed to update call status')
    }
  }

  const handleDealStatus = async (status: 'confirmed' | 'thinking') => {
    try {
      if (!investmentId) {
        throw new Error('Investment ID not found')
      }

      await updateInvestment(investmentId, {
        dealStatus: status
      })

      setDealStatus(status)
      if (status === 'confirmed') {
        setCurrentStep('mou_upload')
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Error updating deal status:', error)
      setError(error instanceof Error ? error.message : 'Failed to update deal status')
    }
  }

  const handleMouUpload = async (file: File) => {
    try {
      if (!investmentId) {
        throw new Error('Investment ID not found')
      }

      // Here we'll add MOU upload logic later
      // For now, we'll just update the status
      await updateInvestment(investmentId, {
        mouUrl: 'pending' // This will be replaced with actual URL after file upload
      })

      setMouFile(file)
      setCurrentStep('confirmation')
    } catch (error) {
      console.error('Error uploading MOU:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload MOU')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Investment Flow</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between">
            {['Initial', 'Calendly', 'Call', 'Deal', 'MOU', 'Confirm'].map((step, index) => (
              <div
                key={step}
                className={`flex items-center ${
                  index < ['initial', 'calendly', 'call_status', 'deal_status', 'mou_upload', 'confirmation'].indexOf(currentStep)
                    ? 'text-primary'
                    : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  index < ['initial', 'calendly', 'call_status', 'deal_status', 'mou_upload', 'confirmation'].indexOf(currentStep)
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300'
                }`}>
                  {index + 1}
                </div>
                {index < 5 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    index < ['initial', 'calendly', 'call_status', 'deal_status', 'mou_upload', 'confirmation'].indexOf(currentStep)
                      ? 'bg-primary'
                      : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 'initial' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Enter Investment Amount</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount (EDU)
                </label>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="0.00"
                  min="0"
                  max={project.fundingAmount}
                  step="0.01"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Maximum: {project.fundingAmount} EDU
                </p>
              </div>
              <button
                onClick={handleInvest}
                disabled={!investmentAmount || parseFloat(investmentAmount) <= 0}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Invest Now
              </button>
            </div>
          )}

          {currentStep === 'calendly' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Add Your Calendly Link</h3>
              <p className="text-gray-600">
                Please provide your Calendly link so the creator can schedule a call with you.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Calendly Link
                </label>
                <input
                  type="url"
                  value={calendlyLink}
                  onChange={(e) => setCalendlyLink(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="https://calendly.com/your-link"
                />
              </div>
              <button
                onClick={handleCalendlySubmit}
                disabled={!calendlyLink}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Submit Calendly Link
              </button>
            </div>
          )}

          {currentStep === 'call_status' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Call Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleCallStatus('successful')}
                  className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
                >
                  Call was Successful
                </button>
                <button
                  onClick={() => handleCallStatus('scheduled')}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                >
                  Schedule for Later
                </button>
              </div>
            </div>
          )}

          {currentStep === 'deal_status' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Deal Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleDealStatus('confirmed')}
                  className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
                >
                  Deal Confirmed
                </button>
                <button
                  onClick={() => handleDealStatus('thinking')}
                  className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600"
                >
                  Thinking for Later
                </button>
              </div>
            </div>
          )}

          {currentStep === 'mou_upload' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Upload MOU</h3>
              <p className="text-gray-600">
                Please upload the signed Memorandum of Understanding (MOU).
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => e.target.files?.[0] && handleMouUpload(e.target.files[0])}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary/90"
              />
            </div>
          )}

          {currentStep === 'confirmation' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Investment Confirmed</h3>
              <p className="text-gray-600">
                Your investment has been confirmed! The tokens will be released once both parties have uploaded matching MOU documents.
              </p>
              <button
                onClick={onClose}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 