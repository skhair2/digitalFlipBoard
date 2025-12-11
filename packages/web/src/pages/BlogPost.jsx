import { useParams, Link, useNavigate } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { blogPosts } from '../data/blogPosts'
import { Button } from '../components/ui/Components'
import DOMPurify from 'dompurify'

export default function BlogPost() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const post = blogPosts.find(p => p.id === slug)

    if (!post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
                <Link to="/blog">
                    <Button>Return to Blog</Button>
                </Link>
            </div>
        )
    }

    return (
        <>
            <SEOHead
                title={`${post.title} | Digital FlipBoard Blog`}
                description={post.excerpt}
                image={post.image}
            />

            <article className="min-h-screen bg-slate-950 pt-24 pb-20">
                {/* Hero Section */}
                <div className="container mx-auto px-4 max-w-4xl">
                    <Link
                        to="/blog"
                        className="inline-flex items-center text-slate-400 hover:text-teal-400 mb-8 transition-colors group"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Blog
                    </Link>

                    <header className="mb-12 text-center">
                        <div className="flex items-center justify-center gap-4 text-sm text-teal-400 mb-6 font-mono uppercase tracking-wider">
                            <span>{post.category}</span>
                            <span>•</span>
                            <span>{post.readTime}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            {post.title}
                        </h1>
                        <div className="flex items-center justify-center gap-3 text-slate-400">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                                {post.author[0]}
                            </div>
                            <div className="text-left">
                                <div className="text-white font-medium">{post.author}</div>
                                <div className="text-sm">{post.date}</div>
                            </div>
                        </div>
                    </header>

                    {/* Featured Image */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden mb-12 shadow-2xl border border-white/10">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-teal-400 hover:prose-a:text-teal-300 prose-strong:text-white prose-code:text-teal-300 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
                    </div>

                    {/* CTA */}
                    <div className="mt-20 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-purple-500 to-teal-500" />
                        <div className="relative z-10">
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                Ready to transform your space?
                            </h3>
                            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                                Join thousands of users creating stunning digital displays with Digital FlipBoard.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Button onClick={() => navigate('/control')} size="lg" className="shadow-lg shadow-teal-500/20">
                                    Get Started Free
                                </Button>
                                <Button variant="outline" onClick={() => navigate('/display')} size="lg">
                                    View Live Demo
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </>
    )
}
