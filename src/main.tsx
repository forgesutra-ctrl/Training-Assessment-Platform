import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'

// Suppress AbortError from unhandled promise rejections
// These are expected when requests are cancelled during navigation/unmount
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError' || 
      event.reason?.message?.includes('aborted') ||
      event.reason?.message?.includes('signal is aborted')) {
    event.preventDefault() // Suppress the error
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
