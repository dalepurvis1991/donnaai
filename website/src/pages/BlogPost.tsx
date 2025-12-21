import { useEffect, useMemo, useState } from 'react'
import { useRoute, Link } from 'wouter'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { blogPosts } from '../data/blogPosts'

const BlogPost = () => {
    const [, params] = useRoute('/blog/:id')
    const [content, setContent] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [scrollProgress, setScrollProgress] = useState(0)

    const post = blogPosts.find(p => p.id === params?.id)
    const relatedPosts = useMemo(() => {
        if (!post) return []
        return blogPosts.filter(p => p.id !== post.id).slice(0, 3)
    }, [post])

    // Load all markdown files at build time
    const posts = import.meta.glob('../content/blog/*.md', { query: '?raw', import: 'default' })

    useEffect(() => {
        if (!post) return

        const loadContent = async () => {
            try {
                // Construct the path key for the glob map
                const path = `../content/blog/${post.id}.md`
                const loader = posts[path]

                if (!loader) {
                    throw new Error('Post file not found')
                }

                // Call the loader function (it returns a Promise that resolves to the string content)
                const text = await loader() as string
                setContent(text)
                setLoading(false)
            } catch (err) {
                console.error('Failed to load blog post:', err)
                setContent('# Post not found\n\nThe content for this post could not be loaded.')
                setLoading(false)
            }
        }

        loadContent()
    }, [post])

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0
            setScrollProgress(progress)
        }

        handleScroll()
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

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
        <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-12">
            <div className="fixed top-16 left-0 right-0 z-40 h-1 bg-slate-200 dark:bg-[#3b4154]">
                <div className="h-full bg-primary transition-all" style={{ width: `${scrollProgress}%` }}></div>
            </div>
            <div className="flex flex-col lg:flex-row gap-12">
                <aside className="hidden lg:flex flex-col gap-6 sticky top-32 h-fit w-16 items-center">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Share</p>
                    <button className="size-10 rounded-full bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:border-primary transition-colors">
                        <span className="material-symbols-outlined text-xl">link</span>
                    </button>
                    <button className="size-10 rounded-full bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:border-primary transition-colors">
                        <span className="material-symbols-outlined text-xl">share</span>
                    </button>
                    <button className="size-10 rounded-full bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:border-primary transition-colors">
                        <span className="material-symbols-outlined text-xl">send</span>
                    </button>
                </aside>

                <article className="flex-1 max-w-[860px] mx-auto w-full">
                    <nav className="flex flex-wrap items-center gap-2 mb-6">
                        <Link href="/">
                            <a className="text-slate-400 hover:text-primary text-sm font-medium leading-normal transition-colors">Home</a>
                        </Link>
                        <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                        <Link href="/blog">
                            <a className="text-slate-400 hover:text-primary text-sm font-medium leading-normal transition-colors">Blog</a>
                        </Link>
                        <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                        <span className="text-slate-900 dark:text-white text-sm font-medium leading-normal">{post.title}</span>
                    </nav>

                    <div className="flex gap-3 flex-wrap mb-6">
                        <span className="inline-flex h-7 items-center justify-center px-3 rounded-full bg-primary/10 dark:bg-[#282c39] text-primary dark:text-white text-xs font-semibold uppercase tracking-wide border border-primary/20 dark:border-transparent">
                            Blog Post
                        </span>
                        <span className="inline-flex h-7 items-center justify-center px-3 rounded-full bg-slate-200 dark:bg-[#282c39] text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wide border border-slate-300 dark:border-transparent">
                            Donna AI
                        </span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-slate-900 dark:text-white text-3xl md:text-5xl font-black leading-tight tracking-[-0.033em] mb-6">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-border-dark pb-8">
                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {post.author[0]}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-900 dark:text-white font-bold text-base">{post.author}</span>
                                <span className="text-slate-400 text-sm font-normal">
                                    {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10 group shadow-lg">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400
                            prose-headings:font-black prose-headings:tracking-tight
                            prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
                            prose-p:leading-relaxed
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

                    {relatedPosts.length > 0 && (
                        <section className="mt-24 pt-12 border-t border-slate-200 dark:border-border-dark">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Read Next</h3>
                                <Link href="/blog">
                                    <a className="text-primary font-medium hover:text-blue-400 flex items-center gap-1">
                                        View all posts <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </a>
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {relatedPosts.map((related) => (
                                    <Link key={related.id} href={`/blog/${related.id}`}>
                                        <a className="group flex flex-col gap-4">
                                            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-card-dark relative">
                                                <img
                                                    src={related.image}
                                                    alt={related.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <span className="text-primary text-xs font-bold uppercase tracking-wide">Donna AI</span>
                                                <h4 className="text-slate-900 dark:text-white text-lg font-bold group-hover:text-primary transition-colors line-clamp-2">
                                                    {related.title}
                                                </h4>
                                                <p className="text-slate-400 text-sm line-clamp-2">{related.excerpt}</p>
                                                <span className="text-xs text-slate-400 mt-1">
                                                    {new Date(related.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </a>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </article>
                <div className="hidden xl:block w-16"></div>
            </div>
        </main>
    )
}

export default BlogPost
