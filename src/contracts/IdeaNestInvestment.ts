import { ethers } from 'ethers'

export interface Investment {
  investor: string
  creator: string
  amount: bigint
  tokensLocked: boolean
  callScheduled: boolean
  dealConfirmed: boolean
  mouUploadedByInvestor: boolean
  mouUploadedByCreator: boolean
  investorMOUHash: string
  creatorMOUHash: string
}

export const CONTRACT_ABI = [
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
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "investmentId",
        "type": "uint256"
      }
    ],
    "name": "DealConfirmed",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_creator",
        "type": "address"
      }
    ],
    "name": "invest",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "investmentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "investor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Invested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "investmentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "uploader",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "mouHash",
        "type": "string"
      }
    ],
    "name": "MOUUploaded",
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
    "name": "releaseFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_investmentId",
        "type": "uint256"
      }
    ],
    "name": "scheduleCall",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "investmentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "TokensReleased",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_investmentId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "mouHash",
        "type": "string"
      }
    ],
    "name": "uploadMOU",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "investmentCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "investments",
    "outputs": [
      {
        "internalType": "address",
        "name": "investor",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "tokensLocked",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "callScheduled",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "dealConfirmed",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "mouUploadedByInvestor",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "mouUploadedByCreator",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "investorMOUHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "creatorMOUHash",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

export type IdeaNestInvestmentContract = ethers.Contract & {
  invest(creator: string, options?: ethers.Overrides): Promise<ethers.ContractTransactionResponse>
  scheduleCall(investmentId: number, options?: ethers.Overrides): Promise<ethers.ContractTransactionResponse>
  confirmDeal(investmentId: number, options?: ethers.Overrides): Promise<ethers.ContractTransactionResponse>
  uploadMOU(investmentId: number, mouHash: string, options?: ethers.Overrides): Promise<ethers.ContractTransactionResponse>
  releaseFunds(investmentId: number, options?: ethers.Overrides): Promise<ethers.ContractTransactionResponse>
  investmentCounter(): Promise<bigint>
  investments(investmentId: number): Promise<Investment>
}

export class IdeaNestInvestment {
  private contract: IdeaNestInvestmentContract

  constructor(address: string, provider: ethers.Provider) {
    this.contract = new ethers.Contract(address, CONTRACT_ABI, provider) as IdeaNestInvestmentContract
  }

  connect(signer: ethers.Signer): IdeaNestInvestmentContract {
    return this.contract.connect(signer) as IdeaNestInvestmentContract
  }

  getContract(): IdeaNestInvestmentContract {
    return this.contract
  }
} 