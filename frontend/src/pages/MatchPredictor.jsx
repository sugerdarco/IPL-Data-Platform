import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Target,
  Trophy,
  TrendingUp,
  AlertCircle,
  Zap,
  RefreshCw,
  ChevronDown
} from 'lucide-react'
import * as api from '../api'
import LoadingSpinner from '../components/LoadingSpinner'

const TEAMS = [
  { abbr: 'GT', name: 'Gujarat Titans', color: '#1C2951' },
  { abbr: 'RR', name: 'Rajasthan Royals', color: '#EA1A85' },
  { abbr: 'LSG', name: 'Lucknow Super Giants', color: '#A4DE02' },
  { abbr: 'RCB', name: 'Royal Challengers Bangalore', color: '#EC1C24' },
  { abbr: 'DC', name: 'Delhi Capitals', color: '#0078BC' },
  { abbr: 'PBKS', name: 'Punjab Kings', color: '#ED1B24' },
  { abbr: 'KKR', name: 'Kolkata Knight Riders', color: '#3A225D' },
  { abbr: 'SRH', name: 'Sunrisers Hyderabad', color: '#FF822A' },
  { abbr: 'CSK', name: 'Chennai Super Kings', color: '#FFCB05' },
  { abbr: 'MI', name: 'Mumbai Indians', color: '#004BA0' },
]

