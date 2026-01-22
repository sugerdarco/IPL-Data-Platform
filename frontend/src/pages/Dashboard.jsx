import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { 
  Trophy, Users, Calendar, Target, Zap, Award, TrendingUp, Star
} from 'lucide-react'
import * as api from '../api'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'

const TEAM_COLORS = {
  'GT': '#1C2951',
  'RR': '#EA1A85',
  'LSG': '#A4DE02',
  'RCB': '#EC1C24',
  'DC': '#0078BC',
  'PBKS': '#ED1B24',
  'KKR': '#3A225D',
  'SRH': '#FF822A',
  'CSK': '#FFCB05',
  'MI': '#004BA0'
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [overview, setOverview] = useState(null)
  const [teamPerformance, setTeamPerformance] = useState([])
  const [runsPerMatch, setRunsPerMatch] = useState([])
  const [topScorers, setTopScorers] = useState([])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [overviewRes, perfRes, runsRes, scorersRes] = await Promise.all([
        api.getOverviewStats(),
        api.getTeamPerformance(),
        api.getRunsPerMatch(),
        api.getTopScorersByTeam()
      ])

      setOverview(overviewRes.data)
      setTeamPerformance(perfRes.data)
      setRunsPerMatch(runsRes.data)
      setTopScorers(scorersRes.data)
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading dashboard..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  const pieData = teamPerformance.slice(0, 8).map(team => ({
    name: team.team.abbr,
    value: team.win,
    fill: TEAM_COLORS[team.team.abbr] || '#004BA0'
  }))

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-ipl-navy via-ipl-blue/50 to-ipl-navy p-8 md:p-12 border border-ipl-gold/20"
      >
        <div className="relative z-10">
          <h1 className="font-display text-4xl md:text-6xl text-white mb-2 tracking-wide">
            IPL <span className="gradient-text">2022</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            Complete analytics and insights from the Indian Premier League 2022 season. 
            Explore team performances, player statistics, and match results.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link
              to="/teams"
              className="px-6 py-3 bg-ipl-gold text-ipl-navy font-semibold rounded-lg hover:bg-ipl-gold/90 transition-colors"
            >
              View Teams
            </Link>
            <Link
              to="/players"
              className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
            >
              Top Players
            </Link>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-ipl-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 border-4 border-ipl-gold/20 rounded-full" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 border-4 border-ipl-gold/10 rounded-full" />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Matches"
          value={overview?.totalMatches || 0}
          icon={Calendar}
          color="blue"
          delay={0}
        />
        <StatCard
          title="Teams"
          value={overview?.totalTeams || 0}
          icon={Trophy}
          color="gold"
          delay={1}
        />
        <StatCard
          title="Players"
          value={overview?.totalPlayers || 0}
          icon={Users}
          color="teal"
          delay={2}
        />
        <StatCard
          title="Total Runs"
          value={(overview?.totalRuns || 0).toLocaleString()}
          icon={Target}
          color="orange"
          delay={3}
        />
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {overview?.highestScore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-6 border border-ipl-gold/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-ipl-gold/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-ipl-gold" />
              </div>
              <span className="text-sm text-gray-400 font-medium">Highest Score</span>
            </div>
            <p className="text-3xl font-display text-white mb-1">
              {overview.highestScore.runs}
              <span className="text-lg text-gray-500">({overview.highestScore.balls})</span>
            </p>
            <p className="text-sm text-ipl-gold">{overview.highestScore.player}</p>
            <p className="text-xs text-gray-500 mt-1">{overview.highestScore.match}</p>
          </motion.div>
        )}

        {overview?.bestBowling && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-2xl p-6 border border-ipl-blue/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-ipl-blue/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-ipl-blue" />
              </div>
              <span className="text-sm text-gray-400 font-medium">Best Bowling</span>
            </div>
            <p className="text-3xl font-display text-white mb-1">
              {overview.bestBowling.wickets}/{overview.bestBowling.runs}
              <span className="text-lg text-gray-500">({overview.bestBowling.overs}ov)</span>
            </p>
            <p className="text-sm text-ipl-blue">{overview.bestBowling.player}</p>
            <p className="text-xs text-gray-500 mt-1">{overview.bestBowling.match}</p>
          </motion.div>
        )}

        {overview?.topSixHitter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card rounded-2xl p-6 border border-teal-500/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-teal-400" />
              </div>
              <span className="text-sm text-gray-400 font-medium">Most Sixes</span>
            </div>
            <p className="text-3xl font-display text-white mb-1">
              {overview.topSixHitter.sixes}
              <span className="text-lg text-gray-500"> sixes</span>
            </p>
            <p className="text-sm text-teal-400">{overview.topSixHitter.player}</p>
          </motion.div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Runs Per Match Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card rounded-2xl p-6 border border-ipl-gold/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Runs Per Match</h3>
              <p className="text-sm text-gray-500">Total runs scored in each match</p>
            </div>
            <TrendingUp className="w-5 h-5 text-ipl-gold" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={runsPerMatch.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1f3c" />
                <XAxis 
                  dataKey="matchNumber" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#1a1f3c' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#1a1f3c' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1f3c',
                    border: '1px solid #D4AF37',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelFormatter={(value) => `Match ${value}`}
                  formatter={(value, name, props) => [
                    `${value} runs`,
                    `${props.payload.teamA} vs ${props.payload.teamB}`
                  ]}
                />
                <Bar 
                  dataKey="totalRuns" 
                  fill="#004BA0"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Team Wins Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card rounded-2xl p-6 border border-ipl-gold/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Wins by Team</h3>
              <p className="text-sm text-gray-500">Match wins distribution</p>
            </div>
            <Trophy className="w-5 h-5 text-ipl-gold" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: '#6b7280' }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1f3c',
                    border: '1px solid #D4AF37',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`${value} wins`, 'Matches Won']}
                />
                <Legend 
                  wrapperStyle={{ color: '#9ca3af' }}
                  formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Top Scorers by Team */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="glass-card rounded-2xl p-6 border border-ipl-gold/10"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Top Scorer by Team</h3>
            <p className="text-sm text-gray-500">Highest run-scorer from each franchise</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {topScorers.slice(0, 10).map((item, index) => (
            <motion.div
              key={item.team}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + index * 0.05 }}
              className="relative overflow-hidden rounded-xl p-4 text-center"
              style={{ 
                background: `linear-gradient(135deg, ${TEAM_COLORS[item.team] || '#004BA0'}20, transparent)`,
                border: `1px solid ${TEAM_COLORS[item.team] || '#004BA0'}40`
              }}
            >
              <p 
                className="font-display text-2xl mb-1"
                style={{ color: TEAM_COLORS[item.team] || '#004BA0' }}
              >
                {item.team}
              </p>
              {item.topScorer && (
                <>
                  <p className="text-white text-sm font-medium truncate">
                    {item.topScorer.name}
                  </p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {item.topScorer.runs}
                  </p>
                  <p className="text-xs text-gray-500">runs</p>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

