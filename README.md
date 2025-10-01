# Football Analytics Platform - Frontend

React TypeScript frontend for the Football Analytics SaaS platform connecting sports teams with analytics consultants.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Routing**: React Router v7
- **Authentication**: Supabase Auth
- **API Client**: Axios
- **Charts**: Recharts
- **Real-time**: Socket.IO Client
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account and project

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key
REACT_APP_API_BASE_URL=https://your-backend.railway.app
REACT_APP_ENVIRONMENT=development
```

### Development

```bash
npm start
```

Runs on http://localhost:3001

### Build

```bash
npm run build
```

Creates optimized production build in `/build` directory.

### Testing

```bash
npm test
```

## Project Structure

```
src/
├── components/      # React components
│   ├── TeamDashboard.tsx
│   ├── ConsultantDashboard.tsx
│   └── ...
├── context/         # React context providers
│   └── AuthContext.tsx
├── services/        # API and service layers
│   ├── api.ts
│   ├── auth.ts
│   └── ...
├── types/           # TypeScript type definitions
│   └── auth.ts
├── lib/             # External library configs
│   └── supabase.ts
└── App.tsx
```

## Features

- 🔐 Team & Consultant authentication with Supabase
- 📊 Game data upload and analysis
- 📈 Custom chart builder
- 🤝 Real-time collaboration
- 🤖 AI-powered analytics assistance
- 📱 Responsive design

## Deployment

### Vercel

1. Import project from GitHub
2. Select `football-analytics-frontend` repository
3. Configure environment variables in Vercel dashboard
4. Deploy

Vercel will automatically:
- Install dependencies
- Run build command
- Deploy to CDN
- Configure custom domain

## Related Repositories

- **Backend**: [football-analytics-backend](https://github.com/yourusername/football-analytics-backend)

## License

Private - All rights reserved