const TeamSelector = ({ label, value, onChange, exclude }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectedTeam = TEAMS.find(t => t.abbr === value)
  const availableTeams = TEAMS.filter(t => t.abbr !== exclude)

  return (
    <div className="relative">
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-ipl-gold/30 transition-colors flex items-center justify-between"
      >
        {selectedTeam ? (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: selectedTeam.color }}
            >
              {selectedTeam.abbr}
            </div>
            <span className="text-white font-medium">{selectedTeam.name}</span>
          </div>
        ) : (
          <span className="text-gray-500">Select a team</span>
        )}
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-[100] top-full left-0 right-0 mt-2 bg-ipl-navy backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-xl max-h-80 overflow-y-auto"
          >
            {availableTeams.map((team) => (
              <button
                key={team.abbr}
                onClick={() => {
                  onChange(team.abbr)
                  setIsOpen(false)
                }}
                className="w-full p-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: team.color }}
                >
                  {team.abbr}
                </div>
                <span className="text-white">{team.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MatchPredictor() {
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')
  const [battingFirst, setBattingFirst] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePredict = async () => {
    if (!teamA || !teamB) {
      setError('Please select both teams')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await api.getMatchPrediction(teamA, teamB, battingFirst)
      setPrediction(res.data)
    } catch (err) {
      setError(err.message || 'Failed to get prediction')
    } finally {
      setLoading(false)
    }
  }

  const teamAData = TEAMS.find(t => t.abbr === teamA)
  const teamBData = TEAMS.find(t => t.abbr === teamB)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/betting"
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-display text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-ipl-gold" />
            Match Predictor
          </h1>
          <p className="text-gray-400 mt-1">AI-powered match predictions based on IPL 2022 data</p>
        </div>
      </div>

      {/* Team Selection */}
      <div className="glass-card rounded-2xl p-6 border border-white/5">
        <h2 className="text-lg font-semibold text-white mb-6">Select Teams</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <TeamSelector
            label="Team A"
            value={teamA}
            onChange={setTeamA}
            exclude={teamB}
          />
          <TeamSelector
            label="Team B"
            value={teamB}
            onChange={setTeamB}
            exclude={teamA}
          />
        </div>

        {/* Batting First Selection */}
        {teamA && teamB && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <label className="block text-sm text-gray-400 mb-3">Who is batting first? (Optional)</label>
            <div className="flex gap-4">
              <button
                onClick={() => setBattingFirst(teamA)}
                className={`flex-1 p-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${
                  battingFirst === teamA
                    ? 'border-ipl-gold bg-ipl-gold/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: teamAData?.color }}
                >
                  {teamA}
                </div>
                <span className="text-white">{teamAData?.name}</span>
              </button>
              <button
                onClick={() => setBattingFirst(teamB)}
                className={`flex-1 p-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${
                  battingFirst === teamB
                    ? 'border-ipl-gold bg-ipl-gold/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: teamBData?.color }}
                >
                  {teamB}
                </div>
                <span className="text-white">{teamBData?.name}</span>
              </button>
              <button
                onClick={() => setBattingFirst('')}
                className={`px-4 py-2 rounded-xl border transition-all ${
                  battingFirst === ''
                    ? 'border-ipl-gold bg-ipl-gold/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <span className="text-gray-400">Skip</span>
              </button>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <button
          onClick={handlePredict}
          disabled={!teamA || !teamB || loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-ipl-gold to-ipl-orange text-ipl-dark font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Get Prediction
            </>
          )}
        </button>
      </div>

      {/* Prediction Results */}
      <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Win Probability */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-ipl-gold" />
                Win Probability
              </h2>

              <div className="flex items-center gap-4 mb-6">
                {/* Team A */}
                <div className="flex-1 text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2"
                    style={{ backgroundColor: teamAData?.color }}
                  >
                    {prediction.teamA.abbr}
                  </div>
                  <p className="text-white font-medium">{prediction.teamA.name}</p>
                  <p className={`text-3xl font-display mt-2 ${
                    prediction.teamA.winProbability > 50 ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {prediction.teamA.winProbability}%
                  </p>
                </div>

                {/* VS */}
                <div className="text-2xl font-display text-gray-500">VS</div>

                {/* Team B */}
                <div className="flex-1 text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2"
                    style={{ backgroundColor: teamBData?.color }}
                  >
                    {prediction.teamB.abbr}
                  </div>
                  <p className="text-white font-medium">{prediction.teamB.name}</p>
                  <p className={`text-3xl font-display mt-2 ${
                    prediction.teamB.winProbability > 50 ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {prediction.teamB.winProbability}%
                  </p>
                </div>
              </div>

              {/* Probability Bar */}
              <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${prediction.teamA.winProbability}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="absolute left-0 top-0 h-full rounded-l-full"
                  style={{ backgroundColor: teamAData?.color }}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${prediction.teamB.winProbability}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="absolute right-0 top-0 h-full rounded-r-full"
                  style={{ backgroundColor: teamBData?.color }}
                />
              </div>
            </div>

            {/* Prediction Summary */}
            <div className="glass-card rounded-2xl p-6 border border-ipl-gold/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-ipl-gold/20">
                  <TrendingUp className="w-6 h-6 text-ipl-gold" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Prediction Summary</h2>
                  <p className="text-sm text-gray-400">Based on IPL 2022 performance data</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Favorite</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: TEAMS.find(t => t.abbr === prediction.prediction.favorite)?.color }}
                    >
                      {prediction.prediction.favorite}
                    </div>
                    <span className="text-white font-semibold">
                      {prediction.prediction.favoriteWinProb}% chance
                    </span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Upset Potential</p>
                  <span className={`text-lg font-semibold ${
                    prediction.prediction.upsetPotential === 'HIGH' ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {prediction.prediction.upsetPotential}
                  </span>
                </div>
              </div>

              <p className="text-gray-300 mb-4">{prediction.prediction.reasoning}</p>

              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                prediction.prediction.recommendation.includes('BET')
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {prediction.prediction.recommendation.includes('BET') ? (
                  <Trophy className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="font-medium">{prediction.prediction.recommendation.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Betting Tips */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Betting Tips
              </h2>
              <ul className="space-y-3">
                {prediction.bettingTips?.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-ipl-gold/20 text-ipl-gold flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-300">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Team Details */}
            <div className="grid md:grid-cols-2 gap-6">
              {[prediction.teamA, prediction.teamB].map((team) => (
                <div key={team.abbr} className="glass-card rounded-xl p-5 border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: TEAMS.find(t => t.abbr === team.abbr)?.color }}
                    >
                      {team.abbr}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{team.name}</p>
                      <p className="text-xs text-gray-500">Win Rate: {team.winRate}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Batting First</p>
                      <p className="text-lg font-semibold text-white">{team.battingFirstWinRate}%</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Chasing</p>
                      <p className="text-lg font-semibold text-white">{team.chasingWinRate}%</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400">{team.strategy}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
