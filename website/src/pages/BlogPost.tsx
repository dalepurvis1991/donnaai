import { useEffect, useState } from 'react'
import { useRoute, Link } from 'wouter'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { blogPosts } from '../data/blogPosts'

const BlogPost = () => {
    const [, params] = useRoute('/blog/:id')
    const [content, setContent] = useState<string>('')
    const [loading, setLoading] = useState(true)

    const post = blogPosts.find(p => p.id === params?.id)

    useEffect(() => {
        if (!post) return

        // Dynamically import the markdown file
        fetch(`/src/content/blog/${post.id}.md`)
            .then(res => res.text())
            .then(text => {
                setContent(text)
                setLoading(false)
            })
            .catch(() => {
                setContent('# Post not found\n\nThe content for this post could not be loaded.')
                setLoading(false)
            })
    }, [post])

    if (!post) {
        return (
            <main className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <h1 className="text-4xl font-black dark:text-white mb-4">Post Not Found</h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8">The blog post you're looking for doesn't exist.</p>
                <Link href="/blog">
                    <a className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors">
                        Back to Blog
                    </a>
                </Link>
            </main>
        )
    }

    return (
        <main className="flex flex-col items-center">
            {/* Header */}
            <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Link href="/blog">
                    <a className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold mb-8 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        Back to Blog
                    </a>
                </Link>
            </section>

            {/* Hero Image */}
            <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-border-dark">
                    <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            </section>

            {/* Article Content */}
            <article className="w-full max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl sm:text-5xl font-black dark:text-white mb-6 leading-tight">
                        {post.title}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <time>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                        <span>•</span>
                        <span>{post.author}</span>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="prose prose-lg dark:prose-invert prose-slate max-w-none
                        prose-headings:font-black prose-headings:tracking-tight
                        prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
                        prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-slate-900 dark:prose-strong:text-white
                        prose-ul:text-slate-600 dark:prose-ul:text-slate-400
                        prose-li:marker:text-primary
                        prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                        prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700
                    ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    </div>
                )}
            </article>

            {/* Related Posts / CTA */}
            <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200 dark:border-border-dark">
                <div className="text-center">
                    <h2 className="text-2xl font-black dark:text-white mb-4">Ready to get started?</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">Join the Donna AI Pilot Program today.</p>
                    <Link href="/pricing">
                        <a className="inline-block px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors shadow-lg shadow-primary/25">
                            View Pricing
                        </a>
                    </Link>
                </div>
            </section>
        </main>
    )
}

export default BlogPost
