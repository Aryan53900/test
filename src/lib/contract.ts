import { ethers } from 'ethers'
import { IdeaNestInvestment, IdeaNestInvestmentContract, CONTRACT_ABI } from '@/contracts/IdeaNestInvestment'

const CONTRACT_ADDRESS = '0xcB693B3Fe7FB2C44921B3D43779f8040B2f53AbD'
const REQUIRED_NETWORK = {
  name: 'OpenCampus CodeX Sepolia',
  chainId: 11155111,
  rpcUrl: 'https://rpc.codex.opencampus.sh',
  blockExplorer: 'https://explorer.codex.opencampus.sh'
}

export class ContractService {
  private contract: IdeaNestInvestment
  private provider: ethers.BrowserProvider
  private signer: ethers.JsonRpcSigner | null = null
  private contractInstance: IdeaNestInvestmentContract | null = null
  private ethereum: any

  constructor() {
    console.log('Initializing ContractService...')
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log('Ethereum provider found')
      this.ethereum = window.ethereum
      this.provider = new ethers.BrowserProvider(window.ethereum)
      this.contract = new IdeaNestInvestment(CONTRACT_ADDRESS, this.provider)
      console.log('Contract instance created with address:', CONTRACT_ADDRESS)
    } else {
      console.error('Ethereum provider not found')
      throw new Error('Ethereum provider not found')
    }
  }

  async connect() {
    try {
      console.log('Starting connection process...')
      
      // Check if MetaMask is installed
      if (!this.ethereum) {
        console.error('MetaMask is not installed')
        throw new Error('MetaMask is not installed')
      }

      // Request account access
      console.log('Requesting account access...')
      const accounts = await this.ethereum.request({ method: 'eth_requestAccounts' })
      console.log('Accounts received:', accounts)

      // Request network switch to CodeX Sepolia
      console.log('Requesting network switch...')
      try {
        await this.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${REQUIRED_NETWORK.chainId.toString(16)}` }],
        })
        console.log('Network switch successful')
      } catch (switchError: any) {
        console.log('Network switch error:', switchError)
        // If the chain is not added to MetaMask, add it
        if (switchError.code === 4902) {
          console.log('Adding network to MetaMask...')
          await this.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${REQUIRED_NETWORK.chainId.toString(16)}`,
              chainName: REQUIRED_NETWORK.name,
              rpcUrls: [REQUIRED_NETWORK.rpcUrl],
              blockExplorerUrls: [REQUIRED_NETWORK.blockExplorer],
              nativeCurrency: {
                name: 'EDU',
                symbol: 'EDU',
                decimals: 18
              }
            }]
          })
          console.log('Network added successfully')
        } else {
          console.error('Network switch failed:', switchError)
          throw switchError
        }
      }

      // Get the current network
      console.log('Getting current network...')
      const network = await this.provider.getNetwork()
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId)

      // Get the signer
      console.log('Getting signer...')
      this.signer = await this.provider.getSigner()
      console.log('Signer obtained')

      // Connect contract instance
      console.log('Connecting contract instance...')
      this.contractInstance = this.contract.connect(this.signer)
      console.log('Contract instance connected')

      // Verify contract exists
      console.log('Verifying contract at address:', CONTRACT_ADDRESS)
      const code = await this.provider.getCode(CONTRACT_ADDRESS)
      console.log('Contract code:', code)
      
      if (code === '0x') {
        console.error('Contract not found at address')
        throw new Error(`Contract not found at address ${CONTRACT_ADDRESS} on network ${network.name} (${network.chainId})`)
      }

      // Try to get the contract's ABI
      console.log('Verifying contract ABI...')
      try {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider)
        await contract.investmentCounter()
        console.log('Contract ABI verified successfully')
      } catch (error) {
        console.error('Error verifying contract ABI:', error)
        throw new Error('Contract ABI verification failed')
      }

      console.log('Connection process completed successfully')
      return true
    } catch (error) {
      console.error('Detailed connection error:', error)
      return false
    }
  }

  async invest(creatorAddress: string, amount: string) {
    try {
      if (!this.signer || !this.contractInstance) throw new Error('Wallet not connected')
      
      // Get the current network
      const network = await this.provider.getNetwork()
      console.log('Initiating investment on network:', network.name, 'Chain ID:', network.chainId)

      // Get the current account
      const accounts = await this.ethereum.request({ method: 'eth_accounts' })
      console.log('Connected accounts:', accounts)

      console.log('Initiating investment:', {
        creatorAddress,
        amount,
        contractAddress: CONTRACT_ADDRESS,
        network: network.name,
        chainId: network.chainId,
        signerAddress: accounts[0]
      })

      // Convert amount to Wei
      const amountInWei = ethers.parseEther(amount)
      
      // Get the signer's address
      const signerAddress = await this.signer.getAddress()
      console.log('Signer address:', signerAddress)

      // Verify contract exists
      console.log('Verifying contract at address:', CONTRACT_ADDRESS)
      const code = await this.provider.getCode(CONTRACT_ADDRESS)
      console.log('Contract code:', code)
      
      if (code === '0x') {
        throw new Error(`Contract not found at address ${CONTRACT_ADDRESS} on network ${network.name} (${network.chainId})`)
      }

      // Prepare the transaction
      console.log('Preparing transaction with params:', {
        creatorAddress,
        value: amountInWei.toString(),
        from: signerAddress
      })

      const tx = await this.contractInstance.invest(creatorAddress, {
        value: amountInWei,
        from: signerAddress
      })
      
      console.log('Transaction sent:', tx.hash)
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      if (!receipt) throw new Error('Transaction receipt not found')
      
      console.log('Transaction confirmed:', receipt.hash)

      // Find the Invested event
      const event = receipt.logs.find((log: any) => 
        log.eventName === 'Invested' || 
        (log.topics && log.topics[0] === ethers.id('Invested(uint256,address,address,uint256)'))
      )

      if (!event) {
        throw new Error('Investment event not found in transaction receipt')
      }

      console.log('Investment event found:', event)
      
      // Parse the event data
      const iface = new ethers.Interface(CONTRACT_ABI)
      const parsedEvent = iface.parseLog({
        topics: event.topics,
        data: event.data
      })

      if (!parsedEvent) {
        throw new Error('Failed to parse investment event')
      }

      // Get the investment ID from the parsed event
      const investmentId = parsedEvent.args[0]
      console.log('Investment ID:', investmentId)

      return Number(investmentId)
    } catch (error) {
      console.error('Detailed error during investment:', error)
      throw error
    }
  }

  async scheduleCall(investmentId: number) {
    try {
      if (!this.contractInstance) throw new Error('Wallet not connected')
      
      const tx = await this.contractInstance.scheduleCall(investmentId)
      await tx.wait()
      return true
    } catch (error) {
      console.error('Error scheduling call:', error)
      throw error
    }
  }

  async confirmDeal(investmentId: number) {
    try {
      if (!this.contractInstance) throw new Error('Wallet not connected')
      
      const tx = await this.contractInstance.confirmDeal(investmentId)
      await tx.wait()
      return true
    } catch (error) {
      console.error('Error confirming deal:', error)
      throw error
    }
  }

  async uploadMOU(investmentId: number, mouHash: string) {
    try {
      if (!this.contractInstance) throw new Error('Wallet not connected')
      
      const tx = await this.contractInstance.uploadMOU(investmentId, mouHash)
      await tx.wait()
      return true
    } catch (error) {
      console.error('Error uploading MOU:', error)
      throw error
    }
  }

  async releaseFunds(investmentId: number) {
    try {
      if (!this.contractInstance) throw new Error('Wallet not connected')
      
      const tx = await this.contractInstance.releaseFunds(investmentId)
      await tx.wait()
      return true
    } catch (error) {
      console.error('Error releasing funds:', error)
      throw error
    }
  }

  async getInvestment(investmentId: number) {
    try {
      if (!this.contractInstance) throw new Error('Wallet not connected')
      return await this.contractInstance.investments(investmentId)
    } catch (error) {
      console.error('Error getting investment:', error)
      throw error
    }
  }

  async getInvestmentCounter() {
    try {
      if (!this.contractInstance) throw new Error('Wallet not connected')
      return await this.contractInstance.investmentCounter()
    } catch (error) {
      console.error('Error getting investment counter:', error)
      throw error
    }
  }
} 