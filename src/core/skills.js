/**
 * Skills Engine - Progressive disclosure architecture
 * Level 1: YAML frontmatter (always loaded)
 * Level 2: SKILL.md body (loaded when relevant)
 * Level 3: References (loaded on demand)
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

export class SkillsEngine {
  constructor(config = {}) {
    this.skillsPath = config.skillsPath || './skills';
    this.skills = new Map();
    this.loaded = false;
  }

  // Load all skills (Level 1 only)
  async loadSkills() {
    try {
      const dirs = await readdir(this.skillsPath, { withFileTypes: true });
      
      for (const dir of dirs) {
        if (dir.isDirectory()) {
          const skill = await this.loadSkillMeta(dir.name);
          if (skill) {
            this.skills.set(dir.name, skill);
          }
        }
      }
      
      this.loaded = true;
    } catch (error) {
      console.error('Failed to load skills:', error);
    }
  }

  // Load Level 1: Metadata only
  async loadSkillMeta(name) {
    const skillPath = join(this.skillsPath, name, 'SKILL.md');
    
    try {
      const content = await readFile(skillPath, 'utf-8');
      const meta = this.parseFrontmatter(content);
      
      return {
        name,
        meta,
        level: 1,
        path: skillPath,
      };
    } catch {
      return null;
    }
  }

  // Load Level 2: Full skill body
  async loadSkillBody(name) {
    const skill = this.skills.get(name);
    if (!skill) return null;

    if (skill.level >= 2) return skill;

    const content = await readFile(skill.path, 'utf-8');
    skill.body = this.parseBody(content);
    skill.level = 2;

    return skill;
  }

  // Load Level 3: References
  async loadSkillReferences(name) {
    const skill = await this.loadSkillBody(name);
    if (!skill) return null;

    if (skill.level >= 3) return skill;

    const refsPath = join(this.skillsPath, name, 'references');
    
    try {
      const refs = await readdir(refsPath);
      skill.references = [];
      
      for (const ref of refs) {
        const refContent = await readFile(join(refsPath, ref), 'utf-8');
        skill.references.push({ name: ref, content: refContent });
      }
      
      skill.level = 3;
    } catch {
      skill.references = [];
      skill.level = 3;
    }

    return skill;
  }

  // Match user intent to skills
  matchSkill(intent) {
    const matches = [];
    
    for (const [name, skill] of this.skills) {
      const score = this.calculateMatch(intent, skill.meta);
      if (score > 0.5) {
        matches.push({ name, skill, score });
      }
    }
    
    return matches.sort((a, b) => b.score - a.score);
  }

  // Simple keyword matching (replace with semantic later)
  calculateMatch(intent, meta) {
    if (!meta.keywords) return 0;
    
    const intentWords = intent.toLowerCase().split(/\s+/);
    const keywords = meta.keywords.map(k => k.toLowerCase());
    
    let matches = 0;
    for (const word of intentWords) {
      if (keywords.some(k => k.includes(word) || word.includes(k))) {
        matches++;
      }
    }
    
    return matches / Math.max(intentWords.length, keywords.length);
  }

  // Parse YAML frontmatter
  parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const yaml = match[1];
    const meta = {};
    
    for (const line of yaml.split('\n')) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        const value = valueParts.join(':').trim();
        meta[key.trim()] = value.startsWith('[') 
          ? value.slice(1, -1).split(',').map(s => s.trim())
          : value;
      }
    }
    
    return meta;
  }

  // Parse body (after frontmatter)
  parseBody(content) {
    return content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  }

  // Get all loaded skills
  getSkills() {
    return Array.from(this.skills.values());
  }
}

export default SkillsEngine;