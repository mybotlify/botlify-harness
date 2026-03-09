/**
 * Model Router - Intelligent routing to optimal model
 */

export class ModelRouter {
  constructor(config = {}) {
    this.models = config.models || {
      // Cheap & fast
      haiku: { provider: 'anthropic', model: 'claude-3-haiku-20240307', costPer1k: 0.00025 },
      'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini', costPer1k: 0.00015 },
      'glm-5': { provider: 'zhipu', model: 'glm-5', costPer1k: 0.00008 },
      
      // Balanced
      sonnet: { provider: 'anthropic', model: 'claude-sonnet-4-20250514', costPer1k: 0.003 },
      'gpt-4o': { provider: 'openai', model: 'gpt-4o', costPer1k: 0.005 },
      
      // Premium
      opus: { provider: 'anthropic', model: 'claude-opus-4-20250514', costPer1k: 0.015 },
    };

    this.routing = config.routing || {
      simple_chat: 'haiku',
      code_generation: 'sonnet',
      complex_reasoning: 'opus',
      quick_task: 'glm-5',
      default: 'sonnet',
    };

    this.userBudgets = new Map();
  }

  // Route based on task type
  route(taskType, user = null) {
    // Check user budget if applicable
    if (user) {
      const budget = this.userBudgets.get(user.id);
      if (budget && budget.remaining < budget.threshold) {
        return this.getCheapestModel();
      }
    }

    const modelKey = this.routing[taskType] || this.routing.default;
    return this.models[modelKey];
  }

  // Get cheapest available model
  getCheapestModel() {
    let cheapest = null;
    let lowestCost = Infinity;

    for (const [key, model] of Object.entries(this.models)) {
      if (model.costPer1k < lowestCost) {
        lowestCost = model.costPer1k;
        cheapest = { key, ...model };
      }
    }

    return cheapest;
  }

  // Detect task type from message
  detectTaskType(message) {
    const patterns = {
      code_generation: /(?:write|create|implement|code|function|class|script)/i,
      complex_reasoning: /(?:analyze|explain why|compare|evaluate|research)/i,
      quick_task: /(?:what is|who is|when|define|list)/i,
      simple_chat: /(?:hello|hi|thanks|ok|sure|yes|no)/i,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(message)) {
        return type;
      }
    }

    return 'default';
  }

  // Set user budget
  setBudget(userId, budget) {
    this.userBudgets.set(userId, {
      total: budget,
      remaining: budget,
      threshold: budget * 0.1, // Downgrade at 10% remaining
    });
  }

  // Deduct from budget
  deductBudget(userId, amount) {
    const budget = this.userBudgets.get(userId);
    if (budget) {
      budget.remaining = Math.max(0, budget.remaining - amount);
    }
  }

  // Get routing decision with explanation
  getRoutingDecision(message, user = null) {
    const taskType = this.detectTaskType(message);
    const model = this.route(taskType, user);
    
    return {
      taskType,
      model: model.model,
      provider: model.provider,
      estimatedCostPer1k: model.costPer1k,
      reason: `Task type '${taskType}' routes to ${model.model}`,
    };
  }
}

export default ModelRouter;