import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children, requirePremium = false }) {
    const { user, isPremium, loading } = useAuthStore()
    const location = useLocation()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner size="lg" />
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/" state={{ from: location }} replace />
    }

    if (requirePremium && !isPremium) {
        return <Navigate to="/pricing" state={{ from: location }} replace />
    }

    return children
}
