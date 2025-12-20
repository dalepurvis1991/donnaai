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
        id: "introducing-donna-ai",
        title: "Introducing Donna AI: Your Operational Intelligence Partner",
        date: "2024-12-15",
        excerpt: "We're excited to announce Donna AI, the next generation of operational automation. Learn how Donna can transform your business workflows.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "odoo-integration-launch",
        title: "Seamless Odoo Integration Now Live",
        date: "2024-12-10",
        excerpt: "Connect Donna AI directly to your Odoo instance. Automate CRM tasks, update records, and streamline your ERP workflows with natural language.",
        author: "Engineering Team",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "privacy-first-ai",
        title: "Privacy-First AI: Our Commitment to Your Data",
        date: "2024-12-05",
        excerpt: "Learn about our zero-data retention policy, SOC2 compliance, and why we believe privacy is a fundamental right in the age of AI.",
        author: "Security Team",
        image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60"
    }
]
