import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute'
import Spinner from './components/ui/Spinner'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { useMixpanel } from './hooks/useMixpanel'
import { useAuthStore } from './store/authStore'
import { Pricing, NotFound } from './pages/Placeholders'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import About from './pages/About'
import Contact from './pages/Contact'
import Help from './pages/Help'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import webVitalsService from './services/webVitalsService'


// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'))
const Display = lazy(() => import('./pages/Display'))
const Control = lazy(() => import('./pages/Control'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Login = lazy(() => import('./pages/Login'))
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'))
const Admin = lazy(() => import('./pages/Admin'))
const DatabaseTest = lazy(() => import('./components/debug/DatabaseTest'))

function App() {
  useMixpanel() // Track page views
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Initialize Web Vitals tracking
  useEffect(() => {
    webVitalsService.init()
  }, [])

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Spinner size="lg" />
      </div>
    }>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="auth/callback" element={<OAuthCallback />} />
            <Route path="display" element={<Display />} />
            <Route path="control" element={<Control />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:id" element={<BlogPost />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="help" element={<Help />} />
            <Route path="db-test" element={<DatabaseTest />} />

            {/* Protected routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="admin"
              element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </Suspense>
  )
}

export default App
