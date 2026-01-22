const express = require('express');
const router = express.Router();

// Betting strategy data based on IPL 2022 analysis
const TEAM_BETTING_DATA = {
  'GT': {
    abbr: 'GT',
    name: 'Gujarat Titans',
    winRate: 75.0,
    chasingWinRate: 78,
    battingFirstWinRate: 71,
    avgScore: 166.4,
    recommendation: 'STRONG_BET',
    strategy: 'Always bet on GT when chasing (78% win rate)',
    riskLevel: 1, // 1-5, lower is safer
    tips: [
      'Best team when chasing targets 160-180',
      'Hardik Pandya key for middle overs acceleration',
      'David Miller finishes games (9 not-outs)',
    ]
  },
  'RR': {
    abbr: 'RR',
    name: 'Rajasthan Royals',
    winRate: 62.5,
    chasingWinRate: 57,
    battingFirstWinRate: 67,
    avgScore: 183.9,
    recommendation: 'GOOD_BET',
    strategy: 'Bet on RR batting first - highest scoring team (183.9 avg)',
    riskLevel: 2,
    tips: [
      'Jos Buttler 47% big score conversion rate',
      'RR Total Over 175 when batting first (68% probability)',
      'Shimron Hetmyer excellent finisher (10 not-outs)',
    ]
  },
  'LSG': {
    abbr: 'LSG',
    name: 'Lucknow Super Giants',
    winRate: 52.9,
    chasingWinRate: 71,
    battingFirstWinRate: 57,
    avgScore: 149.9,
    recommendation: 'MODERATE_BET',
    strategy: 'LSG better when chasing (71% win rate)',
    riskLevel: 2,
    tips: [
      'KL Rahul + Quinton de Kock strongest opening pair',
      'Opening partnership 60+ sets up wins',
      'Good for chasing targets 160-180',
    ]
  },
  'RCB': {
    abbr: 'RCB',
    name: 'Royal Challengers Bangalore',
    winRate: 56.3,
    chasingWinRate: 67,
    battingFirstWinRate: 50,
    avgScore: 164.5,
    recommendation: 'MODERATE_BET',
    strategy: 'Better when chasing, high volatility team',
    riskLevel: 3,
    tips: [
      'Dinesh Karthik 183.33 SR in death overs',
      'Avoid "to bat full 20 overs" bets',
      'High collapse risk (scored 68 all out once)',
    ]
  },
  'DC': {
    abbr: 'DC',
    name: 'Delhi Capitals',
    winRate: 50.0,
    chasingWinRate: 57,
    battingFirstWinRate: 43,
    avgScore: 167.2,
    recommendation: 'NEUTRAL',
    strategy: 'Slightly better chasing, David Warner key',
    riskLevel: 3,
    tips: [
      'David Warner 42% fifty conversion rate',
      'Prithvi Shaw explosive opener (152.97 SR)',
      'Mid-table team - avoid in big stakes',
    ]
  },
  'PBKS': {
    abbr: 'PBKS',
    name: 'Punjab Kings',
    winRate: 50.0,
    chasingWinRate: 57,
    battingFirstWinRate: 43,
    avgScore: 167.4,
    recommendation: 'NEUTRAL',
    strategy: 'Inconsistent team, Livingstone key for sixes',
    riskLevel: 3,
    tips: [
      'Liam Livingstone 3.4 sixes per match',
      'Good for "most sixes" player bets',
      'Inconsistent - avoid team win bets',
    ]
  },
  'KKR': {
    abbr: 'KKR',
    name: 'Kolkata Knight Riders',
    winRate: 42.9,
    chasingWinRate: 50,
    battingFirstWinRate: 43,
    avgScore: 158.8,
    recommendation: 'AVOID',
    strategy: 'Below average team, avoid betting',
    riskLevel: 4,
    tips: [
      'Andre Russell explosive but inconsistent',
      'Shreyas Iyer anchor but low SR',
      'Better to bet against KKR vs top 4',
    ]
  },
  'SRH': {
    abbr: 'SRH',
    name: 'Sunrisers Hyderabad',
    winRate: 42.9,
    chasingWinRate: 50,
    battingFirstWinRate: 43,
    avgScore: 156.9,
    recommendation: 'AVOID',
    strategy: 'Weak batting, worst NRR in bottom half',
    riskLevel: 4,
    tips: [
      'Aiden Markram only reliable bat (47.63 avg)',
      'Poor death overs batting',
      'Avoid team bets, consider individual player bets',
    ]
  },
  'CSK': {
    abbr: 'CSK',
    name: 'Chennai Super Kings',
    winRate: 28.6,
    chasingWinRate: 29,
    battingFirstWinRate: 29,
    avgScore: 163.4,
    recommendation: 'STRONG_AVOID',
    strategy: 'Worst season ever - always bet AGAINST CSK',
    riskLevel: 5,
    tips: [
      'Only 4 wins in season',
      'Bet AGAINST CSK vs any top 4 team',
      'High collapse risk - 2 all-out scores',
    ]
  },
  'MI': {
    abbr: 'MI',
    name: 'Mumbai Indians',
    winRate: 28.6,
    chasingWinRate: 29,
    battingFirstWinRate: 29,
    avgScore: 158.4,
    recommendation: 'STRONG_AVOID',
    strategy: 'Defending champions collapsed - bet AGAINST MI',
    riskLevel: 5,
    tips: [
      'Worst NRR (-0.506) indicates heavy defeats',
      'Only 4 wins - worst ever MI season',
      'Suryakumar Yadav only bright spot',
    ]
  }
};

