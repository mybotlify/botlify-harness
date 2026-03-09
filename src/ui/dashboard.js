/**
 * Dashboard UI - Web-based control panel
 */

export function renderDashboard(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Botlify Harness</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: { bg: '#0a0a0a', card: '#141414', border: '#333', accent: '#ff6b35' }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-brand-bg text-white min-h-screen">
  <nav class="border-b border-brand-border p-4">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <h1 class="text-xl font-bold text-brand-accent">Botlify Harness</h1>
      <div class="flex gap-4 text-sm text-gray-400">
        <a href="/" class="hover:text-white">Dashboard</a>
        <a href="/logs" class="hover:text-white">Logs</a>
        <a href="/settings" class="hover:text-white">Settings</a>
      </div>
    </div>
  </nav>

  <main class="max-w-6xl mx-auto p-6">
    <!-- Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-brand-card border border-brand-border rounded-lg p-4">
        <div class="text-gray-400 text-sm">Watchdog</div>
        <div class="text-2xl font-bold ${data.watchdog?.running ? 'text-green-500' : 'text-red-500'}">
          ${data.watchdog?.running ? '● Running' : '○ Stopped'}
        </div>
      </div>
      
      <div class="bg-brand-card border border-brand-border rounded-lg p-4">
        <div class="text-gray-400 text-sm">Context Usage</div>
        <div class="text-2xl font-bold">${data.context?.usagePercent || 0}%</div>
        <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div class="bg-brand-accent h-2 rounded-full" style="width: ${data.context?.usagePercent || 0}%"></div>
        </div>
      </div>
      
      <div class="bg-brand-card border border-brand-border rounded-lg p-4">
        <div class="text-gray-400 text-sm">Skills Loaded</div>
        <div class="text-2xl font-bold">${data.skills?.length || 0}</div>
      </div>
      
      <div class="bg-brand-card border border-brand-border rounded-lg p-4">
        <div class="text-gray-400 text-sm">Memory Entries</div>
        <div class="text-2xl font-bold">${data.memory?.count || 0}</div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-brand-card border border-brand-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold mb-4">Recent Activity</h2>
      <div class="space-y-2 text-sm">
        ${(data.activity || []).map(a => `
          <div class="flex justify-between py-2 border-b border-brand-border">
            <span class="text-gray-400">${a.timestamp}</span>
            <span>${a.type}</span>
            <span class="text-gray-300">${a.message}</span>
          </div>
        `).join('')}
        ${(!data.activity?.length) ? '<p class="text-gray-500">No recent activity</p>' : ''}
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-brand-card border border-brand-border rounded-lg p-6">
      <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
      <div class="flex gap-4">
        <button onclick="restart()" class="px-4 py-2 bg-brand-accent hover:bg-orange-600 rounded-lg transition">
          Restart Agent
        </button>
        <button onclick="clearContext()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
          Clear Context
        </button>
        <button onclick="saveCheckpoint()" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
          Save Checkpoint
        </button>
      </div>
    </div>
  </main>

  <script>
    async function restart() {
      await fetch('/watchdog/restart', { method: 'POST' });
      location.reload();
    }
    async function clearContext() {
      await fetch('/context/clear', { method: 'POST' });
      location.reload();
    }
    async function saveCheckpoint() {
      await fetch('/hooks/checkpoint', { method: 'POST' });
      alert('Checkpoint saved');
    }
  </script>
</body>
</html>`;
}

export default renderDashboard;