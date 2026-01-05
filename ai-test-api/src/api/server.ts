import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger/config.js';
import tasksRouter from './routes/tasks.route.js';
import promptsRouter from './routes/prompts.route.js';
import modeRouter from './routes/mode.route.js';
import { initializeWebSocket } from './websocket/handler.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Swagger JSON endpoint for openapi-typescript-codegen
app.get('/api-docs-json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/prompts', promptsRouter);
app.use('/api/mode', modeRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Initialize WebSocket
initializeWebSocket(io);

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`📄 OpenAPI JSON: http://localhost:${PORT}/api-docs-json`);
});
