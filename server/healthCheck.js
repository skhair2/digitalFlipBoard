/**
 * Health Check Endpoints
 * Provides liveness and readiness probes for Kubernetes/Docker deployments
 */
import logger from './logger.js';
import { redisClient } from './redis.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Liveness probe - indicates if server is alive
 * Should be quick and not perform deep checks
 */
export async function handleHealthLive(req, res) {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Check if memory is critically high
    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    if (heapUsedPercent > 90) {
      return res.status(503).json({
        status: 'unhealthy',
        reason: 'High memory usage',
        memory_usage_percent: heapUsedPercent.toFixed(2),
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: 'alive',
      uptime_seconds: Math.round(uptime),
      memory_usage_percent: heapUsedPercent.toFixed(2),
      timestamp: new Date().toISOString()
    });

    logger.debug('health_check_live', { status: 'success' });
  } catch (error) {
    logger.error('health_check_live failed', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Readiness probe - indicates if server is ready to serve traffic
 * Performs comprehensive dependency checks
 */
export async function handleHealthReady(req, res) {
  const checks = {};
  let allHealthy = true;

  try {
    // Check Redis
    try {
      await redisClient.ping();
      checks.redis = { status: 'healthy' };
    } catch (error) {
      checks.redis = { status: 'unhealthy', error: error.message };
      allHealthy = false;
    }

    // Check Supabase database
    try {
      const { error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        checks.database = { status: 'unhealthy', error: error.message };
        allHealthy = false;
      } else {
        checks.database = { status: 'healthy' };
      }
    } catch (error) {
      checks.database = { status: 'unhealthy', error: error.message };
      allHealthy = false;
    }

    // Check environment variables
    const requiredEnvs = ['SUPABASE_URL', 'REDIS_URL'];
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

    if (missingEnvs.length > 0) {
      checks.config = {
        status: 'unhealthy',
        error: `Missing environment variables: ${missingEnvs.join(', ')}`
      };
      allHealthy = false;
    } else {
      checks.config = { status: 'healthy' };
    }

    // Check memory
    const memoryUsage = process.memoryUsage();
    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    if (heapUsedPercent > 85) {
      checks.memory = {
        status: 'warning',
        usage_percent: heapUsedPercent.toFixed(2)
      };
      allHealthy = false;
    } else {
      checks.memory = {
        status: 'healthy',
        usage_percent: heapUsedPercent.toFixed(2)
      };
    }

    const statusCode = allHealthy ? 200 : 503;
    const status = allHealthy ? 'ready' : 'not_ready';

    res.status(statusCode).json({
      status,
      checks,
      timestamp: new Date().toISOString()
    });

    if (allHealthy) {
      logger.debug('health_check_ready', { status: 'all_checks_passed' });
    } else {
      logger.warn('health_check_ready', {
        status: 'some_checks_failed',
        failed_checks: Object.entries(checks)
          .filter(([_, check]) => check.status !== 'healthy')
          .map(([key]) => key)
      });
    }
  } catch (error) {
    logger.error('health_check_ready failed', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Detailed metrics endpoint (for monitoring/debugging)
 */
export async function handleMetrics(req, res) {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();

    res.json({
      server: {
        uptime_seconds: Math.round(uptime),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.VERSION || 'unknown'
      },
      memory: {
        rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
        heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_used_percent: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2),
        external_mb: Math.round(memoryUsage.external / 1024 / 1024)
      },
      cpu: {
        user_ms: cpuUsage.user,
        system_ms: cpuUsage.system
      },
      timestamp: new Date().toISOString()
    });

    logger.debug('metrics_requested');
  } catch (error) {
    logger.error('metrics endpoint failed', error);
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error.message
    });
  }
}

/**
 * Ready middleware - returns 503 if dependencies unavailable
 * Use this to prevent unhealthy instances from receiving traffic
 */
export async function readinessMiddleware(req, res, next) {
  try {
    // Quick check of critical dependencies
    const redisCheck = await redisClient.ping().catch(() => false);
    
    if (!redisCheck) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Redis connection failed'
      });
    }

    next();
  } catch (error) {
    res.status(503).json({
      error: 'Service check failed',
      message: error.message
    });
  }
}

/**
 * Register health check routes
 */
export function registerHealthCheckRoutes(app) {
  /**
   * Liveness probe: GET /health/live
   * Used by Kubernetes liveness probes to restart unhealthy containers
   */
  app.get('/health/live', handleHealthLive);

  /**
   * Readiness probe: GET /health/ready
   * Used by Kubernetes readiness probes to stop routing traffic to unhealthy instances
   */
  app.get('/health/ready', handleHealthReady);

  /**
   * Metrics endpoint: GET /metrics
   * Detailed metrics for monitoring dashboards
   */
  app.get('/metrics', handleMetrics);

  /**
   * Generic health endpoint: GET /health
   * Returns readiness status
   */
  app.get('/health', handleHealthReady);

  logger.info('health_check_routes_registered', {
    routes: ['/health/live', '/health/ready', '/metrics', '/health']
  });
}

export default {
  handleHealthLive,
  handleHealthReady,
  handleMetrics,
  readinessMiddleware,
  registerHealthCheckRoutes
};
