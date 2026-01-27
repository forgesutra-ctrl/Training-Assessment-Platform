import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import OnboardingTour from './components/OnboardingTour'
import EasterEggHandler from './components/EasterEggHandler'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ManagerDashboard from './pages/ManagerDashboard'
import TrainerDashboard from './pages/TrainerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ExecutiveDashboard from './pages/ExecutiveDashboard'
import AssessmentForm from './components/AssessmentForm'
import Settings from './pages/Settings'

function App() {
  return (
    <AuthProvider>
      <OnboardingTour />
      <EasterEggHandler />
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected routes with role-based access */}
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/assessment/new"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <AssessmentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['trainer']}>
                <TrainerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/executive/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExecutiveDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'trainer']}>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Legacy routes - redirect to new dashboard routes */}
          <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="/trainer" element={<Navigate to="/trainer/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
