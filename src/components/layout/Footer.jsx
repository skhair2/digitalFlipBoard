import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-slate-900 py-12 mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 className="text-white font-bold mb-4">Digital Vestaboard</h3>
                        <p className="text-gray-400 text-sm">
                            Transform any screen into a stunning split-flap message board.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/display" className="hover:text-white">Display Mode</Link></li>
                            <li><Link to="/control" className="hover:text-white">Controller</Link></li>
                            <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                            <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                            <li><a href="#" className="hover:text-white">Support</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="text-center text-gray-600 text-sm pt-8 border-t border-slate-900">
                    © {new Date().getFullYear()} Digital Vestaboard. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
