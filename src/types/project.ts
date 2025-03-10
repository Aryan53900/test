export interface Project {
  id: string
  creatorId: string
  creatorWalletAddress: string // Ethereum wallet address to receive funding
  name: string
  description: string
  imageUrl: string
  githubLink?: string
  fundingAmount: number // in eduTokens
  equityOffered: number // percentage
  createdAt: string
  updatedAt: string
  status: 'draft' | 'active' | 'funded' | 'closed'
  // Investment-related fields
  investedAmount?: number
  investedAt?: string
  investorId?: string
  investorWalletAddress?: string
  // Calendly integration
  creatorCalendlyLink?: string
  investorCalendlyLink?: string
  callScheduled?: boolean
  callDate?: string
  // Deal status
  dealStatus?: 'pending' | 'confirmed' | 'thinking' | 'rejected'
  // MOU management
  creatorMouHash?: string // IPFS hash of creator's MOU
  investorMouHash?: string // IPFS hash of investor's MOU
  mouStatus?: 'pending' | 'matched' | 'mismatched'
  // Smart contract
  contractAddress?: string
  contractStatus?: 'pending' | 'active' | 'completed' | 'cancelled'
}