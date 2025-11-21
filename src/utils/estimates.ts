import {
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore'
import { db } from './firebase'

export interface IssueEstimate {
  issueId: string
  hours: number
}

/**
 * Save estimates for a user
 */
export const saveEstimates = async (
  userId: string,
  estimates: Record<string, number>
) => {
  try {
    console.log('Saving estimates for user:', userId, estimates)
    const estimatesRef = doc(db, 'user_estimates', userId)
    await setDoc(estimatesRef, { estimates }, { merge: true })
    console.log('Estimates saved successfully')
  } catch (error) {
    console.error('Error saving estimates:', error)
  }
}

/**
 * Load estimates for a user
 */
export const loadEstimates = async (
  userId: string
): Promise<Record<string, number>> => {
  try {
    console.log('Loading estimates for user:', userId)
    const estimatesRef = doc(db, 'user_estimates', userId)
    const snapshot = await getDoc(estimatesRef)

    if (snapshot.exists()) {
      const data = snapshot.data().estimates || {}
      console.log('Estimates loaded:', data)
      return data
    }

    console.log('No estimates found, returning empty object')
    return {}
  } catch (error) {
    console.error('Error loading estimates:', error)
    return {}
  }
}
