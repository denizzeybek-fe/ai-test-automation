import { OpenAPI } from './core/OpenAPI';

// Configure OpenAPI client
OpenAPI.BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
