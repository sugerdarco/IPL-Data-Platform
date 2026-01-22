const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { PrismaClient } = require('@prisma/client');

// Import routes
const teamsRouter = require('./routes/teams');
const playersRouter = require('./routes/players');
const matchesRouter = require('./routes/matches');
const standingsRouter = require('./routes/standings');
const statsRouter = require('./routes/stats');
const bettingRouter = require('./routes/betting');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Fix BigInt serialization issue - convert BigInt to string for JSON
BigInt.prototype.toJSON = function() {
  return this.toString();
};

// Middleware
app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IPL 2022 API',
      version: '1.0.0',
      description: 'RESTful API for IPL 2022 Cricket Data',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Team: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            tid: { type: 'integer' },
            title: { type: 'string' },
            abbr: { type: 'string' },
            logoUrl: { type: 'string' },
            country: { type: 'string' }
          }
        },
        Player: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            pid: { type: 'integer' },
            title: { type: 'string' },
            shortName: { type: 'string' },
            playingRole: { type: 'string' },
            battingStyle: { type: 'string' },
            bowlingStyle: { type: 'string' },
            country: { type: 'string' }
          }
        },
        Match: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            matchId: { type: 'integer' },
            title: { type: 'string' },
            shortTitle: { type: 'string' },
            dateStart: { type: 'string', format: 'date-time' },
            statusStr: { type: 'string' },
            result: { type: 'string' }
          }
        },
        Standing: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            played: { type: 'integer' },
            win: { type: 'integer' },
            loss: { type: 'integer' },
            points: { type: 'integer' },
            netRunRate: { type: 'number' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 timestamp: { type: string }
 *                 uptime: { type: number }
 */
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/standings', standingsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/betting', bettingRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 IPL API Server running on http://localhost:${PORT}`);
  console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
});

module.exports = app;

