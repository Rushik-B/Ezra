# Ezra - AI Email Assistant

A Next.js application with Google OAuth integration, Gmail API, and Supabase database for intelligent email management. This is the foundation for an AI-powered email assistant.

## Features

- ✅ Google OAuth authentication with Gmail API access
- ✅ Fetch and store 500 recent emails from Gmail
- ✅ Supabase PostgreSQL database with Prisma ORM
- ✅ User management and OAuth account storage
- ✅ Email threading and organization
- ✅ Clean, modern UI with Tailwind CSS
- ✅ Session management with NextAuth.js
- ✅ TypeScript support

## Setup Instructions

### 1. Supabase Database Setup

1. Go to [Supabase](https://supabase.com/) and create a new project
2. Wait for the database to be ready
3. Go to Settings > Database and copy the connection string
4. Replace `[YOUR-PASSWORD]` in the connection string with your actual password

### 2. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - Add your production URL when deploying
5. Copy the Client ID and Client Secret

### 3. Environment Variables

Update the `.env.local` file with your credentials:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Supabase Database Configuration
DATABASE_URL=your-supabase-database-url-here
```

### 4. Generate NextAuth Secret

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

Replace `your-secret-key-here-change-this-in-production` with the generated secret.

### 5. Install Dependencies

```bash
npm install
```

### 6. Database Setup

Run Prisma migrations to set up your database schema:

```bash
npx prisma db push
```

Generate the Prisma client:

```bash
npx prisma generate
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Sign In**: Click "Sign in with Google" and authorize Gmail access
2. **Fetch Emails**: Click "Fetch Recent Emails (500)" to import your emails
3. **View Stats**: See your email count and conversation threads
4. **Monitor Progress**: Watch the real-time status updates during email fetching

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth API route
│   │   ├── fetch-emails/route.ts        # Gmail email fetching API
│   │   └── email-stats/route.ts         # User email statistics API
│   ├── auth/signin/page.tsx             # Custom sign-in page
│   ├── layout.tsx                       # Root layout with SessionProvider
│   └── page.tsx                         # Main page with email fetching UI
├── components/
│   └── SessionProvider.tsx              # Client-side session provider
├── lib/
│   ├── auth.ts                          # NextAuth configuration
│   ├── gmail.ts                         # Gmail API service
│   └── prisma.ts                        # Prisma client instance
├── types/
│   └── next-auth.d.ts                   # TypeScript declarations
└── prisma/
    └── schema.prisma                    # Database schema
```

## Database Schema

The application uses the following main models:

- **User**: Core user information and relationships
- **OAuthAccount**: Google OAuth tokens and account data
- **Thread**: Email conversation threads grouped by subject
- **Email**: Individual email messages with full content
- **Embedding**: Vector embeddings for AI processing (ready for future use)
- **Feedback**: User feedback on AI-generated responses (ready for future use)
- **AutonomyRule**: User-defined automation rules (ready for future use)
- **UserSettings**: User preferences and autonomy levels

## Gmail Integration Features

### Email Fetching
- Fetches up to 500 recent emails per user
- Processes emails in batches of 10 to respect rate limits
- Excludes chat messages (`-in:chats` query)
- Handles both sent and received emails
- Extracts email headers, body, and metadata

### Email Processing
- Parses HTML and plain text email bodies
- Extracts sender, recipients, and CC information
- Groups emails into conversation threads by subject
- Stores email dates and Gmail labels (SENT, DRAFT)
- Prevents duplicate email storage

### Error Handling
- Graceful handling of API rate limits
- Continues processing if individual emails fail
- Detailed logging for debugging
- User-friendly error messages

## Authentication Flow

1. **Unauthenticated**: Shows a clean sign-in page with Google OAuth button
2. **Authentication**: Creates/updates user in database with OAuth tokens
3. **Authenticated**: Shows the main dashboard with email fetching capability
4. **Database Sync**: User data, settings, and OAuth tokens are stored in Supabase

## Gmail API Permissions

The app requests the following Gmail scopes:
- `https://www.googleapis.com/auth/gmail.readonly` - Read Gmail messages
- `https://www.googleapis.com/auth/gmail.send` - Send emails on behalf of the user

## Database Commands

```bash
# Push schema changes to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# View database in Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma db push --force-reset
```

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth authentication

### Email Management
- `POST /api/fetch-emails` - Fetch emails from Gmail and store in database
- `GET /api/email-stats` - Get user's email and thread counts

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure your `DATABASE_URL` is correct in `.env.local`
   - Make sure your Supabase project is running
   - Check that you've replaced `[YOUR-PASSWORD]` with your actual password

2. **Gmail API Errors**
   - Verify your Google OAuth credentials are correct
   - Ensure Gmail API is enabled in Google Cloud Console
   - Check that redirect URIs match exactly (including protocol and port)

3. **Authentication Errors**
   - Generate a new `NEXTAUTH_SECRET` if needed
   - Restart the development server after changing `.env.local`
   - Clear browser cookies if authentication seems stuck

4. **Email Fetching Issues**
   - Check server logs for detailed error messages
   - Ensure OAuth token has Gmail permissions
   - Verify user has emails in their Gmail account

### Development Commands

```bash
# Check TypeScript errors
npx tsc --noEmit

# Check for linting issues
npm run lint

# Build for production
npm run build

# View server logs
npm run dev (and check terminal output)
```

## Server Logs

When running `npm run dev`, you'll see detailed logs including:
- Email fetching progress with batch numbers
- Individual email processing status
- Database storage operations
- Error messages with stack traces
- Performance metrics

## Next Steps

This foundation is ready for building advanced AI email assistant features:

1. **Email Analysis**: Analyze email patterns and writing style
2. **AI Integration**: Add OpenAI/Gemini for email analysis and generation
3. **Vector Storage**: Implement embeddings for email content search
4. **Smart Replies**: Generate contextual email responses
5. **Chrome Extension**: Build sidebar for Gmail integration
6. **Automation Rules**: Implement user-defined email automation

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: NextAuth.js with Google OAuth + Custom JWT Strategy
- **Gmail API**: Google APIs Node.js client
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Icons**: React Icons (Heroicons, Google icons)

## Deployment

For production deployment:

1. Set up production Supabase project
2. Update `NEXTAUTH_URL` and `DATABASE_URL` in environment variables
3. Add production redirect URIs to Google OAuth settings
4. Run database migrations: `npx prisma db push`
5. Deploy to Vercel, Netlify, or your preferred platform

## Security Notes

- Never commit `.env.local` to version control
- Use strong, unique secrets for production
- Regularly rotate OAuth credentials
- Database credentials are automatically managed by Supabase
- All foreign key relationships include `onDelete: Cascade` for data integrity
- OAuth tokens are securely stored and refreshed automatically 