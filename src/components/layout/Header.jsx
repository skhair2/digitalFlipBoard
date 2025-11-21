import Logo from '../ui/Logo'

export default function Header() {
    const { user, signOut } = useAuthStore()

    return (
        <header className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur border-b border-slate-800">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="text-xl font-bold text-white flex items-center gap-3 group">
                    <Logo className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" animated />
                    <span>Digital Flipboard</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6">
                    <Link to="/display" className="text-gray-300 hover:text-white transition-colors">Display</Link>
                    <Link to="/control" className="text-gray-300 hover:text-white transition-colors">Control</Link>
                    <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
                </nav>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <Link to="/dashboard">
                                <Button variant="ghost" size="sm">Dashboard</Button>
                            </Link>
                            <Button variant="outline" size="sm" onClick={signOut}>Sign Out</Button>
                        </>
                    ) : (
                        <Link to="/control">
                            <Button size="sm">Get Started</Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}
