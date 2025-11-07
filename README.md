# Discovery Atlas - Quest-Based Exploration Platform

A gamified quest-based exploration platform where users complete challenges, earn badges, and connect with a community of adventurers.

## 🚀 Features

- **Quest System**: Complete location-based quests with photo verification
- **Gamification**: XP, levels, achievements, and daily/weekly challenges
- **Social Features**: Follow users, share posts, team challenges
- **Real-time Updates**: Live activity feed and notifications
- **Mobile Optimized**: Camera integration, GPS tracking, responsive design
- **AI Integration**: AI-powered quest suggestions and photo verification

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Maps**: Leaflet, React Leaflet
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

## 🔧 Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Discovery-atlas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

## 🗄️ Database Setup

1. Run the SQL files in your Supabase SQL Editor in this order:
   - `src/utils/setupGamification.sql`
   - `src/utils/setupFollowSystem.sql`
   - Other setup files as needed

2. Set up cron jobs for challenge resets (see `CHALLENGE_CRON_SETUP.md`)

## 🚀 Deployment to Vercel

### Step 1: Push to GitHub

1. **Initialize Git repository** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a new repository on GitHub**
   - Go to https://github.com/new
   - Create a new repository (don't initialize with README)

3. **Push to GitHub**
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Sign up/Login to Vercel**
   - Go to https://vercel.com
   - Sign up or login with your GitHub account

2. **Import your project**
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your project
   - Your app will be live at `https://your-project.vercel.app`

### Step 3: Configure Supabase

1. **Update Supabase Auth Settings**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL to "Redirect URLs"
   - Add your Vercel URL to "Site URL"

2. **Update CORS Settings** (if needed)
   - Ensure your Vercel domain is allowed in Supabase CORS settings

## 📝 Configuration

The project is pre-configured with Supabase credentials. No environment variables needed!

For production deployments, you may want to set up environment variables in your hosting platform, but the project will work out of the box with the default configuration.

## 📁 Project Structure

```
Discovery-atlas/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # Supabase client
│   ├── utils/          # Utility functions and SQL files
│   └── services/       # API services
├── supabase/
│   ├── functions/     # Edge functions
│   └── migrations/    # Database migrations
├── public/            # Static assets
├── vercel.json        # Vercel configuration
└── package.json       # Dependencies
```

## 🔒 Security Notes

- Never commit `.env` files to Git
- The `.gitignore` file excludes sensitive files
- Use environment variables for all API keys
- Supabase RLS (Row Level Security) is enabled for data protection

## 📚 Documentation

- `CHALLENGE_CRON_SETUP.md` - Challenge system setup
- `GAMIFICATION_SETUP.md` - Gamification features
- `FOLLOW_SYSTEM_SETUP.md` - Social follow system
- `NOTIFICATION_SYSTEM_README.md` - Notification system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues and questions, please open an issue on GitHub.
