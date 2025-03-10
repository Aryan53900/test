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