import { useState } from 'react'
import { Link } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import SEOHead from '../components/SEOHead'
import { blogPosts } from '../data/blogPosts'
import { Input } from '../components/ui/Components'

export default function Blog() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')

    const categories = ['All', ...new Set(blogPosts.map(post => post.category))]

    const filteredPosts = blogPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <>
            <SEOHead page="blog" />

            <div className="min-h-screen bg-slate-900 pt-24 pb-12 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            The <span className="text-teal-400">Flip</span> Side
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Insights on design, technology, and the future of communication.
                        </p>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-12">
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                        <div className="w-full md:w-72">
                            <Input
                                placeholder="Search articles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-800 border-slate-700"
                            />
                        </div>
                    </div>

                    {/* Blog Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPosts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link to={`/blog/${post.id}`} className="group block h-full bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700 hover:border-teal-500/50 transition-colors">
                                    <div className="aspect-video overflow-hidden">
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 text-xs text-teal-400 font-medium mb-3">
                                            <span>{post.category}</span>
                                            <span>•</span>
                                            <span>{post.readTime}</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-white mb-3 group-hover:text-teal-400 transition-colors line-clamp-2">
                                            {post.title}
                                        </h2>
                                        <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50">
                                            <div className="text-xs text-gray-500">
                                                {post.author}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {post.date}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {filteredPosts.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-gray-400 text-lg">No articles found matching your search.</p>
                            <button
                                onClick={() => { setSearchTerm(''); setSelectedCategory('All') }}
                                className="mt-4 text-teal-400 hover:text-teal-300"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
