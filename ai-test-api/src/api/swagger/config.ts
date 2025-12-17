import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Test Automation API',
      version: '1.0.0',
      description: 'Backend API for automated test case generation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/api/routes/*.ts'], // Path to API routes
};

export const swaggerSpec = swaggerJsdoc(options);
