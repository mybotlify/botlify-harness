/**
 * Memory System - Three-tier architecture
 * Short-term (session), Long-term (persistent), Episodic (searchable)
 */

export class MemorySystem {
  constructor(config = {}) {
    this.shortTerm = new Map();
    this.config = {
      supabaseUrl: config.supabaseUrl || process.env.SUPABASE_URL,
      supabaseKey: config.supabaseKey || process.env.SUPABASE_KEY,
      ...config
    };
  }

  // Short-term: Current session
  setShortTerm(key, value) {
    this.shortTerm.set(key, { value, timestamp: Date.now() });
  }

  getShortTerm(key) {
    return this.shortTerm.get(key)?.value;
  }

  // Long-term: Persistent storage
  async saveLongTerm(category, data) {
    const entry = {
      category,
      data,
      timestamp: new Date().toISOString(),
    };
    
    // Log to file
    const date = new Date().toISOString().split('T')[0];
    const path = `memory/${date}.md`;
    await this.appendToFile(path, this.formatEntry(entry));
    
    // Log to Supabase if configured
    if (this.config.supabaseUrl) {
      await this.logToSupabase(entry);
    }
    
    return entry;
  }

  // Episodic: Semantic search over past experiences
  async searchEpisodic(query, limit = 5) {
    // TODO: Implement vector search
    // For now, simple keyword match
    return [];
  }

  // Helpers
  formatEntry(entry) {
    return `\n## [${entry.timestamp}] ${entry.category}\n${JSON.stringify(entry.data, null, 2)}\n`;
  }

  async appendToFile(path, content) {
    const fs = await import('fs/promises');
    const dir = path.split('/').slice(0, -1).join('/');
    await fs.mkdir(dir, { recursive: true }).catch(() => {});
    await fs.appendFile(path, content);
  }

  async logToSupabase(entry) {
    if (!this.config.supabaseUrl || !this.config.supabaseKey) return;
    
    try {
      const response = await fetch(`${this.config.supabaseUrl}/rest/v1/context_log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.supabaseKey,
          'Authorization': `Bearer ${this.config.supabaseKey}`,
        },
        body: JSON.stringify({
          content: typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data),
          entry_type: entry.category,
          created_at: entry.timestamp,
        }),
      });
      
      if (!response.ok) {
        console.error('Supabase log failed:', response.status);
      }
    } catch (err) {
      console.error('Supabase error:', err.message);
    }
  }

  // Auto-capture patterns
  detectAndCapture(message) {
    const patterns = {
      decision: /(?:let's|we'll|decided|going with|use|choose)/i,
      idea: /(?:what if|could we|idea:|maybe we|how about)/i,
      resource: /https?:\/\/\S+/,
      remember: /(?:remember|don't forget|note that|save this)/i,
    };

    const captures = [];
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(message)) {
        captures.push({ type, content: message });
      }
    }
    return captures;
  }
}

export default MemorySystem;