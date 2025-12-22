import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Components'
import Logo from '../ui/Logo'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'

export default function Header() {
    const { user, isAdmin, signOut } = useAuthStore()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const navLinks = [
        { name: 'Display', path: '/display' },
        { name: 'Control', path: '/control' },
        { name: 'Pricing', path: '/pricing' },
        { name: 'Blog', path: '/blog' },
    ]

    return (
        <header className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur border-b border-slate-800">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="text-xl font-bold text-white flex items-center gap-3 group">
                    <Logo className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" animated />
                    <span className="hidden sm:inline">FlipDisplay.online</span>
                    <span className="sm:hidden">FlipDisplay</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map(link => (
                        <Link key={link.path} to={link.path} className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                            {link.name}
                        </Link>
                    ))}
                    {isAdmin && (
                        <Link to="/admin" className="text-gray-300 hover:text-white transition-colors font-medium text-sm">🔐 Admin</Link>
                    )}
                </nav>

                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden sm:flex items-center gap-4">
                        {user ? (
                            <>
                                <Link to="/dashboard">
                                    <Button variant="ghost" size="sm">Dashboard</Button>
                                </Link>
                                <Button variant="outline" size="sm" onClick={signOut}>Sign Out</Button>
                            </>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">Sign In</Button>
                                </Link>
                                <Link to="/control">
                                    <Button size="sm">Get Started</Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-slate-900 border-b border-slate-800 overflow-hidden"
                    >
                        <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
                            {navLinks.map(link => (
                                <Link 
                                    key={link.path} 
                                    to={link.path} 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-lg font-medium text-slate-300 hover:text-white py-2"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            {isAdmin && (
                                <Link 
                                    to="/admin" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-lg font-medium text-slate-300 hover:text-white py-2"
                                >
                                    🔐 Admin
                                </Link>
                            )}
                            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                                {user ? (
                                    <>
                                        <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button className="w-full">Dashboard</Button>
                                        </Link>
                                        <Button variant="outline" className="w-full" onClick={() => { signOut(); setIsMobileMenuOpen(false); }}>
                                            Sign Out
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button variant="outline" className="w-full">Sign In</Button>
                                        </Link>
                                        <Link to="/control" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button className="w-full">Get Started</Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}
