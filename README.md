# Botlify Harness

Production infrastructure for Botlify AI agents.

## Features

- **Memory System** — Three-tier: short-term, long-term, episodic
- **Context Manager** — Auto-save at 70%, warn at 80%
- **Watchdog** — Self-healing with crash recovery
- **Hooks Engine** — Event-driven automation
- **Skills Engine** — Progressive disclosure architecture
- **Model Router** — Cost-aware intelligent routing
- **Reflexion Engine** — Self-improvement through critique
- **Web Dashboard** — Browser-based control panel

## Quick Start

```bash
npm install
npm start
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/memory` | POST | Save to long-term memory |
| `/hooks/:event` | POST | Trigger a hook |
| `/context/update` | POST | Update context usage |
| `/watchdog/status` | GET | Watchdog status |
| `/watchdog/restart` | POST | Restart managed process |

## Architecture

```
src/
├── index.js           # Main entry
├── core/
│   ├── memory.js      # Memory system
│   └── context.js     # Context manager
├── hooks/
│   └── index.js       # Hooks engine
└── watchdog/
    └── index.js       # Self-healing
```

## License

MIT
