import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-900 text-white font-sans">
            <Header />
            <main className="flex-1 pt-16">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}
