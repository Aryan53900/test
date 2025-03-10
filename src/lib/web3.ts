// Add TypeScript declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, callback: (params: any) => void) => void;
      removeListener: (eventName: string, callback: (params: any) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

import { ethers } from 'ethers'

const CONTRACT_ADDRESS = '0xcB693B3Fe7FB2C44921B3D43779f8040B2f53AbD'

const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "investmentId",
        "type": "uint256"
      }
    ],
    "name": "CallScheduled",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_investmentId",
        "type": "uint256"
      }
    ],
    "name": "confirmDeal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_creator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "invest",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
]

export class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null
  private contract: ethers.Contract | null = null

  async initialize() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Please install MetaMask to use this feature')
    }

    this.provider = new ethers.providers.Web3Provider(window.ethereum)
    await this.provider.send('eth_requestAccounts', [])
    
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      this.provider.getSigner()
    )
  }

  async invest(creatorAddress: string, amount: string) {
    if (!this.contract) await this.initialize()
    
    try {
      // Validate amount
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new Error('Invalid investment amount')
      }

      // Convert amount to Wei (1 EDU = 10^18 Wei)
      const amountInWei = ethers.utils.parseEther(amount)
      
      const tx = await this.contract!.invest(creatorAddress, amountInWei, {
        value: amountInWei
      })
      await tx.wait()
      return tx.hash
    } catch (error) {
      console.error('Error investing:', error)
      throw new Error('Failed to invest. Please try again.')
    }
  }

  // Helper function to format amount safely
  static formatAmount(amount: string | number): string {
    try {
      if (!amount) return '0'
      const numAmount = typeof amount === 'string' ? Number(amount) : amount
      if (isNaN(numAmount) || numAmount <= 0) return '0'
      
      // Convert to Wei first (1 EDU = 10^18 Wei)
      const amountInWei = ethers.utils.parseEther(numAmount.toString())
      // Then format back to EDU
      return ethers.utils.formatEther(amountInWei)
    } catch (error) {
      console.error('Error formatting amount:', error)
      return '0'
    }
  }

  async confirmDeal(investmentId: number) {
    if (!this.contract) await this.initialize()
    
    try {
      const tx = await this.contract!.confirmDeal(investmentId)
      await tx.wait()
      return tx.hash
    } catch (error) {
      console.error('Error confirming deal:', error)
      throw new Error('Failed to confirm deal. Please try again.')
    }
  }
}

export const web3Service = new Web3Service()

export async function connectMetaMask(): Promise<string> {
  console.log('Checking for MetaMask...')
  
  // Check if MetaMask is installed
  if (typeof window === 'undefined') {
    throw new Error('Please install MetaMask to continue')
  }

  if (!window.ethereum) {
    throw new Error('Please install MetaMask to continue')
  }

  if (!window.ethereum.isMetaMask) {
    throw new Error('Please install MetaMask to continue')
  }

  try {
    console.log('Requesting account access...')
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts'
    })
    
    console.log('Accounts received:', accounts)
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found')
    }
    
    return accounts[0]
  } catch (error) {
    console.error('Detailed MetaMask connection error:', error)
    
    // Handle specific MetaMask errors
    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        throw new Error('Please approve the connection request in MetaMask')
      } else if (error.message.includes('Already processing')) {
        throw new Error('Please check MetaMask popup and complete any pending requests')
      }
    }
    
    throw new Error('Failed to connect to MetaMask. Please make sure MetaMask is installed and try again.')
  }
}

// Function to check if MetaMask is installed
export function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return !!window.ethereum?.isMetaMask
}

// Function to get current connected account
export async function getCurrentAccount(): Promise<string | null> {
  if (!window.ethereum) return null
  
  try {
    const accounts = await window.ethereum.request({ 
      method: 'eth_accounts'
    })
    return accounts?.[0] || null
  } catch (error) {
    console.error('Error getting current account:', error)
    return null
  }
}

// Function to listen for account changes
export function listenToAccountChanges(callback: (account: string | null) => void) {
  if (!window.ethereum) return

  const handleAccountsChanged = (accounts: string[]) => {
    callback(accounts?.[0] || null)
  }

  window.ethereum.on('accountsChanged', handleAccountsChanged)

  return () => {
    window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
  }
} 