// Player betting data
const TOP_PLAYER_BETS = [
  {
    id: 1,
    name: 'Jos Buttler',
    team: 'RR',
    role: 'Opener',
    runs: 863,
    average: 57.53,
    strikeRate: 149.05,
    centuries: 4,
    fifties: 4,
    sixes: 45,
    fours: 83,
    bigScoreRate: 47.1, // Percentage of innings with 50+
    sixesPerMatch: 2.65,
    foursPerMatch: 4.88,
    bettingTips: [
      { type: 'To score 50+', probability: 47, risk: 'LOW', stars: 5 },
      { type: 'To score century', probability: 23.5, risk: 'MEDIUM', stars: 4 },
      { type: 'Top team batsman', probability: 42, risk: 'LOW', stars: 5 },
      { type: 'To hit 3+ sixes', probability: 45, risk: 'LOW', stars: 4 },
      { type: 'Most match sixes', probability: 38, risk: 'MEDIUM', stars: 4 },
    ],
    verdict: 'ELITE - Safest batting bet in tournament'
  },
  {
    id: 2,
    name: 'KL Rahul',
    team: 'LSG',
    role: 'Opener',
    runs: 616,
    average: 51.33,
    strikeRate: 135.38,
    centuries: 2,
    fifties: 4,
    sixes: 30,
    fours: 45,
    bigScoreRate: 40.0,
    sixesPerMatch: 2.0,
    foursPerMatch: 3.0,
    bettingTips: [
      { type: 'To score 50+', probability: 40, risk: 'LOW', stars: 4 },
      { type: 'To score century', probability: 13.3, risk: 'HIGH', stars: 3 },
      { type: 'Top team batsman', probability: 38, risk: 'LOW', stars: 4 },
      { type: 'Opening partnership 60+', probability: 52, risk: 'MEDIUM', stars: 4 },
    ],
    verdict: 'EXCELLENT - Consistent anchor batsman'
  },
  {
    id: 3,
    name: 'David Miller',
    team: 'GT',
    role: 'Finisher',
    runs: 481,
    average: 68.71,
    strikeRate: 142.73,
    centuries: 0,
    fifties: 2,
    sixes: 23,
    fours: 32,
    bigScoreRate: 12.5,
    notOuts: 9,
    bettingTips: [
      { type: 'To remain not out', probability: 60, risk: 'LOW', stars: 5 },
      { type: 'To score 25+ (death overs)', probability: 45, risk: 'LOW', stars: 4 },
      { type: 'To hit 2+ sixes', probability: 40, risk: 'MEDIUM', stars: 3 },
    ],
    verdict: 'ELITE FINISHER - Best "not out" bet'
  },
  {
    id: 4,
    name: 'Dinesh Karthik',
    team: 'RCB',
    role: 'Death Specialist',
    runs: 330,
    average: 55.0,
    strikeRate: 183.33,
    centuries: 0,
    fifties: 0,
    sixes: 19,
    fours: 25,
    notOuts: 10,
    bettingTips: [
      { type: 'Highest score in death overs', probability: 35, risk: 'MEDIUM', stars: 4 },
      { type: 'To remain not out', probability: 60, risk: 'LOW', stars: 5 },
      { type: 'To score 25+ in last 5 overs', probability: 45, risk: 'MEDIUM', stars: 4 },
    ],
    verdict: 'DEATH SPECIALIST - Best SR in tournament (183.33)'
  },
  {
    id: 5,
    name: 'David Warner',
    team: 'DC',
    role: 'Opener',
    runs: 432,
    average: 48.0,
    strikeRate: 150.69,
    centuries: 0,
    fifties: 5,
    sixes: 18,
    fours: 52,
    bigScoreRate: 41.7,
    bettingTips: [
      { type: 'To score 50+', probability: 42, risk: 'LOW', stars: 4 },
      { type: 'Top team batsman', probability: 40, risk: 'LOW', stars: 4 },
      { type: 'To score 35+ in powerplay', probability: 32, risk: 'MEDIUM', stars: 3 },
    ],
    verdict: 'EXCELLENT - Aggressive opener, consistent performer'
  },
  {
    id: 6,
    name: 'Quinton de Kock',
    team: 'LSG',
    role: 'Opener',
    runs: 508,
    average: 36.29,
    strikeRate: 148.97,
    centuries: 1,
    fifties: 3,
    sixes: 23,
    fours: 47,
    bettingTips: [
      { type: 'To score 40+ in powerplay', probability: 35, risk: 'MEDIUM', stars: 3 },
      { type: 'Opening partnership 60+ (with Rahul)', probability: 40, risk: 'MEDIUM', stars: 4 },
    ],
    verdict: 'GOOD - Explosive opener, pairs well with Rahul'
  },
  {
    id: 7,
    name: 'Liam Livingstone',
    team: 'PBKS',
    role: 'Power Hitter',
    runs: 213,
    average: 26.63,
    strikeRate: 182.08,
    centuries: 0,
    fifties: 1,
    sixes: 34,
    fours: 11,
    sixesPerMatch: 3.4,
    bettingTips: [
      { type: 'To hit 4+ sixes', probability: 28, risk: 'MEDIUM', stars: 4 },
      { type: 'Most sixes in match', probability: 45, risk: 'MEDIUM', stars: 4 },
    ],
    verdict: 'SIX-HITTING SPECIALIST - Best for boundary bets'
  },
  {
    id: 8,
    name: 'Hardik Pandya',
    team: 'GT',
    role: 'All-rounder',
    runs: 487,
    average: 44.27,
    strikeRate: 131.27,
    centuries: 0,
    fifties: 4,
    sixes: 12,
    fours: 49,
    bettingTips: [
      { type: 'Man of the Match', probability: 33, risk: 'MEDIUM', stars: 4 },
      { type: 'To score 30+', probability: 45, risk: 'LOW', stars: 4 },
      { type: 'To take 1+ wicket', probability: 40, risk: 'MEDIUM', stars: 3 },
    ],
    verdict: 'ALL-ROUNDER VALUE - Good for MOTM bets'
  }
];

