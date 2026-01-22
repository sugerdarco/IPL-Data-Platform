const express = require('express');
const router = express.Router();

// NOTE: Static routes must be defined BEFORE dynamic /:id routes

/**
 * @swagger
 * /api/matches/recent:
 *   get:
 *     summary: Get recent matches
 *     tags: [Matches]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Recent matches
 */
router.get('/recent/list', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);

    const matches = await req.prisma.match.findMany({
      where: { status: 2 },
      take: limit,
      include: {
        teamA: true,
        teamB: true,
        winningTeam: true,
        venue: true
      },
      orderBy: { dateStart: 'desc' }
    });

    res.json(matches);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/matches/venues:
 *   get:
 *     summary: Get all venues
 *     tags: [Matches]
 *     responses:
 *       200:
 *         description: List of venues
 */
router.get('/venues/list', async (req, res, next) => {
  try {
    const venues = await req.prisma.venue.findMany({
      include: {
        _count: {
          select: { matches: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(venues);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/matches:
 *   get:
 *     summary: Get all matches
 *     tags: [Matches]
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
 *           default: 10
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: integer
 *         description: Filter by team
 *       - in: query
 *         name: venueId
 *         schema:
 *           type: integer
 *         description: Filter by venue
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2]
 *         description: Filter by status (0=Scheduled, 1=Live, 2=Completed)
 *     responses:
 *       200:
 *         description: List of matches
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const teamId = parseInt(req.query.teamId) || null;
    const venueId = parseInt(req.query.venueId) || null;
    const status = req.query.status !== undefined ? parseInt(req.query.status) : null;

    const where = {};
    
    if (teamId) {
      where.OR = [{ teamAId: teamId }, { teamBId: teamId }];
    }
    
    if (venueId) {
      where.venueId = venueId;
    }
    
    if (status !== null) {
      where.status = status;
    }

    const [matches, total] = await Promise.all([
      req.prisma.match.findMany({
        where,
        skip,
        take: limit,
        include: {
          teamA: true,
          teamB: true,
          winningTeam: true,
          venue: true,
          tossWinner: true
        },
        orderBy: { dateStart: 'desc' }
      }),
      req.prisma.match.count({ where })
    ]);

    res.json({
      data: matches,
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
 * /api/matches/{id}:
 *   get:
 *     summary: Get match by ID
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Match details
 *       404:
 *         description: Match not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'ID must be a number' });
    }

    const match = await req.prisma.match.findUnique({
      where: { id },
      include: {
        teamA: true,
        teamB: true,
        winningTeam: true,
        tossWinner: true,
        venue: true,
        innings: {
          include: {
            battingTeam: true,
            fieldingTeam: true,
            batsmen: {
              include: { player: true },
              orderBy: { position: 'asc' }
            },
            bowlers: {
              include: { player: true },
              orderBy: { overs: 'desc' }
            },
            fallOfWickets: {
              orderBy: { runs: 'asc' }
            }
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Not Found', message: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/matches/{id}/scorecard:
 *   get:
 *     summary: Get match scorecard
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Match scorecard
 */
router.get('/:id/scorecard', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'ID must be a number' });
    }

    const innings = await req.prisma.innings.findMany({
      where: { matchId: id },
      include: {
        battingTeam: true,
        fieldingTeam: true,
        batsmen: {
          include: { player: true },
          orderBy: { position: 'asc' }
        },
        bowlers: {
          include: { player: true },
          orderBy: { wickets: 'desc' }
        },
        fallOfWickets: {
          orderBy: { runs: 'asc' }
        }
      },
      orderBy: { number: 'asc' }
    });

    if (innings.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Scorecard not found' });
    }

    res.json(innings);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/matches/{id}/wagon-wheel:
 *   get:
 *     summary: Get wagon wheel data for a match
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: inningsNumber
 *         schema:
 *           type: integer
 *         description: Filter by innings number (1 or 2)
 *       - in: query
 *         name: batsmanId
 *         schema:
 *           type: integer
 *         description: Filter by batsman player ID
 *     responses:
 *       200:
 *         description: Wagon wheel data
 */
router.get('/:id/wagon-wheel', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const inningsNumber = req.query.inningsNumber ? parseInt(req.query.inningsNumber) : null;
    const batsmanId = req.query.batsmanId ? parseInt(req.query.batsmanId) : null;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'ID must be a number' });
    }

    // Build where clause
    const where = { matchId: id };
    
    // If innings number specified, find the innings first
    if (inningsNumber) {
      const innings = await req.prisma.innings.findFirst({
        where: { matchId: id, number: inningsNumber }
      });
      if (innings) {
        where.inningsId = innings.id;
      }
    }

    if (batsmanId) {
      where.batsmanId = batsmanId;
    }

    const wagonWheels = await req.prisma.wagonWheel.findMany({
      where,
      orderBy: { uniqueOver: 'asc' }
    });

    // Get innings info for context
    const innings = await req.prisma.innings.findMany({
      where: { matchId: id },
      include: {
        battingTeam: true,
        batsmen: {
          include: { player: true }
        }
      },
      orderBy: { number: 'asc' }
    });

    // Group wagon wheel data by innings
    // Note: wagonWheels use batsmanId which is the player's external PID (not internal DB id)
    const groupedData = innings.map(inn => ({
      inningsNumber: inn.number,
      inningsName: inn.name,
      battingTeam: inn.battingTeam,
      batsmen: inn.batsmen.map(b => ({
        playerId: b.playerId,
        pid: b.player?.pid || null, // External player ID used in wagon wheel data
        name: b.name,
        runs: b.runs,
        balls: b.ballsFaced,
        fours: b.fours,
        sixes: b.sixes
      })),
      wagonData: wagonWheels.filter(w => w.inningsId === inn.id)
    }));

    // Zone stats
    const zoneNames = ['Fine Leg', 'Square Leg', 'Mid Wicket', 'Long on', 'Long of', 'Cover', 'Point', '3rd man'];
    const zoneStats = {};
    wagonWheels.forEach(w => {
      const zone = zoneNames[w.zoneId] || 'Unknown';
      if (!zoneStats[zone]) {
        zoneStats[zone] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      }
      zoneStats[zone].runs += w.batRun;
      zoneStats[zone].balls += 1;
      if (w.eventName === 'four') zoneStats[zone].fours += 1;
      if (w.eventName === 'six') zoneStats[zone].sixes += 1;
    });

    res.json({
      matchId: id,
      totalBalls: wagonWheels.length,
      innings: groupedData,
      zoneStats,
      zoneNames
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/matches/{id}/commentary:
 *   get:
 *     summary: Get ball-by-ball commentary for a match
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: inningsNumber
 *         schema:
 *           type: integer
 *         description: Filter by innings number (1 or 2)
 *       - in: query
 *         name: over
 *         schema:
 *           type: integer
 *         description: Filter by specific over
 *       - in: query
 *         name: events
 *         schema:
 *           type: string
 *         description: Filter by event types (comma-separated: wicket,six,four)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Commentary data
 */
router.get('/:id/commentary', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const inningsNumber = req.query.inningsNumber ? parseInt(req.query.inningsNumber) : null;
    const over = req.query.over ? parseInt(req.query.over) : null;
    const events = req.query.events ? req.query.events.split(',') : null;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'ID must be a number' });
    }

    // Build where clause
    const where = { matchId: id };
    
    if (inningsNumber) {
      const innings = await req.prisma.innings.findFirst({
        where: { matchId: id, number: inningsNumber }
      });
      if (innings) {
        where.inningsId = innings.id;
      }
    }

    if (over !== null) {
      where.over = over;
    }

    if (events && events.length > 0) {
      const eventFilters = [];
      if (events.includes('wicket')) eventFilters.push({ isWicket: true });
      if (events.includes('six')) eventFilters.push({ isSix: true });
      if (events.includes('four')) eventFilters.push({ isFour: true });
      if (eventFilters.length > 0) {
        where.OR = eventFilters;
      }
    }

    const [commentaries, total] = await Promise.all([
      req.prisma.commentary.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { over: 'desc' },
          { ball: 'desc' }
        ]
      }),
      req.prisma.commentary.count({ where })
    ]);

    // Get innings info
    const innings = await req.prisma.innings.findMany({
      where: { matchId: id },
      include: {
        battingTeam: true,
        fieldingTeam: true
      },
      orderBy: { number: 'asc' }
    });

    // Group by innings and over for display
    const groupedByInnings = {};
    for (const comm of commentaries) {
      const inn = innings.find(i => i.id === comm.inningsId);
      const innNum = inn?.number || 1;
      if (!groupedByInnings[innNum]) {
        groupedByInnings[innNum] = {
          inningsNumber: innNum,
          inningsName: inn?.name || `Innings ${innNum}`,
          battingTeam: inn?.battingTeam,
          overs: {}
        };
      }
      if (!groupedByInnings[innNum].overs[comm.over]) {
        groupedByInnings[innNum].overs[comm.over] = [];
      }
      groupedByInnings[innNum].overs[comm.over].push(comm);
    }

    // Calculate highlights
    const highlights = {
      wickets: commentaries.filter(c => c.isWicket).length,
      sixes: commentaries.filter(c => c.isSix).length,
      fours: commentaries.filter(c => c.isFour).length,
      totalRuns: commentaries.reduce((sum, c) => sum + c.run, 0)
    };

    res.json({
      matchId: id,
      innings,
      commentaries,
      groupedByInnings: Object.values(groupedByInnings),
      highlights,
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
 * /api/matches/{id}/highlights:
 *   get:
 *     summary: Get match highlights (wickets, sixes, fours)
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Match highlights
 */
router.get('/:id/highlights', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'ID must be a number' });
    }

    // Get wickets
    const wickets = await req.prisma.commentary.findMany({
      where: { matchId: id, isWicket: true },
      orderBy: [{ over: 'asc' }, { ball: 'asc' }]
    });

    // Get sixes
    const sixes = await req.prisma.commentary.findMany({
      where: { matchId: id, isSix: true },
      orderBy: [{ over: 'asc' }, { ball: 'asc' }]
    });

    // Get fours
    const fours = await req.prisma.commentary.findMany({
      where: { matchId: id, isFour: true },
      orderBy: [{ over: 'asc' }, { ball: 'asc' }]
    });

    // Get innings info
    const innings = await req.prisma.innings.findMany({
      where: { matchId: id },
      include: {
        battingTeam: true
      },
      orderBy: { number: 'asc' }
    });

    res.json({
      matchId: id,
      innings,
      wickets,
      sixes,
      fours,
      summary: {
        totalWickets: wickets.length,
        totalSixes: sixes.length,
        totalFours: fours.length
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

