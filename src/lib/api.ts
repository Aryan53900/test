import { auth, storage, db } from './firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, getDocs, doc, updateDoc, query, where } from 'firebase/firestore'
import { Investment } from '@/types/investment'
import { updateInvestment } from './firestore'

// MOU Upload API
export async function uploadMOUFile(file: File, investmentId: string, isCreator: boolean): Promise<string> {
  if (!auth.currentUser) {
    throw new Error('Authentication required')
  }

  try {
    // Create a reference to the file in Firebase Storage
    const timestamp = Date.now()
    const userType = isCreator ? 'creator' : 'investor'
    const fileName = `${investmentId}_${userType}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const storageRef = ref(storage, `mous/${investmentId}/${fileName}`)

    // Set metadata
    const metadata = {
      contentType: 'application/pdf',
      customMetadata: {
        uploadedBy: auth.currentUser.uid,
        userType: userType,
        originalName: file.name
      }
    }

    // Upload the file with metadata and content type
    const snapshot = await uploadBytes(storageRef, file, metadata)
    console.log('Upload successful:', {
      fileName,
      path: snapshot.ref.fullPath,
      size: snapshot.metadata.size
    })

    // Get the download URL with retry logic
    let downloadURL = null
    let retries = 3
    while (retries > 0 && !downloadURL) {
      try {
        downloadURL = await getDownloadURL(snapshot.ref)
        break
      } catch (error) {
        console.error(`Failed to get download URL. Retries left: ${retries - 1}`, error)
        retries--
        if (retries === 0) throw error
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    if (!downloadURL) {
      throw new Error('Failed to get download URL after multiple attempts')
    }

    return downloadURL
  } catch (error) {
    console.error('Error uploading MOU:', {
      error,
      investmentId,
      isCreator,
      fileName: file.name
    })
    throw new Error(
      error instanceof Error 
        ? `Failed to upload MOU: ${error.message}`
        : 'Failed to upload MOU'
    )
  }
}

// Investment APIs
export async function createInvestment(investment: Omit<Investment, 'id'>): Promise<string> {
  if (!auth.currentUser) {
    throw new Error('Authentication required')
  }

  try {
    const docRef = await addDoc(collection(db, 'investments'), {
      ...investment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating investment:', error)
    throw new Error('Failed to create investment')
  }
}

export async function updateInvestmentStatus(
  investmentId: string, 
  updates: Partial<Investment>
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Authentication required')
  }

  try {
    const docRef = doc(db, 'investments', investmentId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating investment:', error)
    throw new Error('Failed to update investment')
  }
}

export async function getInvestmentsByUser(userId: string, isCreator: boolean): Promise<Investment[]> {
  if (!auth.currentUser) {
    throw new Error('Authentication required')
  }

  try {
    const q = query(
      collection(db, 'investments'),
      where(isCreator ? 'creatorId' : 'investorId', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Investment))
  } catch (error) {
    console.error('Error getting investments:', error)
    throw new Error('Failed to fetch investments')
  }
}

// MOU Status APIs
export async function updateMOUStatus(
  investmentId: string,
  isCreator: boolean,
  mouUrl: string
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Authentication required')
  }

  try {
    const updates: Partial<Investment> = {
      updatedAt: new Date().toISOString()
    }
    
    if (isCreator) {
      updates.creatorMouUrl = mouUrl
    } else {
      updates.investorMouUrl = mouUrl
    }

    const docRef = doc(db, 'investments', investmentId)
    await updateDoc(docRef, updates)
  } catch (error) {
    console.error('Error updating MOU status:', error)
    throw new Error('Failed to update MOU status')
  }
}

// Call Status APIs
export async function updateCallStatus(
  investmentId: string, 
  status: 'successful' | 'scheduled'
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Authentication required')
  }

  try {
    await updateInvestmentStatus(investmentId, { callStatus: status })
  } catch (error) {
    console.error('Error updating call status:', error)
    throw new Error('Failed to update call status')
  }
}

// Deal Status APIs
export async function updateDealStatus(
  investmentId: string, 
  status: 'confirmed' | 'thinking'
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Authentication required')
  }

  try {
    await updateInvestmentStatus(investmentId, { dealStatus: status })
  } catch (error) {
    console.error('Error updating deal status:', error)
    throw new Error('Failed to update deal status')
  }
} 