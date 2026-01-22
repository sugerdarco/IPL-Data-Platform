import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Health check
export const getHealth = () => api.get('/health')

// Teams
export const getTeams = (params) => api.get('/teams', { params })
export const getTeam = (id) => api.get(`/teams/${id}`)
export const getTeamPlayers = (id) => api.get(`/teams/${id}/players`)
export const getTeamMatches = (id, params) => api.get(`/teams/${id}/matches`, { params })

// Players
export const getPlayers = (params) => api.get('/players', { params })
export const getPlayer = (id) => api.get(`/players/${id}`)
export const getPlayerBatting = (id) => api.get(`/players/${id}/batting`)
export const getPlayerBowling = (id) => api.get(`/players/${id}/bowling`)
export const getTopBatsmen = (params) => api.get('/players/top/batsmen', { params })
export const getTopBowlers = (params) => api.get('/players/top/bowlers', { params })

// Matches
export const getMatches = (params) => api.get('/matches', { params })
export const getMatch = (id) => api.get(`/matches/${id}`)
export const getMatchScorecard = (id) => api.get(`/matches/${id}/scorecard`)
export const getRecentMatches = (params) => api.get('/matches/recent/list', { params })
export const getVenues = () => api.get('/matches/venues/list')
export const getMatchWagonWheel = (id, params) => api.get(`/matches/${id}/wagon-wheel`, { params })
export const getMatchCommentary = (id, params) => api.get(`/matches/${id}/commentary`, { params })
export const getMatchHighlights = (id) => api.get(`/matches/${id}/highlights`)

// Standings
export const getStandings = (params) => api.get('/standings', { params })
export const getStandingRounds = () => api.get('/standings/rounds')
export const getTeamStanding = (teamId) => api.get(`/standings/team/${teamId}`)

// Stats
export const getOverviewStats = () => api.get('/stats/overview')
export const getBattingStats = (params) => api.get('/stats/batting', { params })
export const getBowlingStats = (params) => api.get('/stats/bowling', { params })
export const getTeamPerformance = () => api.get('/stats/team-performance')
export const getRunsPerMatch = () => api.get('/stats/runs-per-match')
export const getTopScorersByTeam = () => api.get('/stats/top-scorers-by-team')

// Betting Analytics
export const getBettingOverview = () => api.get('/betting/overview')
export const getBettingTeams = () => api.get('/betting/teams')
export const getBettingTeam = (abbr) => api.get(`/betting/teams/${abbr}`)
export const getBettingPlayers = (params) => api.get('/betting/players', { params })
export const getBettingScenarios = () => api.get('/betting/scenarios')
export const getRiskAssessment = () => api.get('/betting/risk-assessment')
export const getMatchPrediction = (teamA, teamB, battingFirst) => 
  api.get('/betting/match-predictor', { params: { teamA, teamB, battingFirst } })

export default api

