const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/stats/overview:
 *   get:
 *     summary: Get tournament overview statistics
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Tournament overview stats
 */
router.get('/overview', async (req, res, next) => {
  try {
    const [
      totalMatches,
      totalTeams,
      totalPlayers,
      competition
    ] = await Promise.all([
      req.prisma.match.count(),
      req.prisma.team.count(),
      req.prisma.player.count(),
      req.prisma.competition.findFirst()
    ]);

    // Get total runs and wickets
    const matchStats = await req.prisma.innings.aggregate({
      _sum: {
        runs: true,
        wickets: true
      }
    });

    // Get highest individual score
    const highestScore = await req.prisma.batsman.findFirst({
      include: {
        player: true,
        innings: {
          include: {
            match: {
              include: {
                teamA: true,
                teamB: true
              }
            }
          }
        }
      },
      orderBy: { runs: 'desc' }
    });

    // Get best bowling figures
    const bestBowling = await req.prisma.bowler.findFirst({
      include: {
        player: true,
        innings: {
          include: {
            match: {
              include: {
                teamA: true,
                teamB: true
              }
            }
          }
        }
      },
      orderBy: [
        { wickets: 'desc' },
        { runsConceded: 'asc' }
      ]
    });

    // Get most sixes
    const mostSixes = await req.prisma.batsman.groupBy({
      by: ['playerId'],
      _sum: { sixes: true },
      orderBy: { _sum: { sixes: 'desc' } },
      take: 1
    });

    let topSixHitter = null;
    if (mostSixes.length > 0) {
      topSixHitter = await req.prisma.player.findUnique({
        where: { id: mostSixes[0].playerId }
      });
      if (topSixHitter) {
        topSixHitter.totalSixes = mostSixes[0]._sum.sixes;
      }
    }

    res.json({
      tournament: competition,
      totalMatches,
      totalTeams,
      totalPlayers,
      totalRuns: matchStats._sum.runs || 0,
      totalWickets: matchStats._sum.wickets || 0,
      highestScore: highestScore && highestScore.player && highestScore.innings?.match ? {
        runs: highestScore.runs,
        balls: highestScore.ballsFaced,
        player: highestScore.player.title,
        match: highestScore.innings.match.shortTitle
      } : null,
      bestBowling: bestBowling && bestBowling.player && bestBowling.innings?.match ? {
        wickets: bestBowling.wickets,
        runs: bestBowling.runsConceded,
        overs: bestBowling.overs,
        player: bestBowling.player.title,
        match: bestBowling.innings.match.shortTitle
      } : null,
      topSixHitter: topSixHitter ? {
        player: topSixHitter.title,
        sixes: topSixHitter.totalSixes
      } : null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/stats/batting:
 *   get:
 *     summary: Get batting statistics
 *     tags: [Stats]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [most_runs, highest_average, highest_strikerate, most_run6, most_run4, most_run50, most_run100]
 *           default: most_runs
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Batting statistics
 */
router.get('/batting', async (req, res, next) => {
  try {
    const type = req.query.type || 'most_runs';
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    // Determine order by field based on stat type
    let orderBy = { runs: 'desc' };
    if (type === 'highest_average') {
      orderBy = { average: 'desc' };
    } else if (type === 'highest_strikerate') {
      orderBy = { strikeRate: 'desc' };
    } else if (type === 'most_run6') {
      orderBy = { sixes: 'desc' };
    } else if (type === 'most_run4') {
      orderBy = { fours: 'desc' };
    } else if (type === 'most_run50') {
      orderBy = { fifties: 'desc' };
    } else if (type === 'most_run100') {
      orderBy = { centuries: 'desc' };
    }

    const stats = await req.prisma.battingAggregate.findMany({
      where: { statType: type },
      take: limit,
      include: {
        player: true,
        team: true
      },
      orderBy
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/stats/bowling:
 *   get:
 *     summary: Get bowling statistics
 *     tags: [Stats]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [top_wicket_takers, best_economy_rates, best_averages, best_strike_rates]
 *           default: top_wicket_takers
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Bowling statistics
 */
router.get('/bowling', async (req, res, next) => {
  try {
    const type = req.query.type || 'top_wicket_takers';
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    // Determine order based on stat type
    let orderBy = { wickets: 'desc' };
    if (type === 'best_economy_rates') {
      orderBy = { economy: 'asc' };
    } else if (type === 'best_averages') {
      orderBy = { average: 'asc' };
    } else if (type === 'best_strike_rates') {
      orderBy = { strikeRate: 'asc' };
    }

    const stats = await req.prisma.bowlingAggregate.findMany({
      where: { statType: type },
      take: limit,
      include: {
        player: true,
        team: true
      },
      orderBy
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/stats/team-performance:
 *   get:
 *     summary: Get team performance comparison
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Team performance data
 */
router.get('/team-performance', async (req, res, next) => {
  try {
    const standings = await req.prisma.standing.findMany({
      orderBy: [
        { roundId: 'desc' }
      ],
      include: {
        team: true
      },
      distinct: ['teamId']
    });

    const performance = standings.map(s => ({
      team: s.team,
      played: s.played,
      win: s.win,
      loss: s.loss,
      points: s.points,
      netRunRate: s.netRunRate,
      qualified: s.qualified,
      winPercentage: s.played > 0 ? ((s.win / s.played) * 100).toFixed(1) : 0
    }));

    res.json(performance.sort((a, b) => b.points - a.points));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/stats/runs-per-match:
 *   get:
 *     summary: Get runs scored per match for chart
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Runs per match data
 */
router.get('/runs-per-match', async (req, res, next) => {
  try {
    const matches = await req.prisma.match.findMany({
      where: { status: 2 },
      include: {
        teamA: true,
        teamB: true,
        innings: true
      },
      orderBy: { dateStart: 'asc' },
      take: 30
    });

    const data = matches.map((match, index) => {
      const totalRuns = match.innings.reduce((sum, inn) => sum + (inn.runs || 0), 0);
      return {
        matchNumber: index + 1,
        shortTitle: match.shortTitle,
        date: match.dateStart,
        totalRuns,
        teamA: match.teamA.abbr,
        teamB: match.teamB.abbr
      };
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/stats/top-scorers-by-team:
 *   get:
 *     summary: Get top scorer for each team
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Top scorers by team
 */
router.get('/top-scorers-by-team', async (req, res, next) => {
  try {
    const teams = await req.prisma.team.findMany();
    
    const topScorers = await Promise.all(
      teams.map(async (team) => {
        const topBatsman = await req.prisma.battingAggregate.findFirst({
          where: {
            teamId: team.id,
            statType: 'most_runs'
          },
          include: {
            player: true
          },
          orderBy: { runs: 'desc' }
        });

        return {
          team: team.abbr,
          teamName: team.title,
          logoUrl: team.logoUrl,
          topScorer: topBatsman ? {
            name: topBatsman.player.shortName || topBatsman.player.title,
            runs: topBatsman.runs,
            average: topBatsman.average,
            strikeRate: topBatsman.strikeRate
          } : null
        };
      })
    );

    res.json(topScorers.filter(t => t.topScorer));
  } catch (error) {
    next(error);
  }
});

module.exports = router;

