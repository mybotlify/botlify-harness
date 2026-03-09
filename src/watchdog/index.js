/**
 * Watchdog - Self-healing crash recovery
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export class Watchdog extends EventEmitter {
  constructor(config = {}) {
    super();
    this.process = null;
    this.restartCount = 0;
    this.maxRestarts = config.maxRestarts || 5;
    this.restartDelay = config.restartDelay || 1000;
    this.backoffMultiplier = config.backoffMultiplier || 2;
    this.healthCheckInterval = config.healthCheckInterval || 30000;
    this.command = config.command || 'openclaw';
    this.args = config.args || ['gateway', 'start'];
    this.enabled = true;
  }

  // Start watching
  start() {
    this.enabled = true;
    this.spawn();
    this.startHealthCheck();
  }

  // Spawn the managed process
  spawn() {
    if (!this.enabled) return;

    this.emit('spawning', { command: this.command, args: this.args });
    
    this.process = spawn(this.command, this.args, {
      stdio: 'pipe',
      env: process.env,
    });

    this.process.stdout.on('data', (data) => {
      this.emit('stdout', data.toString());
    });

    this.process.stderr.on('data', (data) => {
      this.emit('stderr', data.toString());
    });

    this.process.on('exit', (code, signal) => {
      this.emit('exit', { code, signal });
      this.handleExit(code, signal);
    });

    this.process.on('error', (err) => {
      this.emit('error', err);
      this.handleError(err);
    });
  }

  // Handle process exit
  handleExit(code, signal) {
    if (!this.enabled) return;

    if (code !== 0) {
      this.restartCount++;
      
      if (this.restartCount <= this.maxRestarts) {
        const delay = this.restartDelay * Math.pow(this.backoffMultiplier, this.restartCount - 1);
        this.emit('restarting', { attempt: this.restartCount, delay });
        
        setTimeout(() => this.spawn(), delay);
      } else {
        this.emit('maxRestartsReached', { count: this.restartCount });
        this.enterSafeMode();
      }
    }
  }

  // Handle process error
  handleError(err) {
    this.emit('processError', err);
  }

  // Enter safe mode after too many restarts
  enterSafeMode() {
    this.enabled = false;
    this.emit('safeMode', {
      message: 'Too many restarts. Entering safe mode.',
      restartCount: this.restartCount,
    });
  }

  // Health check
  startHealthCheck() {
    this.healthChecker = setInterval(() => {
      if (this.process && this.process.exitCode === null) {
        this.emit('healthy');
        this.restartCount = 0; // Reset on healthy
      }
    }, this.healthCheckInterval);
  }

  // Stop watching
  stop() {
    this.enabled = false;
    clearInterval(this.healthChecker);
    
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  // Get status
  getStatus() {
    return {
      running: this.process && this.process.exitCode === null,
      restartCount: this.restartCount,
      enabled: this.enabled,
      pid: this.process?.pid,
    };
  }
}

export default Watchdog;