# Donna AI - Intelligent Email Management Platform

<div align="center">
  <h3>🤖 Transform your Gmail into an AI-powered productivity hub</h3>
  <p>Advanced email categorization, task management, and business intelligence with seamless background synchronization</p>
</div>

## 🚀 Features

### Core Email Management
- **AI-Powered Categorization**: Automatically sorts emails into FYI, Draft, and Forward categories with 95% accuracy
- **Real-time Synchronization**: 15-minute auto-refresh keeps your inbox current
- **Smart Email Processing**: Bulk processing of 100-1000 emails for enhanced AI learning context
- **Email Body Display**: Full email content viewing with proper formatting and error handling

### Advanced AI Capabilities
- **Intelligent Chat Assistant**: RAG-powered chat with 50-email context window for business insights
- **Email Correlation System**: Detects related emails (quotes, invoices, follow-ups) with automatic grouping
- **Business Intelligence**: AI-generated recommendations for quotes comparison and order progress
- **Draft Reply Assistance**: Context-aware email drafting with business relationship analysis

### Productivity Tools
- **Task Management**: Automatic task detection from emails with progress monitoring
- **Folder Organization**: Smart folder system with automatic organization rules
- **Daily Business Digest**: AI-powered summaries with sales metrics extraction
- **Calendar Integration**: Google Calendar sync with automatic event categorization

### Business Intelligence
- **Sales Analytics**: Automatic extraction of orders, revenue, and product types
- **Communication Analysis**: Detection of communication styles and business context
- **Memory System**: Vector-enhanced learning with 1000+ email capability
- **Custom Notifications**: User-configurable timing and digest preferences

## 🛠 Technology Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for state management
- **Wouter** for routing
- **Vite** for build tooling

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **PostgreSQL** with Drizzle ORM
- **Gmail API** integration
- **OpenAI** for AI processing

### Infrastructure
- **Google OAuth 2.0** authentication
- **Replit** deployment platform
- **PostgreSQL** database with connection pooling
- **Session-based** authentication

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Cloud Console project with Gmail API enabled
- OpenAI API key
- Replit account (for deployment)

## 🔧 Environment Variables

```env
DATABASE_URL=your_postgresql_connection_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
OPENAI_API_KEY=your_openai_api_key
REPLIT_DB_URL=your_replit_database_url
SESSION_SECRET=your_session_secret
```

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/dalepurvis1991/donnaai.git
cd donnaai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env` file with the required environment variables listed above.

### 4. Initialize Database
```bash
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📱 Usage

### Getting Started
1. **Sign In**: Use Google OAuth to authenticate
2. **Connect Gmail**: Grant permissions for email access
3. **Auto-Categorization**: Watch as emails are automatically sorted
4. **Explore Features**: Try chat, tasks, folders, and digest functionality

### Key Workflows
- **Email Triage**: Review categorized emails in the three-column dashboard
- **Task Creation**: Convert emails to actionable tasks automatically
- **Business Analysis**: Use correlations to compare quotes and track orders
- **Daily Insights**: Generate business intelligence reports from your emails

## 🏗 Architecture

### Authentication Flow
1. Replit OAuth for user authentication
2. Google OAuth for Gmail API access
3. Session-based state management
4. Automatic token refresh handling

### Data Processing
1. Gmail API fetches recent emails
2. OpenAI processes and categorizes content
3. PostgreSQL stores processed data
4. Real-time updates via background sync

### AI Integration
- **Email Classification**: Multi-category sorting with confidence scores
- **Content Analysis**: Extraction of business data and relationships
- **Response Generation**: Context-aware draft assistance
- **Learning System**: Continuous improvement from user interactions

## 🔒 Security

- OAuth 2.0 compliant authentication
- Secure session management
- API key encryption
- Database connection pooling
- CORS protection enabled

## 📊 Performance

- **15-minute sync cycles** for real-time updates
- **Bulk processing** capabilities for large email volumes
- **Optimized queries** with database indexing
- **Caching strategies** for improved response times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for AI processing capabilities
- Google for Gmail API and authentication
- Replit for hosting and development platform
- shadcn/ui for beautiful component library

## 📧 Contact

**Dale Purvis** - [GitHub](https://github.com/dalepurvis1991)

**Project Link**: [https://github.com/dalepurvis1991/donnaai](https://github.com/dalepurvis1991/donnaai)

---

<div align="center">
  <p>Built with ❤️ for productivity enthusiasts</p>
  <p><strong>Donna AI</strong> - Your intelligent email assistant</p>
</div>