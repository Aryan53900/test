import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: "ideanest-47ee0.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const storage = getStorage(app)
const db = getFirestore(app)

export { auth, storage, db }

// Profile Management Functions
export async function saveProfile(userId: string, userType: 'investor' | 'creator', profileData: any) {
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