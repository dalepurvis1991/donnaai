import { motion } from 'framer-motion'
import { Link } from 'wouter'
import { blogPosts } from '../data/blogPosts'

const BlogCard = ({ post }: { post: typeof blogPosts[0] }) => (
    <Link href={`/blog/${post.id}`}>
        <motion.article
            whileHover={{ y: -5 }}
            className="group cursor-pointer bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all duration-300"
        >
            <div className="aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>
            <div className="p-6 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <time>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                    <span>•</span>
                    <span>{post.author}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {post.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {post.excerpt}
                </p>
                <div className="flex items-center gap-2 text-primary font-semibold text-sm mt-2">
                    Read More
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
            </div>
        </motion.article>
    </Link>
)

const Blog = () => {
    return (
        <main className="flex flex-col items-center">
            {/* Hero Section */}
            <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-6 items-center"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
                        <span className="material-symbols-outlined text-primary text-[16px]">article</span>
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Insights & Updates</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight dark:text-white max-w-3xl">
                        The Donna AI Blog
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                        Product updates, operational insights, and the future of AI-powered automation.
                    </p>
                </motion.div>
            </section>

            {/* Blog Grid */}
            <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogPosts.map((post, i) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <BlogCard post={post} />
                        </motion.div>
                    ))}
                </div>
            </section>
        </main>
    )
}

export default Blog
