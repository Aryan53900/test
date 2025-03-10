import { Project } from '@/types/project'

export interface ProfileData {
  name: string
  email: string
  githubLink: string
  linkedinLink: string
  contactNo: string
  calendlyLink: string
  photoUrl: string | null
  userType: 'investor' | 'creator'
  userId: string
  updatedAt: string
}

const PROFILE_KEY = 'user_profile'
const CREATOR_PROJECTS_KEY = 'creator_projects'
const INVESTOR_PROJECTS_KEY = 'investor_projects'

// Profile Functions
export function saveProfileToLocal(profileData: ProfileData): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData))
  } catch (error) {
    console.error('Error saving profile to local storage:', error)
  }
}

export function getProfileFromLocal(): ProfileData | null {
  try {
    const profileData = localStorage.getItem(PROFILE_KEY)
    return profileData ? JSON.parse(profileData) : null
  } catch (error) {
    console.error('Error getting profile from local storage:', error)
    return null
  }
}

export function clearProfileFromLocal(): void {
  try {
    localStorage.removeItem(PROFILE_KEY)
  } catch (error) {
    console.error('Error clearing profile from local storage:', error)
  }
}

export function isProfileComplete(): boolean {
  const profile = getProfileFromLocal()
  if (!profile) return false

  return !!(
    profile.name &&
    profile.email &&
    profile.githubLink &&
    profile.linkedinLink &&
    profile.contactNo &&
    profile.calendlyLink &&
    profile.photoUrl
  )
}

// Project Functions
export function saveProjectToLocal(project: Project): void {
  try {
    const projects = getProjectsFromLocal()
    console.log('Saving project to local storage:', {
      project,
      existingProjects: projects
    })
    const updatedProjects = [...projects, project]
    localStorage.setItem(CREATOR_PROJECTS_KEY, JSON.stringify(updatedProjects))
    console.log('Updated projects in storage:', updatedProjects)
  } catch (error) {
    console.error('Error saving project to local storage:', error)
  }
}

export function getProjectsFromLocal(): Project[] {
  try {
    const projects = localStorage.getItem(CREATOR_PROJECTS_KEY)
    const parsedProjects = projects ? JSON.parse(projects) : []
    console.log('Retrieved projects from storage:', parsedProjects)
    return parsedProjects
  } catch (error) {
    console.error('Error getting projects from local storage:', error)
    return []
  }
}

export function getProjectById(id: string): Project | null {
  try {
    const projects = getProjectsFromLocal()
    return projects.find(project => project.id === id) || null
  } catch (error) {
    console.error('Error getting project by id:', error)
    return null
  }
}

export function updateProjectInLocal(updatedProject: Project): void {
  try {
    const projects = getProjectsFromLocal()
    console.log('Updating project in local storage:', {
      updatedProject,
      existingProjects: projects
    })
    const updatedProjects = projects.map(project => 
      project.id === updatedProject.id ? updatedProject : project
    )
    localStorage.setItem(CREATOR_PROJECTS_KEY, JSON.stringify(updatedProjects))
    console.log('Updated projects in storage:', updatedProjects)
  } catch (error) {
    console.error('Error updating project in local storage:', error)
  }
}

export function deleteProjectFromLocal(id: string): void {
  try {
    const projects = getProjectsFromLocal()
    const updatedProjects = projects.filter(project => project.id !== id)
    localStorage.setItem(CREATOR_PROJECTS_KEY, JSON.stringify(updatedProjects))
  } catch (error) {
    console.error('Error deleting project from local storage:', error)
  }
}

// Investor-specific functions
export function getInvestorProjectsFromLocal(): Project[] {
  try {
    const projects = localStorage.getItem(INVESTOR_PROJECTS_KEY)
    const parsedProjects = projects ? JSON.parse(projects) : []
    console.log('Retrieved investor projects from storage:', parsedProjects)
    return parsedProjects
  } catch (error) {
    console.error('Error getting investor projects from local storage:', error)
    return []
  }
}

export function saveInvestorProjectToLocal(project: Project): void {
  try {
    const projects = getInvestorProjectsFromLocal()
    console.log('Saving investor project to local storage:', {
      project,
      existingProjects: projects
    })
    const updatedProjects = [...projects, project]
    localStorage.setItem(INVESTOR_PROJECTS_KEY, JSON.stringify(updatedProjects))
    console.log('Updated investor projects in storage:', updatedProjects)
  } catch (error) {
    console.error('Error saving investor project to local storage:', error)
  }
}

export function updateInvestorProjectInLocal(updatedProject: Project): void {
  try {
    const projects = getInvestorProjectsFromLocal()
    console.log('Updating investor project in local storage:', {
      updatedProject,
      existingProjects: projects
    })
    const updatedProjects = projects.map(project => 
      project.id === updatedProject.id ? updatedProject : project
    )
    localStorage.setItem(INVESTOR_PROJECTS_KEY, JSON.stringify(updatedProjects))
    console.log('Updated investor projects in storage:', updatedProjects)
  } catch (error) {
    console.error('Error updating investor project in local storage:', error)
  }
} 