// Match scenario betting strategies
const MATCH_SCENARIOS = [
  {
    scenario: 'GT chasing 160-180',
    winProbability: 78,
    recommendation: 'BET_GT',
    confidence: 'HIGH',
    reasoning: 'GT has 78% win rate when chasing. Strong middle order with Miller and Pandya.',
  },
  {
    scenario: 'RR batting first',
    expectedTotal: '175+',
    probability: 68,
    recommendation: 'BET_OVER_175',
    confidence: 'HIGH',
    reasoning: 'RR averages 183.9 runs/match. Buttler-led attack is explosive.',
  },
  {
    scenario: 'RCB vs MI/CSK',
    winProbability: 75,
    recommendation: 'BET_RCB',
    confidence: 'HIGH',
    reasoning: 'MI and CSK only won 28.6% of matches. RCB favored against bottom teams.',
  },
  {
    scenario: 'Any team scores 200+',
    probability: 8,
    recommendation: 'AVOID',
    confidence: 'HIGH',
    reasoning: 'Only 1 score of 220+ in tournament. Very rare event.',
  },
  {
    scenario: 'Team all out under 100',
    probability: 5,
    recommendation: 'AVOID',
    confidence: 'HIGH',
    reasoning: 'Only 4 occurrences in 74 matches. Rare but devastating when happens.',
  },
  {
    scenario: 'Buttler to score 50+',
    probability: 47,
    recommendation: 'STRONG_BET',
    confidence: 'VERY_HIGH',
    reasoning: 'Buttler scored 50+ in 47% of innings. Safest player performance bet.',
  },
  {
    scenario: 'Miller to remain not out',
    probability: 60,
    recommendation: 'STRONG_BET',
    confidence: 'VERY_HIGH',
    reasoning: 'Miller remained not out in 9 of 16 innings. Elite finisher.',
  },
  {
    scenario: 'Death overs (16-20) 60+ runs',
    probability: 38,
    recommendation: 'MODERATE_BET',
    confidence: 'MEDIUM',
    reasoning: 'Depends on finishers at crease. RCB with Karthik most likely.',
  }
];

