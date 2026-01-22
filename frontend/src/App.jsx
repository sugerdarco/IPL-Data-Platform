import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import Players from './pages/Players'
import PlayerDetail from './pages/PlayerDetail'
import Matches from './pages/Matches'
import MatchDetail from './pages/MatchDetail'
import BettingDashboard from './pages/BettingDashboard'
import MatchPredictor from './pages/MatchPredictor'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:id" element={<TeamDetail />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/:id" element={<PlayerDetail />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:id" element={<MatchDetail />} />
        <Route path="/betting" element={<BettingDashboard />} />
        <Route path="/betting/predictor" element={<MatchPredictor />} />
      </Routes>
    </Layout>
  )
}

export default App

