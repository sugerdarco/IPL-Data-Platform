import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'
import { Users, Search, Filter, TrendingUp } from 'lucide-react'
import * as api from '../api'
import DataTable from '../components/DataTable'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'

export default function Players() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [players, setPlayers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [topBatsmen, setTopBatsmen] = useState([])
  const [topBowlers, setTopBowlers] = useState([])
  const [activeTab, setActiveTab] = useState('all')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [playersRes, batsmenRes, bowlersRes] = await Promise.all([
        api.getPlayers({ page, limit: 15, search, role }),
        api.getBattingStats({ type: 'most_runs', limit: 10 }),
        api.getBowlingStats({ type: 'top_wicket_takers', limit: 10 })
      ])
      
      setPlayers(playersRes.data.data)
      setPagination(playersRes.data.pagination)
      setTopBatsmen(batsmenRes.data)
      setTopBowlers(bowlersRes.data)
    } catch (err) {
      setError(err.message || 'Failed to load players')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, search, role])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  if (loading && players.length === 0) {
    return <LoadingSpinner size="lg" text="Loading players..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  const columns = [
    {
      header: 'Player',
      accessor: 'title',
      render: (row) => (
        <Link to={`/players/${row.id}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ipl-blue to-ipl-navy flex items-center justify-center text-white font-bold">
            {row.shortName?.charAt(0) || row.title.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-white group-hover:text-ipl-gold transition-colors">
              {row.title}
            </p>
            <p className="text-xs text-gray-500">{row.country}</p>
          </div>
        </Link>
      )
    },
    {
      header: 'Team',
      accessor: 'team',
      render: (row) => (
        <span className="text-gray-400">
          {row.squads?.[0]?.team?.abbr || '-'}
        </span>
      )
    },
    {
      header: 'Role',
      accessor: 'playingRole',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.playingRole === 'bat' ? 'bg-green-500/20 text-green-400' :
          row.playingRole === 'bowl' ? 'bg-blue-500/20 text-blue-400' :
          row.playingRole === 'all' ? 'bg-purple-500/20 text-purple-400' :
          'bg-orange-500/20 text-orange-400'
        }`}>
          {row.playingRole?.toUpperCase() || 'N/A'}
        </span>
      )
    },
    {
      header: 'Runs',
      accessor: 'runs',
      render: (row) => (
        <span className="font-medium text-ipl-gold">
          {row.battingStats?.[0]?.runs || '-'}
        </span>
      )
    },
    {
      header: 'Wickets',
      accessor: 'wickets',
      render: (row) => (
        <span className="font-medium text-ipl-blue">
          {row.bowlingStats?.[0]?.wickets || '-'}
        </span>
      )
    }
  ]

  const batsmenChartData = topBatsmen.map(b => ({
    name: b.player?.shortName || b.player?.title?.split(' ').pop(),
    runs: b.runs,
    team: b.team?.abbr
  }))

  const bowlersChartData = topBowlers.map(b => ({
    name: b.player?.shortName || b.player?.title?.split(' ').pop(),
    wickets: b.wickets,
    team: b.team?.abbr
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-ipl-gold" />
            Players
          </h1>
          <p className="text-gray-400 mt-1">IPL 2022 Player Statistics</p>
        </div>
        
        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-ipl-navy/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold/50 w-full md:w-64"
            />
          </form>
          
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-ipl-navy/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-ipl-gold/50"
          >
            <option value="">All Roles</option>
            <option value="bat">Batsmen</option>
            <option value="bowl">Bowlers</option>
            <option value="all">All-rounders</option>
            <option value="wk">Wicket-keepers</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {['all', 'batsmen', 'bowlers'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-ipl-gold text-ipl-navy'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'all' && (
        <DataTable
          columns={columns}
          data={players}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          emptyMessage="No players found"
        />
      )}

      {activeTab === 'batsmen' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Top Run Scorers Chart */}
          <div className="glass-card rounded-2xl p-6 border border-ipl-gold/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-ipl-gold" />
              Top Run Scorers
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batsmenChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1f3c" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1f3c',
                      border: '1px solid #D4AF37',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value, name, props) => [
                      `${value} runs`,
                      props.payload.team
                    ]}
                  />
                  <Bar 
                    dataKey="runs" 
                    fill="#D4AF37"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Batsmen Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ipl-gold/10 bg-ipl-navy/30">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">Player</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">Team</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">Runs</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">Avg</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">SR</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">50s/100s</th>
                </tr>
              </thead>
              <tbody>
                {topBatsmen.map((stat, index) => (
                  <tr key={stat.id} className="border-b border-white/5 table-row-hover">
                    <td className="px-6 py-4 text-ipl-gold font-bold">{index + 1}</td>
                    <td className="px-6 py-4">
                      <Link to={`/players/${stat.player?.id}`} className="text-white hover:text-ipl-gold">
                        {stat.player?.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{stat.team?.abbr}</td>
                    <td className="px-6 py-4 text-ipl-gold font-bold">{stat.runs}</td>
                    <td className="px-6 py-4 text-gray-300">{stat.average?.toFixed(2) || '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{stat.strikeRate?.toFixed(2) || '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{stat.fifties || 0}/{stat.centuries || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'bowlers' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Top Wicket Takers Chart */}
          <div className="glass-card rounded-2xl p-6 border border-ipl-blue/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-ipl-blue" />
              Top Wicket Takers
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bowlersChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1f3c" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1f3c',
                      border: '1px solid #004BA0',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value, name, props) => [
                      `${value} wickets`,
                      props.payload.team
                    ]}
                  />
                  <Bar 
                    dataKey="wickets" 
                    fill="#004BA0"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bowlers Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ipl-gold/10 bg-ipl-navy/30">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">Player</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">Team</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">Wkts</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">Econ</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">Avg</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400">Best</th>
                </tr>
              </thead>
              <tbody>
                {topBowlers.map((stat, index) => (
                  <tr key={stat.id} className="border-b border-white/5 table-row-hover">
                    <td className="px-6 py-4 text-ipl-blue font-bold">{index + 1}</td>
                    <td className="px-6 py-4">
                      <Link to={`/players/${stat.player?.id}`} className="text-white hover:text-ipl-gold">
                        {stat.player?.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{stat.team?.abbr}</td>
                    <td className="px-6 py-4 text-ipl-blue font-bold">{stat.wickets}</td>
                    <td className="px-6 py-4 text-gray-300">{stat.economy?.toFixed(2) || '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{stat.average?.toFixed(2) || '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{stat.bestInning || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}

