export interface BlogPost {
    id: string
    title: string
    date: string
    excerpt: string
    author: string
    image: string
    content?: string
}

export const blogPosts: BlogPost[] = [
    {
        id: "the-email-problem",
        title: "Why we're building Donna: The Email Problem",
        date: "2024-12-20",
        excerpt: "Email isn't work—it's where work arrives. Here's why we believe the inbox is the broken heart of modern productivity.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "context-is-king",
        title: "Context is King: How Donna understands your work",
        date: "2024-12-18",
        excerpt: "Generic chatbots fail at email because they don't know who you are. Donna learns your projects, people, and priorities.",
        author: "Engineering Team",
        image: "https://images.unsplash.com/photo-1512314889357-e157c22f9856?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "human-in-the-loop",
        title: "The Power of Human-in-the-Loop Automation",
        date: "2024-12-15",
        excerpt: "Why we prioritize 'draft and approve' over 'auto-send'. Accuracy and trust matter more than raw speed.",
        author: "Product Team",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=60"
    }
]
