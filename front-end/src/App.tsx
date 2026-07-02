import { useEffect } from 'react'
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'
import DashboardLayout from '@/layouts/DashboardLayout'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import DashboardHome from '@/pages/dashboard/Home'
import Classes from '@/pages/dashboard/Classes'
import Problems from '@/pages/dashboard/Problems'
import ProblemDetail from '@/pages/dashboard/ProblemDetail'
import Submissions from '@/pages/dashboard/Submissions'
import Leaderboard from '@/pages/dashboard/Leaderboard'
import Profile from '@/pages/dashboard/Profile'
import Settings from '@/pages/dashboard/Settings'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminClassrooms from '@/pages/admin/Classrooms'
import ProblemManager from '@/pages/admin/ProblemManager'
import UserManager from '@/pages/admin/UserManager'
import Analytics from '@/pages/admin/Analytics'
import { useAppStore } from '@/store/useAppStore'

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '')

function App() {
  const restoreSession = useAppStore((s) => s.restoreSession)

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  return (
    <BrowserRouter basename={routerBasename || undefined}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="classes" element={<Classes />} />
          <Route path="problems" element={<Problems />} />
          <Route path="problems/:id" element={<ProblemDetail />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/admin" element={<DashboardLayout admin />}>
          <Route index element={<AdminDashboard />} />
          <Route path="classrooms" element={<AdminClassrooms />} />
          <Route path="problems" element={<ProblemManager />} />
          <Route path="users" element={<UserManager />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
