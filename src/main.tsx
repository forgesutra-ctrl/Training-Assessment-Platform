import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'

// Suppress expected errors from unhandled promise rejections
// These are expected when requests are cancelled during navigation/unmount
// or when refresh tokens are missing (common for new users)
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  
  // Suppress AbortError (cancelled requests)
  if (reason?.name === 'AbortError' || 
      reason?.message?.includes('aborted') ||
      reason?.message?.includes('signal is aborted')) {
    event.preventDefault()
    return
  }
  
  // Suppress refresh token errors (expected for new users or cleared storage)
  if (reason?.message?.includes('Refresh Token') ||
      reason?.message?.includes('refresh_token') ||
      reason?.message?.includes('Invalid Refresh Token') ||
      reason?.message?.includes('Token Not Found')) {
    event.preventDefault()
    // Clear stale auth data when token errors occur (use sessionStorage)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i)
          if (key && (key.startsWith('sb-') || key.startsWith('supabase.'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => window.sessionStorage.removeItem(key))
        console.log('🧹 Cleared stale auth tokens from sessionStorage')
      } catch (e) {
        // Ignore sessionStorage errors
      }
    }
    return
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#4f46e5',
            secondary: '#fff',
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
    </ErrorBoundary>
  </React.StrictMode>,
)
