import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Scan from './pages/Scan'
import ProtectedRoute from './components/ProtectedRoute'
import AttendanceList from './pages/AttendanceList'
import Students from './pages/Students'
import AttendanceHistory from './pages/AttendanceHistory'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/scan" element={<Scan />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/attendance" element={<AttendanceList />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/total-students" element={<Students />} />
          <Route path="/history" element={<AttendanceHistory />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
