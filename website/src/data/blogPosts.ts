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
        id: "ops-leaders-email-system",
        title: "The Ops Leader’s Email System: Track Work Without Bottlenecks",
        date: "2024-12-20",
        excerpt: "Operations leaders get copied on everything. Here’s how to extract tasks, owners, and follow-ups without living in the inbox.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "handle-cc-chains",
        title: "How to Handle CC Chains Without Losing Your Day",
        date: "2024-12-20",
        excerpt: "CC chains waste time. Learn a simple approach to filter FYI vs action and reduce attention drain.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "email-summaries-that-actually-help",
        title: "Email Summaries That Actually Help: What to Summarise",
        date: "2024-12-20",
        excerpt: "A useful summary is not a rewrite. It’s decisions, actions, risks, and next steps.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "ai-inbox-setup",
        title: "How to Set Up an AI Inbox Assistant in 30 Minutes",
        date: "2024-12-20",
        excerpt: "A practical setup guide: scope, safety, batching, and prompts that produce reliable daily value.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "stop-losing-follow-ups",
        title: "Stop Losing Follow-Ups: A Simple ‘Open Loops’ List",
        date: "2024-12-20",
        excerpt: "The easiest way to fix dropped follow-ups is to track open loops separately from your inbox.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "write-shorter-emails",
        title: "Write Shorter Emails: The Framework for Fast Communication",
        date: "2024-12-20",
        excerpt: "Short emails win. Here’s a structure that reduces replies, improves clarity, and saves time.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "what-to-automate-in-email-first",
        title: "What to Automate First in an Email-First Assistant",
        date: "2024-12-20",
        excerpt: "Automate the heavy lifting—summaries, task extraction, drafts—while keeping final decisions human-approved.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "how-to-draft-emails-from-context",
        title: "How to Draft Emails From Context (So You Stop Re-Reading Threads)",
        date: "2024-12-20",
        excerpt: "Context-aware drafting is the difference between generic AI replies and emails you can actually send. Here’s the system.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1512314889357-e157c22f9856?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "email-overload-delegation",
        title: "Email Overload and Delegation: The Follow-Up System",
        date: "2024-12-20",
        excerpt: "Delegation fails when follow-up is missing. Learn a lightweight system to track “waiting on” items pulled from email.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "meeting-transcripts-to-tasks",
        title: "How to Turn Meeting Transcripts Into Tasks",
        date: "2024-12-20",
        excerpt: "Meeting transcripts are a goldmine for action items. Here’s how busy people can convert transcripts into next steps in minutes.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "reduce-back-and-forth-emails",
        title: "How to Reduce Back-and-Forth Emails: 7 Patterns",
        date: "2024-12-20",
        excerpt: "Cut email ping-pong by making decisions clearer and next steps explicit. Includes templates you can reuse.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1577563908411-bd26ca4dd5b1?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "email-triage-system",
        title: "The 15-Minute Email Triage System for Busy People",
        date: "2024-12-20",
        excerpt: "A realistic triage method that works even when you’re behind: prioritise, extract tasks, draft replies, and move on.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "ai-email-assistant-best-practices",
        title: "AI Email Assistant Best Practices",
        date: "2024-12-20",
        excerpt: "Use AI safely and effectively in email: context, tone, guardrails, and confirmation workflows.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "build-context-from-email",
        title: "How an Email Assistant Builds Context",
        date: "2024-12-20",
        excerpt: "Context is the difference between generic AI and a real assistant. Here’s how context is built from email history.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "follow-up-email-templates",
        title: "Follow-Up Email Templates for Busy People",
        date: "2024-12-20",
        excerpt: "Copy-paste follow-up templates that reduce ambiguity, preserve relationships, and close loops quickly.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "executive-assistant-in-your-inbox",
        title: "An Executive Assistant in Your Inbox",
        date: "2024-12-20",
        excerpt: "AI becomes genuinely useful when it handles the invisible admin: open loops, drafting, and action capture.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "ai-email-task-manager",
        title: "AI Email Task Manager: Turn Threads Into Clear Actions",
        date: "2024-12-20",
        excerpt: "Learn how an email-first AI assistant extracts tasks, owners, and due dates from real conversations—so busy people stop losing follow-ups.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "inbox-zero-for-busy-people",
        title: "Inbox Zero for Busy People: A Practical System",
        date: "2024-12-20",
        excerpt: "Inbox Zero isn’t about hitting 0 emails. It’s about controlling attention, extracting tasks, and closing loops—fast.",
        author: "Donna AI Team",
        image: "https://images.unsplash.com/photo-1512314889357-e157c22f9856?w=800&auto=format&fit=crop&q=60"
    }
]