// Risk categories
const RISK_CATEGORIES = {
  SAFE_BETS: [
    { bet: 'Buttler to score 50+', probability: 47, team: 'RR', stars: 5 },
    { bet: 'GT to win when chasing', probability: 78, team: 'GT', stars: 5 },
    { bet: 'RR Total Over 175', probability: 68, team: 'RR', stars: 4 },
    { bet: 'Miller to remain not out', probability: 60, team: 'GT', stars: 5 },
    { bet: 'LSG opening partnership 60+', probability: 52, team: 'LSG', stars: 4 },
  ],
  VALUE_BETS: [
    { bet: 'Karthik highest in death overs', probability: 35, team: 'RCB', stars: 4 },
    { bet: 'Livingstone 4+ sixes', probability: 28, team: 'PBKS', stars: 4 },
    { bet: 'Rajat Patidar to score 50+', probability: 30, team: 'RCB', stars: 3 },
    { bet: 'GT vs RR close match (<15 runs)', probability: 40, team: 'GT/RR', stars: 3 },
  ],
  AVOID_BETS: [
    { bet: 'MI to win vs Top 4', probability: 15, team: 'MI', reason: 'Worst season' },
    { bet: 'CSK to win vs Top 4', probability: 18, team: 'CSK', reason: 'Collapsed' },
    { bet: 'Any team to score 220+', probability: 8, team: 'Any', reason: 'Very rare' },
    { bet: 'Virat Kohli to score 50+', probability: 12, team: 'RCB', reason: 'Poor form' },
  ]
};

/**
 * @swagger
 * /api/betting/overview:
 *   get:
 *     summary: Get betting overview with key insights
 *     tags: [Betting]
 *     responses:
 *       200:
 *         description: Betting overview data
 */
