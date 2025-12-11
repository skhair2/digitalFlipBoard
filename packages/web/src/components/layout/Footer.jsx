import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-slate-900 py-12 mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 className="text-white font-bold mb-4">FlipDisplay.online</h3>
                        <p className="text-gray-400 text-sm">
                            Transform any screen into a stunning split-flap message board.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/display" className="hover:text-white transition-colors">Display Mode</Link></li>
                            <li><Link to="/control" className="hover:text-white transition-colors">Controller</Link></li>
                            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                            <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
                            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="text-center text-gray-600 text-sm pt-8 border-t border-slate-900">
                    © {new Date().getFullYear()} FlipDisplay.online. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
