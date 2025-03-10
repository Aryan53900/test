import { db } from './firebase'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore'
import { Project } from '@/types/project'

const PROJECTS_COLLECTION = 'projects'

export async function saveProject(project: Omit<Project, 'id'>): Promise<string> {
  try {
    console.log('Starting to save project to Firestore:', {
      projectData: project,
      collection: PROJECTS_COLLECTION
    })

    // Verify the project data
    if (!project.creatorId) {
      throw new Error('Project must have a creatorId')
    }

    if (!project.name || !project.description) {
      throw new Error('Project must have a name and description')
    }

    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), project)
    console.log('Project saved successfully to Firestore:', {
      projectId: docRef.id,
      collection: PROJECTS_COLLECTION
    })
    return docRef.id
  } catch (error) {
    console.error('Detailed error saving project to Firestore:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      projectData: project,
      collection: PROJECTS_COLLECTION
    })
    throw error
  }
}

export async function getProjects(): Promise<Project[]> {
  try {
    const querySnapshot = await getDocs(collection(db, PROJECTS_COLLECTION))
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project))
  } catch (error) {
    console.error('Error getting projects from Firestore:', error)
    return []
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Project
    }
    return null
  } catch (error) {
    console.error('Error getting project by id from Firestore:', error)
    return null
  }
}

export async function updateProject(id: string, updatedProject: Partial<Project>): Promise<void> {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, id)
    await updateDoc(docRef, updatedProject)
  } catch (error) {
    console.error('Error updating project in Firestore:', error)
    throw error
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting project from Firestore:', error)
    throw error
  }
}

export async function getActiveProjects(): Promise<Project[]> {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('status', '==', 'active')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project))
  } catch (error) {
    console.error('Error getting active projects from Firestore:', error)
    return []
  }
}

export async function getCreatorProjects(creatorId: string): Promise<Project[]> {
  try {
    console.log('Fetching projects for creator:', creatorId)
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('creatorId', '==', creatorId)
    )
    const querySnapshot = await getDocs(q)
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project))
    console.log('Retrieved projects from Firestore:', projects)
    return projects
  } catch (error) {
    console.error('Error getting creator projects from Firestore:', error)
    return []
  }
}

// Investment Functions
export interface Investment {
  id: string
  projectId: string
  investorId: string
  amount: number
  status: 'pending' | 'completed' | 'cancelled'
  calendlyLink?: string
  callStatus?: 'successful' | 'scheduled'
  dealStatus?: 'confirmed' | 'thinking'
  mouUrl?: string
  createdAt: string
  updatedAt: string
}

const INVESTMENTS_COLLECTION = 'investments'

export async function createInvestment(investment: Omit<Investment, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, INVESTMENTS_COLLECTION), investment)
    return docRef.id
  } catch (error) {
    console.error('Error creating investment:', error)
    throw error
  }
}

export async function getProjectInvestments(creatorId: string): Promise<(Investment & { project: Project })[]> {
  try {
    // First get all projects for the creator
    const projects = await getCreatorProjects(creatorId)
    const projectIds = projects.map(p => p.id)

    // Then get all investments for these projects
    const investmentsRef = collection(db, 'investments')
    const q = query(investmentsRef, where('projectId', 'in', projectIds))
    const querySnapshot = await getDocs(q)
    
    const investments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Investment))

    // Combine investments with their project data
    return investments.map(investment => ({
      ...investment,
      project: projects.find(p => p.id === investment.projectId)!
    }))
  } catch (error) {
    console.error('Error fetching investments:', error)
    throw error
  }
}

export async function getInvestorInvestments(investorId: string): Promise<Investment[]> {
  try {
    const q = query(
      collection(db, INVESTMENTS_COLLECTION),
      where('investorId', '==', investorId)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Investment))
  } catch (error) {
    console.error('Error getting investor investments:', error)
    return []
  }
}

export async function updateInvestmentStatus(id: string, status: Investment['status']): Promise<void> {
  try {
    const docRef = doc(db, INVESTMENTS_COLLECTION, id)
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating investment status:', error)
    throw error
  }
}

export async function getInvestmentsByInvestorId(investorId: string): Promise<Investment[]> {
  try {
    const investmentsRef = collection(db, 'investments')
    const q = query(investmentsRef, where('investorId', '==', investorId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Investment))
  } catch (error) {
    console.error('Error fetching investments:', error)
    throw error
  }
}

export async function updateInvestment(
  id: string,
  updates: Partial<Investment>
): Promise<void> {
  try {
    const docRef = doc(db, INVESTMENTS_COLLECTION, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating investment:', error)
    throw error
  }
} 