router.get('/overview', async (req, res, next) => {
  try {
    res.json({
      topBets: RISK_CATEGORIES.SAFE_BETS.slice(0, 5),
      valueBets: RISK_CATEGORIES.VALUE_BETS.slice(0, 3),
      avoidBets: RISK_CATEGORIES.AVOID_BETS.slice(0, 3),
      keyInsights: [
        { icon: 'trophy', title: 'Best Team Bet', value: 'GT when chasing', probability: '78%' },
        { icon: 'user', title: 'Best Player Bet', value: 'Buttler 50+', probability: '47%' },
        { icon: 'target', title: 'Best Finisher Bet', value: 'Miller not out', probability: '60%' },
        { icon: 'zap', title: 'Best Boundary Bet', value: 'Livingstone sixes', probability: '45%' },
      ],
      tournamentStats: {
        totalMatches: 74,
        totalCenturies: 8,
        centuryRate: '5.4%',
        avgMatchScore: 165,
        highestScore: '222/2 (RR)',
        lowestScore: '68/10 (RCB)',
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/betting/teams:
 *   get:
 *     summary: Get team betting strategies
 *     tags: [Betting]
 *     responses:
 *       200:
 *         description: Team betting data
 */
router.get('/teams', async (req, res, next) => {
  try {
    const teams = Object.values(TEAM_BETTING_DATA).sort((a, b) => a.riskLevel - b.riskLevel);
    res.json(teams);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/betting/teams/:abbr:
 *   get:
 *     summary: Get specific team betting strategy
 *     tags: [Betting]
 *     parameters:
 *       - in: path
 *         name: abbr
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team betting details
 */
router.get('/teams/:abbr', async (req, res, next) => {
  try {
    const abbr = req.params.abbr.toUpperCase();
    const team = TEAM_BETTING_DATA[abbr];
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/betting/players:
 *   get:
 *     summary: Get top player betting recommendations
 *     tags: [Betting]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Player betting data
 */
router.get('/players', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    res.json(TOP_PLAYER_BETS.slice(0, limit));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/betting/scenarios:
 *   get:
 *     summary: Get match scenario betting strategies
 *     tags: [Betting]
 *     responses:
 *       200:
 *         description: Match scenario betting data
 */
router.get('/scenarios', async (req, res, next) => {
  try {
    res.json(MATCH_SCENARIOS);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/betting/risk-assessment:
 *   get:
 *     summary: Get risk assessment for different bet types
 *     tags: [Betting]
 *     responses:
 *       200:
 *         description: Risk categorized bets
 */
router.get('/risk-assessment', async (req, res, next) => {
  try {
    res.json(RISK_CATEGORIES);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/betting/match-predictor:
 *   get:
 *     summary: Get match prediction based on teams
 *     tags: [Betting]
 *     parameters:
 *       - in: query
 *         name: teamA
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: teamB
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: battingFirst
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match prediction
 */
router.get('/match-predictor', async (req, res, next) => {
  try {
    const teamA = req.query.teamA?.toUpperCase();
    const teamB = req.query.teamB?.toUpperCase();
    const battingFirst = req.query.battingFirst?.toUpperCase();
    
    if (!teamA || !teamB) {
      return res.status(400).json({ error: 'Both teamA and teamB are required' });
    }
    
    const teamAData = TEAM_BETTING_DATA[teamA];
    const teamBData = TEAM_BETTING_DATA[teamB];
    
    if (!teamAData || !teamBData) {
      return res.status(404).json({ error: 'One or both teams not found' });
    }
    
    // Calculate win probabilities based on scenarios
    let teamAWinProb, teamBWinProb;
    
    if (battingFirst === teamA) {
      // Team A batting first
      teamAWinProb = teamAData.battingFirstWinRate;
      teamBWinProb = teamBData.chasingWinRate;
    } else if (battingFirst === teamB) {
      // Team B batting first
      teamAWinProb = teamAData.chasingWinRate;
      teamBWinProb = teamBData.battingFirstWinRate;
    } else {
      // No batting first specified - use overall win rates
      teamAWinProb = teamAData.winRate;
      teamBWinProb = teamBData.winRate;
    }
    
    // Normalize probabilities
    const total = teamAWinProb + teamBWinProb;
    const normalizedA = Math.round((teamAWinProb / total) * 100);
    const normalizedB = 100 - normalizedA;
    
    const favorite = normalizedA > normalizedB ? teamAData : teamBData;
    const underdog = normalizedA > normalizedB ? teamBData : teamAData;
    
    res.json({
      teamA: {
        ...teamAData,
        winProbability: normalizedA,
      },
      teamB: {
        ...teamBData,
        winProbability: normalizedB,
      },
      prediction: {
        favorite: favorite.abbr,
        favoriteWinProb: Math.max(normalizedA, normalizedB),
        underdog: underdog.abbr,
        upsetPotential: Math.min(normalizedA, normalizedB) > 35 ? 'HIGH' : 'LOW',
        recommendation: favorite.riskLevel <= 2 ? `BET_${favorite.abbr}` : 'CAUTION',
        reasoning: `${favorite.name} has ${favorite.winRate}% overall win rate vs ${underdog.name}'s ${underdog.winRate}%`,
      },
      bettingTips: [
        `${favorite.abbr} favored with ${Math.max(normalizedA, normalizedB)}% probability`,
        battingFirst ? `Batting first: ${battingFirst}` : 'Toss outcome will affect odds',
        ...favorite.tips.slice(0, 2),
      ]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

