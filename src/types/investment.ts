export interface Investment {
  id: string
  projectId: string
  investorId: string
  amount: number
  status: 'pending' | 'completed' | 'cancelled'
  calendlyLink?: string
  callStatus?: 'successful' | 'scheduled'
  dealStatus?: 'confirmed' | 'thinking'
  creatorMouUrl?: string
  investorMouUrl?: string
  createdAt: string
  updatedAt: string
} 