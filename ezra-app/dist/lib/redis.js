"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
// This automatically uses the REDIS_URL from Heroku's environment variables.
// For local development, you can set REDIS_URL=redis://localhost:6379
const redisConnection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    // This is important to prevent jobs from failing during a brief Redis disconnect.
    maxRetriesPerRequest: null,
    // Connection pool settings for better performance
    lazyConnect: true,
    keepAlive: 30000,
    enableOfflineQueue: false,
});
// Handle connection events
redisConnection.on('connect', () => {
    console.log('✅ Connected to Redis');
});
redisConnection.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});
redisConnection.on('close', () => {
    console.log('🔌 Redis connection closed');
});
exports.default = redisConnection;
