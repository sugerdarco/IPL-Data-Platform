const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/players/top/batsmen:
 *   get:
 *     summary: Get top batsmen
 *     tags: [Players]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [runs, average, strikeRate, centuries, fifties, sixes]
 *           default: runs
 *     responses:
 *       200:
 *         description: Top batsmen
 */
router.get('/top/batsmen', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const sortBy = req.query.sortBy || 'runs';

    const orderByField = {
      runs: 'runs',
      average: 'average',
      strikeRate: 'strikeRate',
      centuries: 'centuries',
      fifties: 'fifties',
      sixes: 'sixes'
    }[sortBy] || 'runs';

    const batsmen = await req.prisma.battingAggregate.findMany({
      where: { statType: 'most_runs' },
      take: limit,
      include: {
        player: true,
        team: true
      },
      orderBy: { [orderByField]: 'desc' }
    });

    res.json(batsmen);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/players/top/bowlers:
 *   get:
 *     summary: Get top bowlers
 *     tags: [Players]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [wickets, economy, average, strikeRate]
 *           default: wickets
 *     responses:
 *       200:
 *         description: Top bowlers
 */
router.get('/top/bowlers', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const sortBy = req.query.sortBy || 'wickets';

    const orderByField = {
      wickets: 'wickets',
      economy: 'economy',
      average: 'average',
      strikeRate: 'strikeRate'
    }[sortBy] || 'wickets';

    const orderDir = sortBy === 'economy' || sortBy === 'average' ? 'asc' : 'desc';

    const bowlers = await req.prisma.bowlingAggregate.findMany({
      where: { statType: 'top_wicket_takers' },
      take: limit,
      include: {
        player: true,
        team: true
      },
      orderBy: { [orderByField]: orderDir }
    });

    res.json(bowlers);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/players:
 *   get:
 *     summary: Get all players
 *     tags: [Players]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by player name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [bat, bowl, all, wk]
 *         description: Filter by playing role
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: integer
 *         description: Filter by team
 *     responses:
 *       200:
 *         description: List of players
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const teamId = parseInt(req.query.teamId) || null;

    const where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      where.playingRole = role;
    }

    if (teamId) {
      where.squads = {
        some: { teamId }
      };
    }

    const [players, total] = await Promise.all([
      req.prisma.player.findMany({
        where,
        skip,
        take: limit,
        include: {
          squads: {
            include: { team: true }
          },
          battingStats: {
            where: { statType: 'most_runs' },
            take: 1
          },
          bowlingStats: {
            where: { statType: 'top_wicket_takers' },
            take: 1
          }
        },
        orderBy: { title: 'asc' }
      }),
      req.prisma.player.count({ where })
    ]);

    res.json({
      data: players,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/players/{id}:
 *   get:
 *     summary: Get player by ID
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Player details
 *       404:
 *         description: Player not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'ID must be a number' });
    }

    const player = await req.prisma.player.findUnique({
      where: { id },
      include: {
        squads: {
          include: { team: true }
        },
        careerStats: true,
        battingStats: true,
        bowlingStats: true
      }
    });

    if (!player) {
      return res.status(404).json({ error: 'Not Found', message: 'Player not found' });
    }

    res.json(player);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/players/{id}/batting:
 *   get:
 *     summary: Get player batting records
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Player batting records in all matches
 */
router.get('/:id/batting', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'ID must be a number' });
    }

    // Check if player exists first
    const player = await req.prisma.player.findUnique({
      where: { id }
    });

    if (!player) {
      return res.status(404).json({ error: 'Not Found', message: 'Player not found' });
    }

    const records = await req.prisma.batsman.findMany({
      where: { playerId: id },
      include: {
        innings: {
          include: {
            match: {
              include: {
                teamA: true,
                teamB: true,
                venue: true
              }
            },
            battingTeam: true
          }
        }
      },
      orderBy: { runs: 'desc' }
    });

    // Return empty array if no records (not 404)
    res.json(records);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/players/{id}/bowling:
 *   get:
 *     summary: Get player bowling records
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Player bowling records in all matches
 */
router.get('/:id/bowling', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'ID must be a number' });
    }

    // Check if player exists first
    const player = await req.prisma.player.findUnique({
      where: { id }
    });

    if (!player) {
      return res.status(404).json({ error: 'Not Found', message: 'Player not found' });
    }

    const records = await req.prisma.bowler.findMany({
      where: { playerId: id },
      include: {
        innings: {
          include: {
            match: {
              include: {
                teamA: true,
                teamB: true,
                venue: true
              }
            },
            fieldingTeam: true
          }
        }
      },
      orderBy: { wickets: 'desc' }
    });

    // Return empty array if no records (not 404)
    res.json(records);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

