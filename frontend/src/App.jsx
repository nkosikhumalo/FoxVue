// Root React app for the Dojo interview project.
// Uses React Router to handle login, setup, and interview views.

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { InterviewProvider } from './store/store'
import LoginPage from './Pages/LoginPage'
import Setup from './Pages/Setup'
import Interview from './Pages/Interview'
import History from './Pages/History'
import OAuthCallback from './Pages/OAuthCallback'
import ApiProviders from './Pages/ApiProviders'
import ResetPassword from './Pages/ResetPassword'
import VerifyEmail from './Pages/VerifyEmail'

const applicationPaths = new Set(['/setup', '/interview', '/history', '/api-providers'])

function RouteTheme() {
  const { pathname } = useLocation()

  useEffect(() => {
    const savedTheme = localStorage.getItem('foxvue_theme')
    const theme = applicationPaths.has(pathname) && (savedTheme === 'dark' || savedTheme === 'light')
      ? savedTheme
      : 'light'

    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [pathname])

  return null
}

function PrivateRoute({ children }) {
  const isLoggedIn = Boolean(
    sessionStorage.getItem('dojo_guest') ||
    localStorage.getItem('dojo_token') ||
    sessionStorage.getItem('dojo_token')
  )
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

// AccountRoute requires a real JWT — guests are redirected to login.
function AccountRoute({ children }) {
  const hasToken = Boolean(
    localStorage.getItem('dojo_token') ||
    sessionStorage.getItem('dojo_token')
  )
  return hasToken ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteTheme />
      <InterviewProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/setup" element={<PrivateRoute><Setup /></PrivateRoute>} />
          <Route path="/interview" element={<PrivateRoute><Interview /></PrivateRoute>} />
          <Route path="/history" element={<AccountRoute><History /></AccountRoute>} />
          <Route path="/api-providers" element={<AccountRoute><ApiProviders /></AccountRoute>} />
          <Route path="/pricing" element={<Navigate to="/api-providers" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </InterviewProvider>
    </BrowserRouter>
  )
}
