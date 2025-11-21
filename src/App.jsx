import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Spinner from './components/ui/Spinner'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { useMixpanel } from './hooks/useMixpanel'
import { Pricing, Blog, BlogPost, Privacy, Terms, NotFound } from './pages/Placeholders'

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'))
const Display = lazy(() => import('./pages/Display'))
const Control = lazy(() => import('./pages/Control'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

function App() {
  useMixpanel() // Track page views

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
            <Route path="display" element={<Display />} />
            <Route path="control" element={<Control />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:slug" element={<BlogPost />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />

            {/* Protected routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
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
