import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login/index.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard/index.jsx'
import Gyms from './pages/Gyms/index.jsx'
import Workers from './pages/Workers/index.jsx'
import Presets from './pages/Presets/index.jsx'
import Clients from './pages/Clients/index.jsx'
import AuditLog from './pages/AuditLog/index.jsx'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('admin_token')
  const admin = localStorage.getItem('admin_data')
  if (!token || !admin) return <Navigate to="/login" replace />
  return children
}

function ForceLogoutListener() {
  const navigate = useNavigate()

  useEffect(() => {
    function handleLogout() {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_data')
      navigate('/login', { replace: true })
    }
    window.addEventListener('adminForceLogout', handleLogout)
    return () => window.removeEventListener('adminForceLogout', handleLogout)
  }, [navigate])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ForceLogoutListener />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="gyms" element={<Gyms />} />
          <Route path="workers" element={<Workers />} />
          <Route path="presets" element={<Presets />} />
          <Route path="clients" element={<Clients />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
