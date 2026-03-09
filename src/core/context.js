/**
 * Context Manager - Monitors and manages context window usage
 */

export class ContextManager {
  constructor(config = {}) {
    this.maxTokens = config.maxTokens || 200000;
    this.currentTokens = 0;
    this.checkpoints = [];
    this.autoSaved = false;
    
    this.thresholds = {
      checkpoint: 0.5,
      prepare: 0.6,
      autoSave: 0.7,
      warn: 0.8,
      critical: 0.9,
    };
    
    this.callbacks = {
      onCheckpoint: config.onCheckpoint || (() => {}),
      onAutoSave: config.onAutoSave || (() => {}),
      onWarn: config.onWarn || (() => {}),
      onCritical: config.onCritical || (() => {}),
    };
  }

  // Update token count
  update(tokens) {
    this.currentTokens = tokens;
    this.checkThresholds();
  }

  // Get current usage percentage
  getUsage() {
    return this.currentTokens / this.maxTokens;
  }

  // Check and trigger appropriate callbacks
  checkThresholds() {
    const usage = this.getUsage();

    if (usage >= this.thresholds.critical) {
      this.callbacks.onCritical(this.getSummary());
    } else if (usage >= this.thresholds.warn) {
      this.callbacks.onWarn(this.getSummary());
    } else if (usage >= this.thresholds.autoSave && !this.autoSaved) {
      this.autoSaved = true;
      this.callbacks.onAutoSave(this.getSummary());
    } else if (usage >= this.thresholds.checkpoint) {
      this.checkpoint();
    }
  }

  // Create a checkpoint
  checkpoint() {
    this.checkpoints.push({
      tokens: this.currentTokens,
      timestamp: Date.now(),
      usage: this.getUsage(),
    });
    this.callbacks.onCheckpoint(this.checkpoints.at(-1));
  }

  // Get summary for saving
  getSummary() {
    return {
      currentTokens: this.currentTokens,
      maxTokens: this.maxTokens,
      usage: this.getUsage(),
      usagePercent: Math.round(this.getUsage() * 100),
      checkpoints: this.checkpoints.length,
      autoSaved: this.autoSaved,
    };
  }

  // Reset for new session
  reset() {
    this.currentTokens = 0;
    this.checkpoints = [];
    this.autoSaved = false;
  }
}

export default ContextManager;