import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Configure storage
const storageInstance = getStorage(app)
storageInstance.maxOperationRetryTime = 10000 // 10 seconds max retry time
storageInstance.maxUploadRetryTime = 10000 // 10 seconds max upload retry time

// Profile Management Functions
export async function saveProfile(userId: string, userType: 'investor' | 'creator', profileData: Record<string, any>) {
  try {
    const profileRef = doc(db, `${userType}s`, userId)
    await setDoc(profileRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    }, { merge: true })
    return true
  } catch (error) {
    console.error('Error saving profile:', error)
    throw error
  }
}

export async function getProfile(userId: string, userType: 'investor' | 'creator') {
  try {
    const profileRef = doc(db, `${userType}s`, userId)
    const profileDoc = await getDoc(profileRef)
    return profileDoc.exists() ? profileDoc.data() : null
  } catch (error) {
    console.error('Error getting profile:', error)
    throw error
  }
}

export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  if (!auth.currentUser) {
    throw new Error('Authentication required')
  }

  try {
    const storageRef = ref(storage, `profile-photos/${userId}/${file.name}`)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    throw error
  }
}

export async function uploadMOU(file: File, investmentId: string, isCreator: boolean): Promise<string> {
  if (!auth.currentUser) {
    throw new Error('Authentication required')
  }

  try {
    // Create a unique filename
    const timestamp = Date.now()
    const userType = isCreator ? 'creator' : 'investor'
    const filename = `${investmentId}_${userType}_${timestamp}.pdf`
    
    // Create storage reference
    const storageRef = ref(storage, `mou/${filename}`)
    
    // Upload file with minimal metadata to avoid CORS preflight
    const metadata = {
      contentType: 'application/pdf',
    }
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file, metadata)
    console.log('Upload successful:', snapshot)
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref)
    console.log('Download URL:', downloadURL)
    
    return downloadURL
  } catch (error) {
    console.error('Detailed upload error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      investmentId,
      isCreator,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })
    throw new Error('Failed to upload MOU. Please try again.')
  }
} 