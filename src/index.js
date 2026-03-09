/**
 * Botlify Harness - Main entry point
 */

import express from 'express';
import { MemorySystem } from './core/memory.js';
import { ContextManager } from './core/context.js';
import { SkillsEngine } from './core/skills.js';
import { ModelRouter } from './core/router.js';
import { Watchdog } from './watchdog/index.js';
import { HooksEngine, builtInHooks } from './hooks/index.js';
import { renderDashboard } from './ui/dashboard.js';

class BotlifyHarness {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3000,
      ...config,
    };

    // Core systems
    this.memory = new MemorySystem(config.memory);
    this.context = new ContextManager(config.context);
    this.skills = new SkillsEngine(config.skills);
    this.router = new ModelRouter(config.router);
    this.watchdog = new Watchdog(config.watchdog);
    this.hooks = new HooksEngine();

    // Setup built-in hooks
    this.setupHooks();
    
    // Setup API
    this.app = express();
    this.setupAPI();
  }

  setupHooks() {
    // Context management hooks
    this.context.callbacks.onAutoSave = async (summary) => {
      await this.hooks.emit('contextHigh', { ...summary, summarize: () => this.getSummary() });
    };

    this.context.callbacks.onWarn = (summary) => {
      console.warn(`⚠️ Context at ${summary.usagePercent}%`);
    };

    // Register built-in hooks
    this.hooks.on('decision', (data) => builtInHooks.onDecision(data, this.memory));
    this.hooks.on('idea', (data) => builtInHooks.onIdea(data, this.memory));
    this.hooks.on('resource', (data) => builtInHooks.onResource(data, this.memory));
    this.hooks.on('contextHigh', (data) => builtInHooks.onContextHigh(data, this.memory));
    this.hooks.on('sessionEnd', (data) => builtInHooks.onSessionEnd(data, this.memory));
  }

  setupAPI() {
    this.app.use(express.json());

    // Dashboard
    this.app.get('/', async (req, res) => {
      const data = await this.getDashboardData();
      res.send(renderDashboard(data));
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        watchdog: this.watchdog.getStatus(),
        context: this.context.getSummary(),
      });
    });

    // Memory API
    this.app.post('/memory', async (req, res) => {
      const { category, data } = req.body;
      const result = await this.memory.saveLongTerm(category, data);
      res.json(result);
    });

    // Hooks API
    this.app.post('/hooks/:event', async (req, res) => {
      const results = await this.hooks.emit(req.params.event, req.body);
      res.json(results);
    });

    // Context API
    this.app.post('/context/update', (req, res) => {
      this.context.update(req.body.tokens);
      res.json(this.context.getSummary());
    });

    // Watchdog API
    this.app.get('/watchdog/status', (req, res) => {
      res.json(this.watchdog.getStatus());
    });

    this.app.post('/watchdog/restart', (req, res) => {
      this.watchdog.stop();
      this.watchdog.start();
      res.json({ restarted: true });
    });
  }

  async getSummary() {
    return {
      context: this.context.getSummary(),
      watchdog: this.watchdog.getStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  async getDashboardData() {
    return {
      watchdog: this.watchdog.getStatus(),
      context: this.context.getSummary(),
      skills: this.skills.getSkills(),
      memory: { count: this.memory.shortTerm.size },
      activity: [],
    };
  }

  // Process incoming message
  async processMessage(message) {
    // Detect patterns and trigger hooks
    const captures = this.memory.detectAndCapture(message);
    
    for (const capture of captures) {
      await this.hooks.emit(capture.type, { message, ...capture });
    }

    return captures;
  }

  start() {
    // Start watchdog
    this.watchdog.start();

    // Start API server
    this.app.listen(this.config.port, () => {
      console.log(`🤖 Botlify Harness running on port ${this.config.port}`);
    });
  }
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const harness = new BotlifyHarness();
  harness.start();
}

export { BotlifyHarness, MemorySystem, ContextManager, Watchdog, HooksEngine };
export default BotlifyHarness;