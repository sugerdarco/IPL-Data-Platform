const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/standings:
 *   get:
 *     summary: Get team standings
 *     tags: [Standings]
 *     parameters:
 *       - in: query
 *         name: roundId
 *         schema:
 *           type: integer
 *         description: Filter by round ID
 *     responses:
 *       200:
 *         description: Team standings table
 */
router.get('/', async (req, res, next) => {
  try {
    const roundId = parseInt(req.query.roundId) || null;

    // Get latest round if not specified
    let targetRoundId = roundId;
    if (!targetRoundId) {
      const latestRound = await req.prisma.standing.findFirst({
        orderBy: { roundId: 'desc' },
        select: { roundId: true }
      });
      targetRoundId = latestRound?.roundId;
    }

    if (!targetRoundId) {
      return res.json([]);
    }

    const standings = await req.prisma.standing.findMany({
      where: { roundId: targetRoundId },
      include: {
        team: true,
        competition: true
      },
      orderBy: [
        { points: 'desc' },
        { netRunRate: 'desc' }
      ]
    });

    res.json(standings);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/standings/rounds:
 *   get:
 *     summary: Get available rounds
 *     tags: [Standings]
 *     responses:
 *       200:
 *         description: List of rounds
 */
router.get('/rounds', async (req, res, next) => {
  try {
    const rounds = await req.prisma.standing.findMany({
      distinct: ['roundId'],
      select: {
        roundId: true,
        roundName: true
      },
      orderBy: { roundId: 'asc' }
    });

    res.json(rounds);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/standings/team/{teamId}:
 *   get:
 *     summary: Get standings for a specific team
 *     tags: [Standings]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Team standing details
 *       404:
 *         description: Team standing not found
 */
router.get('/team/:teamId', async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.teamId);
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid ID', message: 'Team ID must be a number' });
    }

    const standing = await req.prisma.standing.findFirst({
      where: { teamId },
      include: {
        team: true,
        competition: true
      },
      orderBy: { roundId: 'desc' }
    });

    if (!standing) {
      return res.status(404).json({ error: 'Not Found', message: 'Team standing not found' });
    }

    res.json(standing);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

