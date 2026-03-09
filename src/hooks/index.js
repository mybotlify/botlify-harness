/**
 * Hooks System - Event-driven automation
 */

export class HooksEngine {
  constructor() {
    this.hooks = new Map();
    this.middleware = [];
  }

  // Register a hook
  on(event, handler, options = {}) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event).push({ handler, options });
  }

  // Emit an event
  async emit(event, data) {
    // Run middleware
    for (const mw of this.middleware) {
      data = await mw(event, data);
    }

    const handlers = this.hooks.get(event) || [];
    const results = [];

    for (const { handler, options } of handlers) {
      try {
        const result = await handler(data);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error });
        if (options.critical) throw error;
      }
    }

    return results;
  }

  // Add middleware
  use(fn) {
    this.middleware.push(fn);
  }
}

// Pre-built hooks
export const builtInHooks = {
  // Capture decisions
  onDecision: async (data, memory) => {
    await memory.saveLongTerm('decision', {
      content: data.message,
      context: data.context,
    });
  },

  // Capture ideas
  onIdea: async (data, memory) => {
    await memory.saveLongTerm('idea', {
      content: data.message,
      source: 'chat',
    });
  },

  // Capture resources
  onResource: async (data, memory) => {
    const urls = data.message.match(/https?:\/\/\S+/g) || [];
    for (const url of urls) {
      await memory.saveLongTerm('resource', { url, context: data.message });
    }
  },

  // Auto-save on high context
  onContextHigh: async (data, memory) => {
    const summary = await data.summarize();
    await memory.saveLongTerm('session_checkpoint', {
      usage: data.usage,
      summary,
    });
  },

  // Session end summary
  onSessionEnd: async (data, memory) => {
    await memory.saveLongTerm('session_summary', {
      duration: data.duration,
      messagesCount: data.messagesCount,
      keyPoints: data.keyPoints,
    });
  },
};

export default HooksEngine;