/**
 * Reflexion Engine - Self-improvement through critique and revision
 * Based on NeurIPS research on self-improving agents
 */

export class ReflexionEngine {
  constructor(config = {}) {
    this.maxRetries = config.maxRetries || 3;
    this.memory = config.memory;
    this.reflections = [];
  }

  // Execute with reflexion loop
  async executeWithReflection(task, executor) {
    let attempt = 0;
    let lastResult = null;
    let lastReflection = null;

    while (attempt < this.maxRetries) {
      attempt++;

      // Execute the task
      const result = await executor(task, lastReflection);
      lastResult = result;

      // If successful, store and return
      if (result.success) {
        if (lastReflection) {
          await this.storeReflection({
            task,
            attempts: attempt,
            finalReflection: lastReflection,
            outcome: 'success',
          });
        }
        return result;
      }

      // Reflect on failure
      lastReflection = await this.reflect(task, result);
      
      // Store reflection
      this.reflections.push(lastReflection);
    }

    // Max retries reached
    await this.storeReflection({
      task,
      attempts: attempt,
      finalReflection: lastReflection,
      outcome: 'max_retries',
    });

    return {
      success: false,
      result: lastResult,
      reflection: lastReflection,
      attempts: attempt,
    };
  }

  // Generate reflection on failure
  async reflect(task, result) {
    return {
      timestamp: new Date().toISOString(),
      task: this.summarizeTask(task),
      whatFailed: result.error || 'Unknown error',
      possibleCauses: this.analyzeCauses(result),
      suggestedFixes: this.suggestFixes(result),
      shouldRetry: this.shouldRetry(result),
    };
  }

  // Analyze possible causes
  analyzeCauses(result) {
    const causes = [];
    
    if (result.error?.includes('timeout')) {
      causes.push('Operation took too long');
    }
    if (result.error?.includes('not found')) {
      causes.push('Resource or dependency missing');
    }
    if (result.error?.includes('permission')) {
      causes.push('Insufficient permissions');
    }
    if (result.error?.includes('syntax')) {
      causes.push('Syntax or formatting error');
    }
    
    if (causes.length === 0) {
      causes.push('Unexpected error - needs investigation');
    }
    
    return causes;
  }

  // Suggest fixes based on error
  suggestFixes(result) {
    const fixes = [];
    
    if (result.error?.includes('timeout')) {
      fixes.push('Increase timeout', 'Break into smaller steps');
    }
    if (result.error?.includes('not found')) {
      fixes.push('Verify resource exists', 'Check path/URL');
    }
    if (result.error?.includes('permission')) {
      fixes.push('Check credentials', 'Request access');
    }
    
    fixes.push('Try alternative approach');
    
    return fixes;
  }

  // Determine if retry is worthwhile
  shouldRetry(result) {
    // Don't retry permanent failures
    const permanentErrors = ['permission denied', 'not authorized', 'invalid credentials'];
    
    for (const err of permanentErrors) {
      if (result.error?.toLowerCase().includes(err)) {
        return false;
      }
    }
    
    return true;
  }

  // Summarize task for logging
  summarizeTask(task) {
    if (typeof task === 'string') {
      return task.slice(0, 100);
    }
    return JSON.stringify(task).slice(0, 100);
  }

  // Store reflection to memory
  async storeReflection(reflection) {
    if (this.memory) {
      await this.memory.saveLongTerm('reflection', reflection);
    }
  }

  // Get past reflections for similar tasks
  async getRelevantReflections(task) {
    // TODO: Implement semantic search
    return this.reflections.filter(r => 
      this.summarizeTask(task).includes(r.task) ||
      r.task.includes(this.summarizeTask(task))
    );
  }

  // Learn from past reflections
  async applyLearnings(task) {
    const relevant = await this.getRelevantReflections(task);
    
    if (relevant.length === 0) return null;

    return {
      pastAttempts: relevant.length,
      commonFailures: this.findCommonPatterns(relevant, 'whatFailed'),
      successfulFixes: this.findCommonPatterns(relevant.filter(r => r.outcome === 'success'), 'suggestedFixes'),
    };
  }

  // Find common patterns
  findCommonPatterns(reflections, field) {
    const counts = {};
    
    for (const r of reflections) {
      const values = Array.isArray(r[field]) ? r[field] : [r[field]];
      for (const v of values) {
        counts[v] = (counts[v] || 0) + 1;
      }
    }
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
  }
}

export default ReflexionEngine;