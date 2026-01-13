#!/usr/bin/env node
/**
 * Dashboard Server
 * Serves the healing monitoring dashboard with metrics data
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

class DashboardServer {
  constructor(port = 8081) {
    this.port = port;
    this.rootDir = process.cwd();
    this.mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.ico': 'image/x-icon',
      '.svg': 'image/svg+xml'
    };

    console.log(`📊 Starting Dashboard Server on port ${port}`);
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath);
    return this.mimeTypes[ext] || 'text/plain';
  }

  serveFile(res, filePath) {
    try {
      const fullPath = path.join(this.rootDir, filePath);

      if (!fs.existsSync(fullPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }

      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Directory access forbidden');
        return;
      }

      const content = fs.readFileSync(fullPath);
      const mimeType = this.getMimeType(filePath);

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': content.length,
        'Cache-Control': filePath.includes('healing-metrics') ? 'no-cache' : 'public, max-age=300'
      });
      res.end(content);

    } catch (error) {
      console.error('Error serving file:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error');
    }
  }

  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Add CORS headers for API requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    console.log(`${req.method} ${pathname}`);

    // Route handling
    try {
      switch (pathname) {
        case '/':
        case '/dashboard':
          this.serveFile(res, 'healing-dashboard.html');
          break;

        case '/api/metrics':
          await this.serveMetricsAPI(res);
          break;

        case '/api/status':
          await this.serveStatusAPI(res);
          break;

        case '/api/refresh':
          await this.refreshMetrics(res);
          break;

        default:
          // Serve static files
          if (pathname.startsWith('/healing-metrics/') ||
              pathname.startsWith('/healing-reports/') ||
              pathname.includes('.json') ||
              pathname.includes('.html') ||
              pathname.includes('.js') ||
              pathname.includes('.css')) {
            this.serveFile(res, pathname.substring(1));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
          }
          break;
      }
    } catch (error) {
      console.error('Request handling error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }

  async serveMetricsAPI(res) {
    try {
      const cumulativeFile = path.join(this.rootDir, 'healing-metrics', 'cumulative.json');

      if (!fs.existsSync(cumulativeFile)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No metrics data available' }));
        return;
      }

      const data = JSON.parse(fs.readFileSync(cumulativeFile, 'utf8'));

      // Add additional computed metrics
      const enhanced = {
        ...data,
        meta: {
          lastRefresh: new Date().toISOString(),
          dataPoints: data.runs ? data.runs.length : 0,
          healthStatus: this.calculateHealthStatus(data.summary)
        }
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(enhanced, null, 2));

    } catch (error) {
      console.error('Error serving metrics API:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to load metrics' }));
    }
  }

  async serveStatusAPI(res) {
    try {
      const cumulativeFile = path.join(this.rootDir, 'healing-metrics', 'cumulative.json');

      if (!fs.existsSync(cumulativeFile)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'no-data', healthy: false }));
        return;
      }

      const data = JSON.parse(fs.readFileSync(cumulativeFile, 'utf8'));
      const summary = data.summary || {};

      const status = {
        status: this.calculateHealthStatus(summary),
        healthy: (summary.currentSuccessRate || 0) >= 81.1,
        timestamp: new Date().toISOString(),
        metrics: {
          successRate: summary.currentSuccessRate || 0,
          averageSuccessRate: summary.averageSuccessRate || 0,
          trend: summary.trend || 'unknown',
          totalRuns: summary.totalRuns || 0
        }
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));

    } catch (error) {
      console.error('Error serving status API:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', healthy: false, error: error.message }));
    }
  }

  async refreshMetrics(res) {
    try {
      console.log('🔄 Refreshing metrics data...');

      // Run the healing monitor
      const { execSync } = require('child_process');
      const output = execSync('npm run monitor:healing', {
        encoding: 'utf8',
        timeout: 300000 // 5 minutes
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'success',
        message: 'Metrics refreshed successfully',
        timestamp: new Date().toISOString()
      }));

      console.log('✅ Metrics refresh completed');

    } catch (error) {
      console.error('Error refreshing metrics:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  }

  calculateHealthStatus(summary) {
    if (!summary || typeof summary.currentSuccessRate !== 'number') {
      return 'unknown';
    }

    const rate = summary.currentSuccessRate;
    const trend = summary.trend || 'stable';

    if (rate >= 81.1 && trend !== 'degrading') return 'healthy';
    if (rate >= 75) return 'warning';
    return 'critical';
  }

  start() {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    server.listen(this.port, () => {
      console.log(`🚀 Dashboard server running at http://localhost:${this.port}`);
      console.log(`📊 Dashboard available at http://localhost:${this.port}/dashboard`);
      console.log(`🔧 API endpoints:`);
      console.log(`   - GET /api/metrics    - Get all metrics data`);
      console.log(`   - GET /api/status     - Get current system status`);
      console.log(`   - POST /api/refresh   - Refresh metrics data`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down dashboard server...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    return server;
  }
}

// Run the server if called directly
if (require.main === module) {
  const port = process.env.PORT || 8081;
  const server = new DashboardServer(port);
  server.start();
}

module.exports = DashboardServer;