# Ezra - AI-Powered Email Assistant

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.8.2-2D3748)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4)](https://ai.google.dev/)

Ezra is an intelligent email assistant that learns your communication style and automatically generates personalized email replies. Built with advanced AI, real-time Gmail integration, and sophisticated context analysis.

## 🚀 Features

### Core Capabilities
- **AI-Powered Reply Generation**: Generates contextually appropriate email responses using Google Gemini 2.5 Flash
- **Personalized Communication Style**: Learns from your email history to match your unique voice and tone
- **Real-time Gmail Integration**: Processes incoming emails automatically via Gmail Push Notifications
- **Contextual Intelligence**: Analyzes calendar, email history, and conversation threads for informed responses
- **Queue-Based Processing**: Review, edit, approve, or reject AI-generated drafts before sending
- **Multi-Modal Context Engine**: Integrates calendar data, email history, and conversation context

### Advanced Features
- **Master Prompt System**: AI-generated personalized communication profiles
- **Interaction Network**: Maps your professional relationships and communication patterns
- **Strategic Rulebook**: Learns your decision-making patterns and response strategies
- **Email Threading**: Proper RFC 2822 compliant email threading for conversation continuity
- **Background Processing**: Scalable job queue system for handling multiple users
- **Token Usage Optimization**: Intelligent rate limiting and cost optimization for AI API calls

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **Next.js 15.3.3** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

#### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma 6.8.2** - Database ORM and migrations
- **PostgreSQL** - Primary database (Supabase)
- **BullMQ** - Redis-based job queue system
- **IORedis** - Redis client for queue management

#### AI & ML
- **Google Gemini 2.5 Flash** - Primary LLM for reply generation
- **LangChain** - AI framework for prompt management
- **js-tiktoken** - Token counting for cost optimization

#### External Integrations
- **Gmail API** - Email reading and sending
- **Google Calendar API** - Calendar context integration
- **Google Cloud Pub/Sub** - Real-time push notifications
- **NextAuth.js** - OAuth authentication

#### Infrastructure
- **Vercel** - Frontend deployment and serverless functions
- **Heroku** - Background worker processes
- **Redis** - Job queue and caching
- **Supabase** - PostgreSQL database hosting

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │  Background     │
│   (Next.js)     │◄──►│   (Serverless)  │◄──►│  Workers        │
│                 │    │                 │    │  (Heroku)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Redis Queue   │    │   Gmail API     │
│   (Supabase)    │    │   (BullMQ)      │    │   Push Notifs   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Email Processing Pipeline

### 1. Email Ingestion
```
Gmail Push Notification → Webhook → Parse Payload → Fetch New Emails → Store in Database
```
- **Push Notifications**: Google Cloud Pub/Sub integration for real-time email detection
- **Deduplication**: In-memory locks prevent duplicate processing
- **History Tracking**: Gmail history ID management for incremental fetching
- **Threading Support**: RFC 2822 Message-ID, References, and In-Reply-To headers

### 2. Context Analysis Pipeline
```
Incoming Email → Email Scanner → Context Engine → Calendar/History Analysis → Contextual Draft
```
- **Email Scanner**: LLM analyzes email to determine context requirements
- **Calendar Integration**: Checks availability and relevant events when needed
- **Email History**: Retrieves conversation threads and sender-specific patterns
- **POS Integration**: Uses Interaction Network and Strategic Rulebook for context

### 3. Reply Generation Pipeline
```
Contextual Draft → Master Prompt → Style Analysis → Reply Generator → Confidence Scoring
```
- **Mode A (Instruction-Guided)**: Uses contextual draft as strategic guidance
- **Mode B (Traditional)**: Generates from scratch using Master Prompt
- **Style Compression**: Efficient sender-specific adaptation
- **Confidence Scoring**: 0-100 based on available context and patterns

### 4. User Review & Sending
```
Generated Reply → Queue Display → User Review → Approve/Edit/Reject → Send via Gmail API
```
- **Queue Interface**: Real-time display of pending replies
- **Edit Capability**: Full email editor with original context
- **Feedback Loop**: User actions improve future generations
- **Proper Threading**: Maintains conversation continuity

## 📊 Database Schema

### Core Models

#### User Management
- **User**: Core user profile with onboarding status tracking
- **OAuthAccount**: Google OAuth tokens and refresh management
- **UserSettings**: User preferences and Gmail history tracking

#### Email System
- **Thread**: Email conversation groupings
- **Email**: Individual email messages with RFC 2822 headers
- **GeneratedReply**: AI-generated draft responses
- **Feedback**: User actions on generated replies

#### AI Personalization
- **MasterPrompt**: User's communication style profile
- **InteractionNetwork**: Professional relationship mapping
- **StrategicRulebook**: Decision-making pattern analysis

#### Activity Tracking
- **ActionHistory**: Complete audit trail of user actions
- **Embedding**: Vector embeddings for semantic search (future)

### Key Database Features
- **Email Threading**: Proper RFC 2822 Message-ID, References, and In-Reply-To headers
- **Version Management**: Versioned Master Prompts with activation system
- **Onboarding Tracking**: Boolean flags for completion status
- **Audit Trail**: Complete action history for analytics

## 🤖 AI System Design

### Master Prompt Generation
The system analyzes 180+ sent emails to create a personalized communication profile:

1. **Email Corpus Analysis**: Extracts patterns from user's sent emails
2. **Style Derivation**: Identifies tone, formality, structure preferences
3. **Distillation**: Creates user-editable summary while maintaining full context
4. **Confidence Scoring**: Based on email volume and pattern consistency

### Context Engine
Multi-stage contextual analysis for informed replies:

1. **Email Scanner**: Analyzes incoming email for context requirements
2. **Calendar Integration**: Checks availability and relevant events
3. **Email History**: Retrieves conversation threads and sender history
4. **Context Synthesis**: Combines all inputs into actionable reply instructions

### Reply Generation Modes

#### Mode A: Instruction-Guided
- Uses contextual draft as strategic guidance
- Implements specific requirements in user's voice
- Maintains authenticity while following strategic direction

#### Mode B: Traditional Generation
- Generates from scratch using Master Prompt
- Applies sender-specific adaptations
- Falls back when contextual analysis is insufficient

### Rate Limiting & Optimization
- **Queue-based Processing**: Prevents API overload with 4-second intervals
- **Exponential Backoff**: Handles 503/429 errors gracefully with max 30s delay
- **Token Counting**: Accurate cost tracking with js-tiktoken (GPT-4 encoding)
- **Model Selection**: Different Gemini models for different complexity levels
- **In-Memory Locking**: Prevents duplicate push notification processing
- **Upsert Operations**: Race condition prevention for database writes

## 🔧 Background Job System

### Queue Architecture
Built on BullMQ with Redis for reliable job processing:

#### Job Types
1. **Onboarding Queue**: Complete new user setup (email fetch → master prompt → POS components)
2. **Reply Generation Queue**: Individual email reply generation with context analysis
3. **Master Prompt Queue**: AI profile generation from 180+ sent emails
4. **POS Generation Queue**: Interaction Network & Strategic Rulebook generation

#### Worker Configuration
- **Onboarding**: Concurrency 2, 3 retries with exponential backoff
- **Master Prompt**: Concurrency 3, 2 retries
- **POS Generation**: Concurrency 2, 2 retries  
- **Reply Generation**: Concurrency 5, 2 retries

#### Onboarding Flow Details
```
New User → Auto-fetch Emails → Generate Master Prompt → Generate Interaction Network → Generate Strategic Rulebook
```
- **Step 1**: Fetch 180 recent sent emails from Gmail
- **Step 2**: Analyze communication patterns and generate Master Prompt
- **Step 3**: Create Interaction Network mapping professional relationships
- **Step 4**: Build Strategic Rulebook with decision-making patterns
- **Timeout Prevention**: Split into separate functions to avoid 60s Vercel limits

#### Graceful Shutdown
- Signal handling for SIGTERM/SIGINT
- Queue cleanup and Redis connection management
- Job completion before shutdown

## 🔐 Security & Authentication

### OAuth 2.0 Flow
- **Google OAuth**: Gmail and Calendar API access
- **Scope Management**: Minimal required permissions
- **Token Refresh**: Automatic token renewal
- **Secure Storage**: Encrypted token storage in database

### API Security
- **Session-based Auth**: NextAuth.js integration
- **CSRF Protection**: Built-in Next.js protections
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Comprehensive request validation

### Data Privacy
- **Minimal Data Storage**: Only necessary email metadata
- **User Control**: Complete data deletion capabilities
- **Audit Logging**: Full action history tracking

## 🚀 Deployment

### Production Environment

#### Frontend (Vercel)
```bash
# Environment Variables
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
DATABASE_URL=your-supabase-url
REDIS_URL=your-redis-url
GOOGLE_API_KEY=your-gemini-key
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

#### Background Workers (Heroku)
```bash
# Procfile
web: npm run start
worker: npm run worker

# Required Add-ons
- Heroku Redis
- Heroku Postgres (or external Supabase)
```

#### Gmail Push Notifications Setup
```bash
# Create Pub/Sub topic
gcloud pubsub topics create ezra-email-updates

# Grant Gmail permissions
gcloud pubsub topics add-iam-policy-binding ezra-email-updates \
  --member="serviceAccount:gmail-api-push@system.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

# Create subscription
gcloud pubsub subscriptions create ezra-email-sub \
  --topic=ezra-email-updates \
  --push-endpoint=https://your-domain.com/api/gmail-push/webhook
```

#### Cron Jobs (Vercel)
```bash
# Automatic Gmail watch renewal (daily at 2 AM UTC)
# Configured in vercel.json
```

### Development Setup

1. **Clone Repository**
```bash
git clone https://github.com/your-username/ezra-app.git
cd ezra-app
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env.local
# Fill in your environment variables
```

4. **Database Setup**
```bash
npx prisma generate
npx prisma db push
```

5. **Start Development**
```bash
# Frontend
npm run dev

# Background Worker (separate terminal)
npm run worker
```

## 📈 Performance Optimizations

### AI Cost Management
- **Token Counting**: Accurate usage tracking with js-tiktoken
- **Model Selection**: Gemini 2.5 Flash for complex tasks, 2.0 Flash for lighter operations
- **Rate Limiting**: 4-second intervals for Gemini free tier
- **Prompt Optimization**: Efficient prompt engineering with context compression
- **Global Token Tracking**: Comprehensive usage monitoring across all LLM calls

### Database Optimization
- **Indexed Queries**: Optimized for userId, createdAt, and email lookups
- **Connection Pooling**: Efficient Prisma database connections
- **Selective Loading**: Only fetch required fields with Prisma select
- **Batch Operations**: Bulk email processing in groups of 10
- **Upsert Operations**: Prevent race conditions and duplicate records

### Caching Strategy
- **Redis Caching**: BullMQ job queue and session storage
- **Static Generation**: Pre-built pages where possible
- **API Response Caching**: Reduced redundant processing
- **In-Memory Locks**: Prevent duplicate push notification processing

### Scalability Features
- **Serverless Architecture**: Auto-scaling Vercel functions
- **Background Workers**: Separate Heroku dynos for heavy processing
- **Queue-based Processing**: Handles multiple users concurrently
- **Graceful Degradation**: Fallback modes when services are unavailable

## ⚡ Technical Challenges & Solutions

### Email Threading Complexity
**Challenge**: Gmail's internal thread IDs vs RFC 2822 standards
**Solution**: Implemented dual threading system using both Gmail thread IDs and proper RFC 2822 headers (Message-ID, References, In-Reply-To) for universal email client compatibility

### Race Condition Prevention
**Challenge**: Multiple push notifications for same email causing duplicate replies
**Solution**: In-memory locking system with unique keys (`${emailAddress}-${historyId}`) and database upsert operations

### Serverless Timeout Issues
**Challenge**: 60-second Vercel function limits during user onboarding
**Solution**: Split onboarding into separate API endpoints with sequential triggering and 5-second delays between LLM calls

### AI Cost Optimization
**Challenge**: High token usage with large email contexts
**Solution**: Multi-stage prompt compression, selective model usage, and accurate token counting with js-tiktoken

### Gmail API Rate Limiting
**Challenge**: 503 errors on Gemini free tier
**Solution**: Queue-based processing with exponential backoff (max 30s) and 4-second minimum intervals

## 🔍 Monitoring & Observability

### Logging

- **Structured Logging**: Consistent log format across all services
- **Error Tracking**: Comprehensive error capture with context
- **Performance Metrics**: Response time and processing duration tracking
- **Token Usage**: Real-time AI cost monitoring with detailed breakdowns

### Health Checks
- **Database Connectivity**: Prisma connection health monitoring
- **Redis Status**: BullMQ queue system health
- **Gmail API**: OAuth token validity and refresh status
- **Worker Status**: Background job processing and queue lengths

## 🧪 Testing Strategy

### Unit Testing
- **Service Layer**: Core business logic testing
- **API Routes**: Endpoint functionality testing
- **Utility Functions**: Helper function validation

### Integration Testing
- **Gmail API**: Email processing workflows
- **Database Operations**: Data consistency testing
- **Queue Processing**: Job execution validation

### End-to-End Testing
- **User Workflows**: Complete feature testing
- **Authentication Flow**: OAuth integration testing
- **Email Pipeline**: Full processing pipeline testing

## 🔮 Future Enhancements

### Planned Features
- **Multi-Provider Support**: Outlook, Yahoo integration
- **Advanced Analytics**: Performance dashboards
- **Team Collaboration**: Shared templates and styles
- **Mobile Application**: Native mobile experience
- **Voice Integration**: Voice-to-email capabilities

### Technical Improvements
- **Vector Search**: Semantic email search
- **Real-time Updates**: WebSocket integration
- **Advanced Caching**: Multi-layer caching strategy
- **Microservices**: Service decomposition for scale

## 📝 Contributing

### Development Guidelines
1. **Code Style**: Follow TypeScript and ESLint rules
2. **Commit Messages**: Use conventional commit format
3. **Testing**: Include tests for new features
4. **Documentation**: Update README for significant changes

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request with description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini**: Advanced language model capabilities
- **Vercel**: Excellent deployment platform
- **Prisma**: Outstanding database toolkit
- **BullMQ**: Reliable job queue system
- **Next.js**: Powerful React framework

---



For support or questions, please contact: rushik_behal@sfu.ca

