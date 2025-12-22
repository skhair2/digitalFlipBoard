import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useSessionStore } from '../../store/sessionStore'

export default function Layout() {
    const isFullscreen = useSessionStore((state) => state.isFullscreen)

    return (
        <div className="min-h-screen flex flex-col bg-slate-900 text-white font-sans">
            {!isFullscreen && <Header />}
            <main className={`flex-1 ${!isFullscreen ? 'pt-16' : ''}`}>
                <Outlet />
            </main>
            {!isFullscreen && <Footer />}
        </div>
    )
}
