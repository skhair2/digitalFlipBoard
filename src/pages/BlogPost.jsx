import { useParams, Link, useNavigate } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { blogPosts } from '../data/blogPosts'
import { Button } from '../components/ui/Components'

export default function BlogPost() {
    const { id } = useParams()
    const navigate = useNavigate()
    const post = blogPosts.find(p => p.id === id)

    if (!post) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
                <h1 className="text-4xl font-bold text-white mb-4">Article Not Found</h1>
                <p className="text-gray-400 mb-8">The article you are looking for does not exist.</p>
                <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
            </div>
        )
    }

    return (
        <>
            <SEOHead 
                title={post.title}
                description={post.excerpt}
            />

            <article className="min-h-screen bg-slate-900 pt-24 pb-12 px-4">
                {/* Hero Image */}
                <div className="w-full h-[40vh] md:h-[50vh] absolute top-0 left-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-slate-900 z-10" />
                    <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover opacity-50"
                    />
                </div>

                <div className="container mx-auto max-w-3xl relative z-10">
                    <Link
                        to="/blog"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Blog
                    </Link>

                    <header className="mb-12">
                        <div className="flex items-center gap-3 text-sm text-teal-400 font-medium mb-4">
                            <span>{post.category}</span>
                            <span>•</span>
                            <span>{post.readTime}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                                {post.author.charAt(0)}
                            </div>
                            <div>
                                <div className="text-white font-medium">{post.author}</div>
                                <div className="text-sm text-gray-400">{post.role} • {post.date}</div>
                            </div>
                        </div>
                    </header>

                    <div
                        className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-teal-400 hover:prose-a:text-teal-300 prose-strong:text-white prose-code:text-teal-300 prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Share / CTA Section */}
                    <div className="mt-16 pt-8 border-t border-slate-800">
                        <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-700">
                            <h3 className="text-2xl font-bold text-white mb-4">
                                Ready to create your own display?
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Join thousands of others using FlipDisplay.online to transform their screens.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button onClick={() => navigate('/control')}>
                                    Get Started Free
                                </Button>
                                <Button variant="outline" onClick={() => navigate('/display')}>
                                    View Demo
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </>
    )
}
