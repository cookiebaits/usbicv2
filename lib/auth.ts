import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  exp: number
  userId: string
}

export function useAuth() {
  const router = useRouter()
  const INACTIVITY_TIMEOUT = 3 * 60 * 1000
  // const INACTIVITY_TIMEOUT = 60 * 60 * 1000

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const decoded: DecodedToken = jwtDecode(token)
      const expirationTime = decoded.exp * 1000
      const currentTime = Date.now()

      if (currentTime >= expirationTime) {
        logout()
        return
      }

      // Token expiration timeout
      const tokenTimeout = setTimeout(() => {
        logout()
      }, expirationTime - currentTime)

      // Inactivity timeout setup
      let inactivityTimer: NodeJS.Timeout | null = null

      const resetInactivityTimer = () => {
        if (inactivityTimer) {
          clearTimeout(inactivityTimer)
        }
        inactivityTimer = setTimeout(() => {
          logout()
        }, INACTIVITY_TIMEOUT)
      }

      // Handle user activity
      const handleUserActivity = () => {
        resetInactivityTimer()
      }

      // List of events to monitor for activity
      const events = [
        'mousemove',
        'keydown',
        'click',
        'scroll',
        'touchstart',
        'touchmove'
      ]

      // Add event listeners
      events.forEach((event) => {
        window.addEventListener(event, handleUserActivity)
      })

      // Initialize the inactivity timer
      resetInactivityTimer()

      // Cleanup function
      return () => {
        clearTimeout(tokenTimeout)
        if (inactivityTimer) {
          clearTimeout(inactivityTimer)
        }
        events.forEach((event) => {
          window.removeEventListener(event, handleUserActivity)
        })
      }
    } catch (error) {
      console.error('Invalid token:', error)
      logout()
    }
  }, [router])
}

export function logout() {
  localStorage.removeItem('token')
  window.location.href = '/login' // Immediate redirect
}