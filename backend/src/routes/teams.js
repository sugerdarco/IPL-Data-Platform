const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Get all teams
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by team name
 *     responses:
 *       200:
 *         description: List of teams
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { abbr: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    const [teams, total] = await Promise.all([
      req.prisma.team.findMany({
        where,
        skip,
        take: limit,
        include: {
          standings: {
            orderBy: { points: 'desc' },
            take: 1
          },
          teamStats: true
        },
        orderBy: { title: 'asc' }
      }),
      req.prisma.team.count({ where })
    ]);

    res.json({
      data: teams,
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
 * /api/teams/{id}:
 *   get:
 *     summary: Get team by ID
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       404:
 *         description: Team not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'ID must be a number' });
    }

    const team = await req.prisma.team.findUnique({
      where: { id },
      include: {
        standings: {
          orderBy: { roundId: 'desc' },
          take: 1
        },
        teamStats: true,
        squads: {
          include: {
            player: true
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Not Found', message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/teams/{id}/players:
 *   get:
 *     summary: Get players of a team
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team players
 */
router.get('/:id/players', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'ID must be a number' });
    }

    // First check if team exists
    const team = await req.prisma.team.findUnique({
      where: { id }
    });

    if (!team) {
      return res.status(404).json({ error: 'Not Found', message: 'Team not found' });
    }

    const squad = await req.prisma.teamSquad.findMany({
      where: { teamId: id },
      include: {
        player: {
          include: {
            battingStats: {
              where: { statType: 'most_runs' }
            },
            bowlingStats: {
              where: { statType: 'top_wicket_takers' }
            }
          }
        }
      }
    });

    // Return empty array if no players found (not a 404)
    res.json(squad.map(s => s.player));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/teams/{id}/matches:
 *   get:
 *     summary: Get matches of a team
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *     responses:
 *       200:
 *         description: Team matches
 */
router.get('/:id/matches', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'ID must be a number' });
    }

    // First check if team exists
    const team = await req.prisma.team.findUnique({
      where: { id }
    });

    if (!team) {
      return res.status(404).json({ error: 'Not Found', message: 'Team not found' });
    }

    const where = {
      OR: [{ teamAId: id }, { teamBId: id }]
    };

    const [matches, total] = await Promise.all([
      req.prisma.match.findMany({
        where,
        skip,
        take: limit,
        include: {
          teamA: true,
          teamB: true,
          winningTeam: true,
          venue: true
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

module.exports = router;

