import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { gymLogout } from './store/slices/authSlice.js'
import SelectGym from './pages/SelectGym/index.jsx'
import SelectWorker from './pages/SelectWorker/index.jsx'
import Dashboard from './pages/Dashboard/index.jsx'

function ProtectedRoute({ children }) {
  const { gymAuthenticated, isAuthenticated } = useSelector(state => state.auth)
  if (!gymAuthenticated) return <Navigate to="/" replace />
  if (!isAuthenticated) return <Navigate to="/select-worker" replace />
  return children
}

function ForceLogoutListener() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    function handleForceLogout() {
      localStorage.removeItem('access_token')
      dispatch(gymLogout())
      navigate('/', { replace: true })
    }
    window.addEventListener('forceLogout', handleForceLogout)
    return () => window.removeEventListener('forceLogout', handleForceLogout)
  }, [dispatch, navigate])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ForceLogoutListener />
      <Routes>
        <Route path="/" element={<SelectGym />} />
        <Route path="/select-worker" element={<SelectWorker />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
