import { OpenAPI } from './core/OpenAPI';

// Configure OpenAPI client with environment variables
OpenAPI.BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
