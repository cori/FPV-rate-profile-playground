/**
 * FPV Rate Profile Comparison Tool - Val.town Version
 *
 * A self-contained web app for comparing Betaflight rate profiles.
 * This version bundles all HTML, CSS, and JavaScript into a single file for Val.town.
 *
 * Usage on Val.town:
 * 1. Create a new HTTP val
 * 2. Copy this entire file
 * 3. Your val will be live at https://username-valname.web.val.run
 *
 * Original repo: https://github.com/cori/FPV-rate-profile-playground
 */

export default function(req: Request): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FPV Rate Profile Comparison Tool</title>
    <style>
    /* Reset and Base Styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg-dark: #0d1117;
      --bg-secondary: #161b22;
      --bg-tertiary: #1a1f26;
      --border-color: #30363d;
      --text-primary: #c9d1d9;
      --text-secondary: #8b949e;
      --text-muted: #6e7681;
      --color-roll: #ff3366;
      --color-pitch: #33ff66;
      --color-yaw: #ffaa00;
      --color-throttle: #00aaff;
      --color-primary: #238636;
      --color-primary-hover: #2ea043;
      --color-secondary: #21262d;
      --color-secondary-hover: #30363d;
      --color-danger: #da3633;
      --color-danger-hover: #f85149;
      --color-success: #238636;
      --color-error: #da3633;
      --color-warning: #d29922;
      --spacing-xs: 0.25rem;
      --spacing-sm: 0.5rem;
      --spacing-md: 1rem;
      --spacing-lg: 1.5rem;
      --spacing-xl: 2rem;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }

    .container { max-width: 1600px; margin: 0 auto; padding: var(--spacing-xl); }

    header {
      text-align: center;
      margin-bottom: var(--spacing-xl);
      padding-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--border-color);
    }

    header h1 {
      font-size: 2.5rem;
      font-weight: 600;
      margin-bottom: var(--spacing-sm);
    }

    .subtitle { color: var(--text-secondary); font-size: 1.1rem; }

    .comparison-section { margin-bottom: var(--spacing-xl); }

    .graph-controls {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }

    .control-group h3 {
      font-size: 1.1rem;
      margin-bottom: var(--spacing-md);
    }

    .toggle-group {
      display: flex;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-md);
      flex-wrap: wrap;
    }

    .toggle-group label {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      cursor: pointer;
      user-select: none;
    }

    .toggle-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .color-indicator {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 3px;
    }

    .color-indicator.roll { background-color: var(--color-roll); }
    .color-indicator.pitch { background-color: var(--color-pitch); }
    .color-indicator.yaw { background-color: var(--color-yaw); }

    .graphs-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-xl);
    }

    .graph-panel {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: var(--spacing-lg);
    }

    .graph-panel h2 {
      font-size: 1.3rem;
      margin-bottom: var(--spacing-md);
    }

    .graph-panel canvas {
      width: 100%;
      height: auto;
      border-radius: 4px;
      background-color: #1a1a1a;
    }

    .graph-legend {
      display: flex;
      gap: var(--spacing-lg);
      margin-top: var(--spacing-md);
      flex-wrap: wrap;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .line-solid, .line-dashed {
      display: inline-block;
      width: 30px;
      height: 3px;
    }

    .line-solid.roll { background-color: var(--color-roll); }
    .line-solid.pitch { background-color: var(--color-pitch); }
    .line-solid.yaw { background-color: var(--color-yaw); }
    .line-solid.throttle { background-color: var(--color-throttle); }
    .line-solid { background-color: var(--text-secondary); }
    .line-dashed {
      background-image: repeating-linear-gradient(to right, var(--text-secondary) 0, var(--text-secondary) 10px, transparent 10px, transparent 15px);
    }
    .line-dashed.throttle {
      background-image: repeating-linear-gradient(to right, var(--color-throttle) 0, var(--color-throttle) 10px, transparent 10px, transparent 15px);
    }

    .separator { color: var(--border-color); }

    .editors-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
    }

    @media (max-width: 1200px) {
      .editors-section { grid-template-columns: 1fr; }
    }

    .profile-editor {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: var(--spacing-lg);
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .editor-header h2 { font-size: 1.5rem; }

    .profile-actions {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
    }

    .profile-name-input {
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--bg-dark);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 0.95rem;
      min-width: 200px;
    }

    .profile-name-input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }

    .control-section h3 {
      font-size: 1.1rem;
      margin-bottom: var(--spacing-md);
    }

    .roll-heading { color: var(--color-roll); }
    .pitch-heading { color: var(--color-pitch); }
    .yaw-heading { color: var(--color-yaw); }

    .control-item { margin-bottom: var(--spacing-md); }

    .control-item label {
      display: block;
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xs);
    }

    .control-item input[type="range"] {
      width: 100%;
      height: 6px;
      background: var(--bg-dark);
      border-radius: 3px;
      outline: none;
      -webkit-appearance: none;
      margin-bottom: var(--spacing-xs);
    }

    .control-item input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      background: var(--color-primary);
      border-radius: 50%;
      cursor: pointer;
    }

    .control-item input[type="range"]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: var(--color-primary);
      border-radius: 50%;
      cursor: pointer;
      border: none;
    }

    .value-display {
      display: inline-block;
      min-width: 50px;
      padding: var(--spacing-xs) var(--spacing-sm);
      background-color: var(--bg-dark);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 0.9rem;
      text-align: center;
      font-family: 'Courier New', monospace;
    }

    .cli-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--border-color);
    }

    @media (max-width: 768px) {
      .cli-section { grid-template-columns: 1fr; }
    }

    .cli-import h3, .cli-export h3 {
      font-size: 1rem;
      margin-bottom: var(--spacing-sm);
    }

    .cli-section textarea {
      width: 100%;
      padding: var(--spacing-md);
      background-color: var(--bg-dark);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-primary);
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      resize: vertical;
      margin-bottom: var(--spacing-sm);
    }

    .cli-section textarea:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .btn {
      padding: var(--spacing-sm) var(--spacing-lg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      background-color: var(--color-secondary);
      color: var(--text-primary);
    }

    .btn:hover { background-color: var(--color-secondary-hover); }
    .btn:active { transform: scale(0.98); }

    .btn-primary {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      color: white;
    }

    .btn-primary:hover {
      background-color: var(--color-primary-hover);
      border-color: var(--color-primary-hover);
    }

    .btn-secondary {
      background-color: var(--color-secondary);
      border-color: var(--border-color);
    }

    .btn-secondary:hover { background-color: var(--color-secondary-hover); }

    .btn-danger {
      background-color: var(--color-danger);
      border-color: var(--color-danger);
      color: white;
    }

    .btn-danger:hover {
      background-color: var(--color-danger-hover);
      border-color: var(--color-danger-hover);
    }

    .btn-small {
      padding: var(--spacing-xs) var(--spacing-md);
      font-size: 0.85rem;
    }

    .status-message {
      display: inline-block;
      margin-left: var(--spacing-sm);
      font-size: 0.9rem;
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: 4px;
    }

    .status-message.success {
      color: var(--color-success);
      background-color: rgba(35, 134, 54, 0.15);
    }

    .status-message.error {
      color: var(--color-error);
      background-color: rgba(218, 54, 51, 0.15);
    }

    .status-message.warning {
      color: var(--color-warning);
      background-color: rgba(210, 153, 34, 0.15);
    }

    .history-section {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: var(--spacing-lg);
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .history-header h2 { font-size: 1.5rem; }

    .history-actions {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .history-list { display: grid; gap: var(--spacing-md); }

    .history-item {
      background-color: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: var(--spacing-md);
      transition: border-color 0.2s;
    }

    .history-item:hover { border-color: var(--text-muted); }

    .history-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
      gap: var(--spacing-md);
      flex-wrap: wrap;
    }

    .history-item-header h4 {
      font-size: 1.1rem;
      margin: 0;
    }

    .history-timestamp {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .history-item-actions {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .empty-history {
      text-align: center;
      color: var(--text-muted);
      padding: var(--spacing-xl);
      font-style: italic;
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    button:focus-visible, input:focus-visible, textarea:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    @media (prefers-contrast: high) {
      :root {
        --border-color: #ffffff;
        --text-primary: #ffffff;
      }
    }

    @media (max-width: 768px) {
      .container { padding: var(--spacing-md); }
      header h1 { font-size: 2rem; }
      .controls-grid { grid-template-columns: 1fr; }
    }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>FPV Rate Profile Comparison Tool</h1>
            <p class="subtitle">Compare and analyze Betaflight rate profiles side-by-side</p>
        </header>

        <div class="comparison-section">
            <div class="graph-controls">
                <div class="control-group">
                    <h3>Visibility Controls</h3>
                    <div class="toggle-group">
                        <label><input type="checkbox" id="toggle-profile-a" checked> Profile A (Solid)</label>
                        <label><input type="checkbox" id="toggle-profile-b" checked> Profile B (Dashed)</label>
                    </div>
                    <div class="toggle-group">
                        <label><input type="checkbox" id="toggle-roll" checked> <span class="color-indicator roll"></span> Roll</label>
                        <label><input type="checkbox" id="toggle-pitch" checked> <span class="color-indicator pitch"></span> Pitch</label>
                        <label><input type="checkbox" id="toggle-yaw" checked> <span class="color-indicator yaw"></span> Yaw</label>
                    </div>
                </div>
            </div>

            <div class="graphs-container">
                <div class="graph-panel">
                    <h2>Rate Curves</h2>
                    <canvas id="rate-canvas" width="900" height="500"></canvas>
                    <div class="graph-legend">
                        <span class="legend-item"><span class="line-solid roll"></span> Roll</span>
                        <span class="legend-item"><span class="line-solid pitch"></span> Pitch</span>
                        <span class="legend-item"><span class="line-solid yaw"></span> Yaw</span>
                        <span class="separator">|</span>
                        <span class="legend-item"><span class="line-solid"></span> Profile A</span>
                        <span class="legend-item"><span class="line-dashed"></span> Profile B</span>
                    </div>
                </div>

                <div class="graph-panel">
                    <h2>Throttle Curves</h2>
                    <canvas id="throttle-canvas" width="900" height="500"></canvas>
                    <div class="graph-legend">
                        <span class="legend-item"><span class="line-solid throttle"></span> Profile A</span>
                        <span class="legend-item"><span class="line-dashed throttle"></span> Profile B</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="editors-section">
            ${generateProfileEditor('a', 'A')}
            ${generateProfileEditor('b', 'B')}
        </div>

        <div class="history-section">
            <div class="history-header">
                <h2>Profile History</h2>
                <div class="history-actions">
                    <button id="export-history-btn" class="btn btn-secondary">Export History</button>
                    <button id="import-history-btn" class="btn btn-secondary">Import History</button>
                    <button id="clear-history-btn" class="btn btn-danger">Clear All</button>
                </div>
            </div>
            <div class="history-timeline">
                <div id="history-list" class="history-list"></div>
            </div>
            <input type="file" id="history-file-input" accept=".json" style="display: none;">
        </div>
    </div>

    <script type="module">
${generateInlineJavaScript()}
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function generateProfileEditor(id: string, label: string): string {
  return `<div class="profile-editor" data-profile="${id}">
                <div class="editor-header">
                    <h2>Profile ${label}</h2>
                    <div class="profile-actions">
                        <input type="text" id="profile-${id}-name" placeholder="Profile Name" class="profile-name-input">
                        <button id="save-profile-${id}" class="btn btn-primary">Save Profile</button>
                    </div>
                </div>

                <div class="controls-grid">
                    ${['roll', 'pitch', 'yaw'].map(axis => `
                    <div class="control-section">
                        <h3 class="${axis}-heading">${axis.charAt(0).toUpperCase() + axis.slice(1)}</h3>
                        <div class="control-item">
                            <label for="${id}-${axis}-center">Center Sensitivity (0-255):</label>
                            <input type="range" id="${id}-${axis}-center" min="0" max="255" value="70" step="1">
                            <span id="${id}-${axis}-center-value" class="value-display">70</span>
                        </div>
                        <div class="control-item">
                            <label for="${id}-${axis}-max">Max Rate (deg/s):</label>
                            <input type="range" id="${id}-${axis}-max" min="200" max="2000" value="670" step="10">
                            <span id="${id}-${axis}-max-value" class="value-display">670</span>
                        </div>
                        <div class="control-item">
                            <label for="${id}-${axis}-expo">Expo (0-100):</label>
                            <input type="range" id="${id}-${axis}-expo" min="0" max="100" value="0" step="1">
                            <span id="${id}-${axis}-expo-value" class="value-display">0</span>
                        </div>
                    </div>
                    `).join('')}

                    <div class="control-section">
                        <h3>Throttle</h3>
                        <div class="control-item">
                            <label for="${id}-throttle-mid">Mid Point (0-100):</label>
                            <input type="range" id="${id}-throttle-mid" min="0" max="100" value="50" step="1">
                            <span id="${id}-throttle-mid-value" class="value-display">50</span>
                        </div>
                        <div class="control-item">
                            <label for="${id}-throttle-expo">Expo (0-100):</label>
                            <input type="range" id="${id}-throttle-expo" min="0" max="100" value="0" step="1">
                            <span id="${id}-throttle-expo-value" class="value-display">0</span>
                        </div>
                    </div>
                </div>

                <div class="cli-section">
                    <div class="cli-import">
                        <h3>Import from CLI</h3>
                        <textarea id="import-${id}" placeholder="Paste Betaflight CLI dump here..." rows="4"></textarea>
                        <button id="import-btn-${id}" class="btn btn-secondary">Import</button>
                        <span id="import-status-${id}" class="status-message"></span>
                    </div>
                    <div class="cli-export">
                        <h3>Export to CLI</h3>
                        <textarea id="export-${id}" readonly rows="4"></textarea>
                        <button id="copy-btn-${id}" class="btn btn-secondary">Copy</button>
                        <span id="export-status-${id}" class="status-message"></span>
                    </div>
                </div>
            </div>`;
}

function generateInlineJavaScript(): string {
  // All JavaScript code inlined here...
  // This is getting very long, so I'll need to continue in the next part
  return `// Rate Calculator Functions
function calculateActualRate(rcCommand, center, maxRate, expo) {
  const rcCommandAbs = Math.abs(rcCommand);
  let expof;
  if (expo > 0) {
    const expoPower = 3;
    expof = (expo / 100.0) * Math.pow(rcCommandAbs, expoPower) + rcCommandAbs * (1 - expo / 100.0);
  } else {
    expof = rcCommandAbs;
  }
  const centerSensitivity = center * 10;
  const rate = rcCommandAbs * centerSensitivity + expof * (maxRate - centerSensitivity);
  return rcCommand >= 0 ? rate : -rate;
}

function calculateThrottle(input, midPoint, expo) {
  const mid = midPoint / 100;
  const expoNorm = expo / 100;
  const expof = input * (1 - expoNorm) + Math.pow(input, 3) * expoNorm;
  let throttle;
  if (expof < 0.5) {
    throttle = expof * 2 * mid;
  } else {
    throttle = mid + (expof - 0.5) * 2 * (1 - mid);
  }
  return throttle;
}

// CLI Parser Functions
function parseCLI(text) {
  const settings = {};
  const lines = text.split('\\n');
  for (const line of lines) {
    const match = line.match(/^\\s*(?:set\\s+)?([a-z_]+)\\s*=\\s*(.+?)\\s*$/i);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      settings[key] = value;
    }
  }
  return settings;
}

function generateCLI(profile) {
  const commands = [
    '# Betaflight Rate Profile Configuration',
    '# Generated by FPV Rate Profile Comparison Tool',
    ''
  ];
  if (profile.name) {
    commands.push(\`# Profile: \${profile.name}\`);
    commands.push('');
  }
  commands.push(
    '# Rate Type',
    'set rates_type = ACTUAL',
    '',
    '# Roll Rates',
    \`set roll_rc_rate = \${profile.rates.roll.center}\`,
    \`set roll_rate = \${profile.rates.roll.maxRate}\`,
    \`set roll_expo = \${profile.rates.roll.expo}\`,
    '',
    '# Pitch Rates',
    \`set pitch_rc_rate = \${profile.rates.pitch.center}\`,
    \`set pitch_rate = \${profile.rates.pitch.maxRate}\`,
    \`set pitch_expo = \${profile.rates.pitch.expo}\`,
    '',
    '# Yaw Rates',
    \`set yaw_rc_rate = \${profile.rates.yaw.center}\`,
    \`set yaw_rate = \${profile.rates.yaw.maxRate}\`,
    \`set yaw_expo = \${profile.rates.yaw.expo}\`,
    '',
    '# Throttle',
    \`set thr_mid = \${profile.throttle.mid}\`,
    \`set thr_expo = \${profile.throttle.expo}\`,
    '',
    'save'
  );
  return commands.join('\\n');
}

// Profile Manager Class
class ProfileManager {
  constructor(storage = null) {
    this.storage = storage || window.localStorage;
    this.storageKey = 'fpv-rate-profiles';
    this.profiles = this.loadFromStorage();
  }

  loadFromStorage() {
    if (!this.storage) return [];
    try {
      const data = this.storage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load profiles:', error);
      return [];
    }
  }

  saveToStorage() {
    if (!this.storage) return;
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(this.profiles));
    } catch (error) {
      console.error('Failed to save profiles:', error);
    }
  }

  createDefaultProfile(name = 'Default Profile') {
    return {
      name,
      rates: {
        roll: { center: 70, maxRate: 670, expo: 0 },
        pitch: { center: 70, maxRate: 670, expo: 0 },
        yaw: { center: 70, maxRate: 670, expo: 0 }
      },
      throttle: { mid: 50, expo: 0 }
    };
  }

  saveProfile(profile) {
    const profileWithTimestamp = { ...profile, timestamp: Date.now() };
    this.profiles.push(profileWithTimestamp);
    this.saveToStorage();
    return profileWithTimestamp;
  }

  getProfiles() {
    return [...this.profiles];
  }

  getHistory() {
    return this.getProfiles();
  }

  deleteProfile(timestamp) {
    this.profiles = this.profiles.filter(p => p.timestamp !== timestamp);
    this.saveToStorage();
  }

  exportHistory() {
    return JSON.stringify(this.profiles, null, 2);
  }

  importHistory(jsonString, merge = true) {
    try {
      const imported = JSON.parse(jsonString);
      if (!Array.isArray(imported)) {
        throw new Error('Invalid history format');
      }
      if (merge) {
        this.profiles = [...this.profiles, ...imported];
      } else {
        this.profiles = imported;
      }
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to import history:', error);
      throw error;
    }
  }

  clearAll() {
    this.profiles = [];
    this.saveToStorage();
  }
}

// Graph Renderer Class
class GraphRenderer {
  constructor(rateCanvas, throttleCanvas) {
    this.rateCanvas = rateCanvas;
    this.throttleCanvas = throttleCanvas;
    this.rateCtx = rateCanvas.getContext('2d');
    this.throttleCtx = throttleCanvas.getContext('2d');
    this.colors = { roll: '#ff3366', pitch: '#33ff66', yaw: '#ffaa00' };
    this.padding = 60;
    this.gridColor = '#333';
    this.axisColor = '#666';
    this.labelColor = '#999';
    this.visibility = { profileA: true, profileB: true, roll: true, pitch: true, yaw: true };
  }

  setVisibility(visibility) {
    this.visibility = { ...this.visibility, ...visibility };
  }

  clearCanvas(ctx, width, height) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
  }

  drawGrid(ctx, width, height) {
    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    for (let i = 0; i <= 10; i++) {
      const x = this.padding + (width - 2 * this.padding) * (i / 10);
      ctx.beginPath();
      ctx.moveTo(x, this.padding);
      ctx.lineTo(x, height - this.padding);
      ctx.stroke();
    }
    for (let i = 0; i <= 10; i++) {
      const y = this.padding + (height - 2 * this.padding) * (i / 10);
      ctx.beginPath();
      ctx.moveTo(this.padding, y);
      ctx.lineTo(width - this.padding, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  drawRateAxes(ctx, width, height, yMax) {
    ctx.strokeStyle = this.axisColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.padding, this.padding);
    ctx.lineTo(this.padding, height - this.padding);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.padding, height / 2);
    ctx.lineTo(width - this.padding, height / 2);
    ctx.stroke();
    ctx.fillStyle = this.labelColor;
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = yMax - (i * yMax / 2);
      const y = this.padding + (height - 2 * this.padding) * (i / 4);
      ctx.fillText(Math.round(value) + '°/s', this.padding - 10, y + 4);
    }
    ctx.textAlign = 'center';
    ctx.fillText('-1.0', this.padding, height - this.padding + 20);
    ctx.fillText('0.0', width / 2, height - this.padding + 20);
    ctx.fillText('1.0', width - this.padding, height - this.padding + 20);
    ctx.fillText('RC Command', width / 2, height - 10);
  }

  drawThrottleAxes(ctx, width, height) {
    ctx.strokeStyle = this.axisColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.padding, this.padding);
    ctx.lineTo(this.padding, height - this.padding);
    ctx.lineTo(width - this.padding, height - this.padding);
    ctx.stroke();
    ctx.fillStyle = this.labelColor;
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const value = 1.0 - (i / 10);
      const y = this.padding + (height - 2 * this.padding) * (i / 10);
      ctx.fillText(value.toFixed(1), this.padding - 10, y + 4);
    }
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) {
      const value = i / 10;
      const x = this.padding + (width - 2 * this.padding) * (i / 10);
      ctx.fillText(value.toFixed(1), x, height - this.padding + 20);
    }
    ctx.fillText('Throttle Input', width / 2, height - 10);
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Throttle Output', 0, 0);
    ctx.restore();
  }

  drawRateCurve(ctx, width, height, rates, color, yMax, dashed = false) {
    const steps = 200;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash(dashed ? [10, 5] : []);
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const rcCommand = -1 + (2 * i / steps);
      const rateValue = calculateActualRate(rcCommand, rates.center, rates.maxRate, rates.expo);
      const x = this.padding + (width - 2 * this.padding) * ((rcCommand + 1) / 2);
      const y = (height / 2) - ((rateValue / yMax) * (height - 2 * this.padding) / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawThrottleCurve(ctx, width, height, throttle, color, dashed = false) {
    const steps = 200;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash(dashed ? [10, 5] : []);
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const input = i / steps;
      const throttleValue = calculateThrottle(input, throttle.mid, throttle.expo);
      const x = this.padding + (width - 2 * this.padding) * input;
      const y = height - this.padding - (height - 2 * this.padding) * throttleValue;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  calculateMaxRate(profileA, profileB) {
    const axes = ['roll', 'pitch', 'yaw'];
    let maxRate = 0;
    axes.forEach(axis => {
      if (this.visibility[axis]) {
        if (profileA && this.visibility.profileA) {
          const rate = Math.abs(calculateActualRate(1, profileA.rates[axis].center, profileA.rates[axis].maxRate, profileA.rates[axis].expo));
          maxRate = Math.max(maxRate, rate);
        }
        if (profileB && this.visibility.profileB) {
          const rate = Math.abs(calculateActualRate(1, profileB.rates[axis].center, profileB.rates[axis].maxRate, profileB.rates[axis].expo));
          maxRate = Math.max(maxRate, rate);
        }
      }
    });
    return Math.max(1000, maxRate * 1.1);
  }

  renderRates(profileA, profileB) {
    const width = this.rateCanvas.width;
    const height = this.rateCanvas.height;
    const ctx = this.rateCtx;
    this.clearCanvas(ctx, width, height);
    this.drawGrid(ctx, width, height);
    const yMax = this.calculateMaxRate(profileA, profileB);
    const axes = ['roll', 'pitch', 'yaw'];
    axes.forEach(axis => {
      if (!this.visibility[axis]) return;
      if (profileA && this.visibility.profileA) {
        this.drawRateCurve(ctx, width, height, profileA.rates[axis], this.colors[axis], yMax, false);
      }
      if (profileB && this.visibility.profileB) {
        this.drawRateCurve(ctx, width, height, profileB.rates[axis], this.colors[axis], yMax, true);
      }
    });
    this.drawRateAxes(ctx, width, height, yMax);
  }

  renderThrottle(profileA, profileB) {
    const width = this.throttleCanvas.width;
    const height = this.throttleCanvas.height;
    const ctx = this.throttleCtx;
    this.clearCanvas(ctx, width, height);
    this.drawGrid(ctx, width, height);
    if (profileA && this.visibility.profileA) {
      this.drawThrottleCurve(ctx, width, height, profileA.throttle, '#00aaff', false);
    }
    if (profileB && this.visibility.profileB) {
      this.drawThrottleCurve(ctx, width, height, profileB.throttle, '#00aaff', true);
    }
    this.drawThrottleAxes(ctx, width, height);
  }

  render(profileA, profileB) {
    this.renderRates(profileA, profileB);
    this.renderThrottle(profileA, profileB);
  }
}

// Main Application
class RateProfileComparison {
  constructor() {
    this.profileManager = new ProfileManager();
    this.graphRenderer = new GraphRenderer(
      document.getElementById('rate-canvas'),
      document.getElementById('throttle-canvas')
    );
    this.profileA = this.createDefaultProfile('Profile A');
    this.profileB = this.createDefaultProfile('Profile B');
    this.autoSaveTimer = null;
    this.autoSaveDelay = 2000;
    this.initializeControls();
    this.initializeVisibilityToggles();
    this.initializeImportExport();
    this.initializeProfileActions();
    this.initializeHistory();
    this.updateGraphs();
    this.updateExports();
    this.renderHistory();
  }

  createDefaultProfile(name) {
    return {
      name,
      rates: {
        roll: { center: 70, maxRate: 670, expo: 0 },
        pitch: { center: 70, maxRate: 670, expo: 0 },
        yaw: { center: 70, maxRate: 670, expo: 0 }
      },
      throttle: { mid: 50, expo: 0 }
    };
  }

  initializeControls() {
    const profiles = ['a', 'b'];
    const axes = ['roll', 'pitch', 'yaw'];
    profiles.forEach(profile => {
      const profileObj = profile === 'a' ? this.profileA : this.profileB;
      axes.forEach(axis => {
        ['center', 'max', 'expo'].forEach(param => {
          const input = document.getElementById(\`\${profile}-\${axis}-\${param}\`);
          const valueDisplay = document.getElementById(\`\${profile}-\${axis}-\${param}-value\`);
          input.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (param === 'center') profileObj.rates[axis].center = value;
            else if (param === 'max') profileObj.rates[axis].maxRate = value;
            else profileObj.rates[axis].expo = value;
            valueDisplay.textContent = value;
            this.onProfileChange();
          });
        });
      });
      ['mid', 'expo'].forEach(param => {
        const input = document.getElementById(\`\${profile}-throttle-\${param}\`);
        const valueDisplay = document.getElementById(\`\${profile}-throttle-\${param}-value\`);
        input.addEventListener('input', (e) => {
          const value = parseInt(e.target.value);
          if (param === 'mid') profileObj.throttle.mid = value;
          else profileObj.throttle.expo = value;
          valueDisplay.textContent = value;
          this.onProfileChange();
        });
      });
    });
  }

  initializeVisibilityToggles() {
    ['profile-a', 'profile-b', 'roll', 'pitch', 'yaw'].forEach(id => {
      document.getElementById(\`toggle-\${id}\`).addEventListener('change', (e) => {
        const key = id.replace('-', '').replace('profile', 'profile');
        const visKey = id === 'profile-a' ? 'profileA' : id === 'profile-b' ? 'profileB' : id;
        this.graphRenderer.setVisibility({ [visKey]: e.target.checked });
        this.updateGraphs();
      });
    });
  }

  initializeImportExport() {
    ['a', 'b'].forEach(profile => {
      document.getElementById(\`import-btn-\${profile}\`).addEventListener('click', () => this.importProfile(profile));
      document.getElementById(\`copy-btn-\${profile}\`).addEventListener('click', () => this.copyExport(profile));
    });
  }

  initializeProfileActions() {
    ['a', 'b'].forEach(profile => {
      document.getElementById(\`save-profile-\${profile}\`).addEventListener('click', () => this.saveProfile(profile));
      document.getElementById(\`profile-\${profile}-name\`).addEventListener('input', (e) => {
        const profileObj = profile === 'a' ? this.profileA : this.profileB;
        profileObj.name = e.target.value || \`Profile \${profile.toUpperCase()}\`;
        this.updateExports();
      });
    });
  }

  initializeHistory() {
    document.getElementById('export-history-btn').addEventListener('click', () => this.exportHistory());
    document.getElementById('import-history-btn').addEventListener('click', () => {
      document.getElementById('history-file-input').click();
    });
    document.getElementById('history-file-input').addEventListener('change', (e) => {
      this.importHistoryFromFile(e.target.files[0]);
    });
    document.getElementById('clear-history-btn').addEventListener('click', () => {
      if (confirm('Clear all history?')) {
        this.profileManager.clearAll();
        this.renderHistory();
      }
    });
  }

  onProfileChange() {
    this.updateGraphs();
    this.updateExports();
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      if (this.profileA.name && this.profileA.name !== 'Profile A') {
        this.profileManager.saveProfile({ ...this.profileA });
      }
      if (this.profileB.name && this.profileB.name !== 'Profile B') {
        this.profileManager.saveProfile({ ...this.profileB });
      }
      this.renderHistory();
    }, this.autoSaveDelay);
  }

  updateGraphs() {
    this.graphRenderer.render(this.profileA, this.profileB);
  }

  updateExports() {
    document.getElementById('export-a').value = generateCLI(this.profileA);
    document.getElementById('export-b').value = generateCLI(this.profileB);
  }

  importProfile(profile) {
    const textarea = document.getElementById(\`import-\${profile}\`);
    const statusSpan = document.getElementById(\`import-status-\${profile}\`);
    const text = textarea.value;
    if (!text.trim()) {
      this.showStatus(statusSpan, 'Please paste CLI dump', 'error');
      return;
    }
    try {
      const settings = parseCLI(text);
      const profileObj = profile === 'a' ? this.profileA : this.profileB;
      const mapping = {
        roll_rc_rate: (v) => profileObj.rates.roll.center = parseInt(v),
        pitch_rc_rate: (v) => profileObj.rates.pitch.center = parseInt(v),
        yaw_rc_rate: (v) => profileObj.rates.yaw.center = parseInt(v),
        roll_rate: (v) => profileObj.rates.roll.maxRate = parseInt(v),
        pitch_rate: (v) => profileObj.rates.pitch.maxRate = parseInt(v),
        yaw_rate: (v) => profileObj.rates.yaw.maxRate = parseInt(v),
        roll_expo: (v) => profileObj.rates.roll.expo = parseInt(v),
        pitch_expo: (v) => profileObj.rates.pitch.expo = parseInt(v),
        yaw_expo: (v) => profileObj.rates.yaw.expo = parseInt(v),
        thr_mid: (v) => profileObj.throttle.mid = parseInt(v),
        thr_expo: (v) => profileObj.throttle.expo = parseInt(v)
      };
      let count = 0;
      for (const [key, handler] of Object.entries(mapping)) {
        if (settings[key] !== undefined) {
          handler(settings[key]);
          count++;
        }
      }
      this.updateUIFromProfile(profile, profileObj);
      this.updateGraphs();
      this.updateExports();
      this.showStatus(statusSpan, \`Imported \${count} settings\`, 'success');
      textarea.value = '';
    } catch (error) {
      this.showStatus(statusSpan, \`Import failed: \${error.message}\`, 'error');
    }
  }

  updateUIFromProfile(profile, profileObj) {
    ['roll', 'pitch', 'yaw'].forEach(axis => {
      document.getElementById(\`\${profile}-\${axis}-center\`).value = profileObj.rates[axis].center;
      document.getElementById(\`\${profile}-\${axis}-center-value\`).textContent = profileObj.rates[axis].center;
      document.getElementById(\`\${profile}-\${axis}-max\`).value = profileObj.rates[axis].maxRate;
      document.getElementById(\`\${profile}-\${axis}-max-value\`).textContent = profileObj.rates[axis].maxRate;
      document.getElementById(\`\${profile}-\${axis}-expo\`).value = profileObj.rates[axis].expo;
      document.getElementById(\`\${profile}-\${axis}-expo-value\`).textContent = profileObj.rates[axis].expo;
    });
    document.getElementById(\`\${profile}-throttle-mid\`).value = profileObj.throttle.mid;
    document.getElementById(\`\${profile}-throttle-mid-value\`).textContent = profileObj.throttle.mid;
    document.getElementById(\`\${profile}-throttle-expo\`).value = profileObj.throttle.expo;
    document.getElementById(\`\${profile}-throttle-expo-value\`).textContent = profileObj.throttle.expo;
  }

  async copyExport(profile) {
    const textarea = document.getElementById(\`export-\${profile}\`);
    const statusSpan = document.getElementById(\`export-status-\${profile}\`);
    try {
      await navigator.clipboard.writeText(textarea.value);
      this.showStatus(statusSpan, 'Copied!', 'success');
    } catch (error) {
      textarea.select();
      document.execCommand('copy');
      this.showStatus(statusSpan, 'Copied!', 'success');
    }
  }

  saveProfile(profile) {
    const profileObj = profile === 'a' ? this.profileA : this.profileB;
    const nameInput = document.getElementById(\`profile-\${profile}-name\`);
    if (!nameInput.value.trim()) {
      alert('Please enter a profile name');
      nameInput.focus();
      return;
    }
    profileObj.name = nameInput.value;
    this.profileManager.saveProfile({ ...profileObj });
    this.renderHistory();
    const statusSpan = document.getElementById(\`export-status-\${profile}\`);
    this.showStatus(statusSpan, \`Saved: \${profileObj.name}\`, 'success');
  }

  renderHistory() {
    const historyList = document.getElementById('history-list');
    const history = this.profileManager.getHistory();
    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-history">No saved profiles yet</p>';
      return;
    }
    historyList.innerHTML = history.map((profile) => \`
      <div class="history-item">
        <div class="history-item-header">
          <h4>\${this.escapeHtml(profile.name)}</h4>
          <span class="history-timestamp">\${new Date(profile.timestamp).toLocaleString()}</span>
        </div>
        <div class="history-item-actions">
          <button class="btn btn-small load-to-a" data-timestamp="\${profile.timestamp}">Load to A</button>
          <button class="btn btn-small load-to-b" data-timestamp="\${profile.timestamp}">Load to B</button>
          <button class="btn btn-small btn-danger delete-profile" data-timestamp="\${profile.timestamp}">Delete</button>
        </div>
      </div>
    \`).join('');
    historyList.querySelectorAll('.load-to-a').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const timestamp = parseInt(e.target.dataset.timestamp);
        this.loadProfileTo('a', timestamp);
      });
    });
    historyList.querySelectorAll('.load-to-b').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const timestamp = parseInt(e.target.dataset.timestamp);
        this.loadProfileTo('b', timestamp);
      });
    });
    historyList.querySelectorAll('.delete-profile').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const timestamp = parseInt(e.target.dataset.timestamp);
        if (confirm('Delete this profile?')) {
          this.profileManager.deleteProfile(timestamp);
          this.renderHistory();
        }
      });
    });
  }

  loadProfileTo(target, timestamp) {
    const history = this.profileManager.getHistory();
    const profile = history.find(p => p.timestamp === timestamp);
    if (!profile) return;
    if (target === 'a') {
      this.profileA = { ...profile };
      this.updateUIFromProfile('a', this.profileA);
      document.getElementById('profile-a-name').value = profile.name;
    } else {
      this.profileB = { ...profile };
      this.updateUIFromProfile('b', this.profileB);
      document.getElementById('profile-b-name').value = profile.name;
    }
    this.updateGraphs();
    this.updateExports();
  }

  exportHistory() {
    const json = this.profileManager.exportHistory();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`fpv-rate-profiles-\${Date.now()}.json\`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importHistoryFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        this.profileManager.importHistory(e.target.result);
        this.renderHistory();
        alert('History imported!');
      } catch (error) {
        alert(\`Import failed: \${error.message}\`);
      }
    };
    reader.readAsText(file);
  }

  showStatus(element, message, type) {
    element.textContent = message;
    element.className = \`status-message \${type}\`;
    setTimeout(() => {
      element.textContent = '';
      element.className = 'status-message';
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new RateProfileComparison();
});
`;
}
