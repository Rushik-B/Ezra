# Ezra - AI Email Assistant

A Next.js application with Google OAuth integration and Supabase database for Gmail access. This is the foundation for an AI-powered email assistant.

## Features

- ✅ Google OAuth authentication
- ✅ Gmail API access permissions
- ✅ Supabase PostgreSQL database with Prisma ORM
- ✅ User management and OAuth account storage
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

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth API route
│   ├── auth/signin/page.tsx             # Custom sign-in page
│   ├── layout.tsx                       # Root layout with SessionProvider
│   └── page.tsx                         # Main page with auth logic
├── components/
│   └── SessionProvider.tsx              # Client-side session provider
├── lib/
│   ├── auth.ts                          # NextAuth configuration with Prisma
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
- **Thread**: Email conversation threads
- **Email**: Individual email messages with metadata
- **Embedding**: Vector embeddings for AI processing
- **Feedback**: User feedback on AI-generated responses
- **AutonomyRule**: User-defined automation rules
- **UserSettings**: User preferences and autonomy levels

## Authentication Flow

1. **Unauthenticated**: Shows a clean sign-in page with Google OAuth button
2. **Authentication**: Creates/updates user in database with OAuth tokens
3. **Authenticated**: Shows the main dashboard with user info and sign-out option
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

## Next Steps

This foundation is ready for building the AI email assistant features:

1. **Email Ingestion**: Fetch and analyze recent emails using Gmail API
2. **AI Integration**: Add OpenAI/Gemini for email analysis and generation
3. **Vector Storage**: Implement embeddings for email content
4. **Smart Replies**: Generate contextual email responses
5. **Chrome Extension**: Build sidebar for Gmail integration

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: NextAuth.js with Google OAuth + Prisma Adapter
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
