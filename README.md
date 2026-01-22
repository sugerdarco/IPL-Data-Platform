# IPL 2022 Full-Stack Analytics Application

A comprehensive full-stack web application for IPL 2022 cricket analytics, featuring a Node.js/Express backend with PostgreSQL (Supabase) and a React frontend with beautiful visualizations.

![IPL Analytics](https://images.entitysport.com/assets/uploads/2022/03/IPL-2022-Logo.png)

## 📊 Features

### Backend (Node.js/Express)
- **RESTful API** with JSON responses
- **Pagination & Filtering** on all list endpoints
- **OpenAPI/Swagger Documentation** at `/api-docs`
- **Health Check Endpoint** at `/health`
- **Prisma ORM** for PostgreSQL/Supabase
- **Error Handling** with meaningful error messages
- **CORS Enabled** for frontend integration

### Frontend (React/Vite)
- **4 Main Pages**: Dashboard, Teams, Players, Matches
- **2 Interactive Charts**: 
  - Runs per Match (Bar Chart)
  - Team Wins Distribution (Pie Chart)
- **Standings Table** with sorting and filtering
- **Loading, Empty, and Error States** throughout
- **Responsive Design** with mobile support
- **Modern UI** with Tailwind CSS and Framer Motion

### Dataset
- **10 Teams** with logos and metadata
- **74 Matches** with complete details
- **247+ Players** with career statistics
- **148 Innings** with ball-by-ball data
- **Batting & Bowling Statistics**
- **League Standings** and points table

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Backend | Node.js, Express |
| API Docs | Swagger/OpenAPI |
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Animation | Framer Motion |
| Icons | Lucide React |
| HTTP Client | Axios |

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account (free tier works)

### 1. Clone and Install

```bash
# Install all dependencies (root + backend + frontend)
npm run install:all
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection string
3. Copy the connection strings

### 3. Configure Environment Variables

Create `.env` file in the root directory:

```env
# Supabase PostgreSQL connection
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

Create `.env` file in the `backend` directory:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
PORT=3001
```

### 4. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed the database with IPL data
npm run seed
```

### 5. Run the Application

```bash
# Run both backend and frontend concurrently
npm run dev
```

Or run them separately:

```bash
# Terminal 1: Backend (http://localhost:3001)
npm run backend:dev

# Terminal 2: Frontend (http://localhost:5173)
npm run frontend:dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 📚 API Documentation

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check with DB status |
| GET | `/api/teams` | List all teams (paginated) |
| GET | `/api/teams/:id` | Get team details |
| GET | `/api/teams/:id/players` | Get team players |
| GET | `/api/teams/:id/matches` | Get team matches |
| GET | `/api/players` | List all players (paginated, filterable) |
| GET | `/api/players/:id` | Get player details |
| GET | `/api/players/:id/batting` | Get player batting records |
| GET | `/api/players/:id/bowling` | Get player bowling records |
| GET | `/api/players/top/batsmen` | Get top batsmen |
| GET | `/api/players/top/bowlers` | Get top bowlers |
| GET | `/api/matches` | List all matches (paginated) |
| GET | `/api/matches/:id` | Get match details with scorecard |
| GET | `/api/matches/:id/scorecard` | Get match scorecard |
| GET | `/api/matches/recent/list` | Get recent matches |
| GET | `/api/matches/venues/list` | Get all venues |
| GET | `/api/standings` | Get league standings |
| GET | `/api/standings/rounds` | Get available rounds |
| GET | `/api/stats/overview` | Get tournament overview |
| GET | `/api/stats/batting` | Get batting statistics |
| GET | `/api/stats/bowling` | Get bowling statistics |
| GET | `/api/stats/team-performance` | Get team performance comparison |
| GET | `/api/stats/runs-per-match` | Get runs per match data |
| GET | `/api/stats/top-scorers-by-team` | Get top scorer per team |

### Query Parameters

Most list endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10-20)
- `search` - Search by name (where applicable)

Players endpoint also supports:
- `role` - Filter by role (bat, bowl, all, wk)
- `teamId` - Filter by team

### Example Requests

```bash
# Get all teams
curl http://localhost:3001/api/teams

# Get paginated players
curl http://localhost:3001/api/players?page=1&limit=10

# Get batsmen only
curl http://localhost:3001/api/players?role=bat

# Get match details
curl http://localhost:3001/api/matches/1

# Get tournament overview
curl http://localhost:3001/api/stats/overview
```

## 🎨 Frontend Pages

### 1. Dashboard (`/`)
- Tournament overview statistics
- Runs per match bar chart
- Team wins distribution pie chart
- Top scorer by team cards
- Quick access to other sections

### 2. Teams (`/teams`)
- Points table with standings
- Team cards with win/loss records
- Click to view team details
- Form indicator (W/L history)

### 3. Team Detail (`/teams/:id`)
- Team profile and stats
- Squad list with player roles
- Recent matches
- Win percentage and run totals

### 4. Players (`/players`)
- All players table with pagination
- Search and role filtering
- Top batsmen leaderboard with chart
- Top bowlers leaderboard with chart

### 5. Player Detail (`/players/:id`)
- Player profile and role
- Career statistics (batting/bowling)
- Match-by-match performance table
- Total runs, wickets, high score

### 6. Matches (`/matches`)
- Match cards with scores
- Team logos and results
- Venue and date information
- Pagination

### 7. Match Detail (`/matches/:id`)
- Full scorecard
- Innings tabs
- Batting and bowling tables
- Fall of wickets

## 📁 Project Structure

```
bhuvi-project/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── teams.js
│   │   │   ├── players.js
│   │   │   ├── matches.js
│   │   │   ├── standings.js
│   │   │   └── stats.js
│   │   └── server.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Teams.jsx
│   │   │   ├── TeamDetail.jsx
│   │   │   ├── Players.jsx
│   │   │   ├── PlayerDetail.jsx
│   │   │   ├── Matches.jsx
│   │   │   └── MatchDetail.jsx
│   │   ├── api/
│   │   │   └── index.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── prisma/
│   └── schema.prisma
├── scripts/
│   └── seed.js
├── Indian_Premier_League_2022-03-26/
│   └── [JSON data files]
├── package.json
└── README.md
```

## 🚢 Deployment

### Frontend (Vercel/Netlify)

1. Build the frontend:
```bash
npm run frontend:build
```

2. Deploy the `frontend/dist` folder to:
   - [Vercel](https://vercel.com)
   - [Netlify](https://netlify.com)
   - [Cloudflare Pages](https://pages.cloudflare.com)

3. Set the `VITE_API_URL` environment variable to your backend URL.

### Backend (Railway/Render/Fly.io)

1. Deploy the `backend` folder
2. Set environment variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `PORT`

### Database

Supabase provides free hosted PostgreSQL that works great for this project.

## 🔧 Development

### Running Tests

```bash
# Run backend tests (if added)
cd backend && npm test

# Run frontend tests (if added)
cd frontend && npm test
```

### Linting

```bash
# Frontend linting
cd frontend && npm run lint
```

### Database Management

```bash
# Open Prisma Studio
npm run prisma:studio

# Generate new migration
npx prisma migrate dev

# Reset database
npx prisma migrate reset
```

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🙏 Acknowledgments

- IPL data sourced from public APIs
- Built with Prisma, Express, React, and Tailwind CSS
- Icons from Lucide React
- Charts by Recharts
