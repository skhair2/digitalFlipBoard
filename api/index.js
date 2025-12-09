/**
 * Vercel Serverless Function - Digital FlipBoard Backend
 * This file exports the Express app as a serverless function
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Import the Express app from server
import app from '../server/index.js';

// Export the Express app as Vercel serverless function
export default app;
