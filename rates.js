// Betaflight Rate Profile Configuration
// Based on Betaflight's Actual Rates algorithm

// ── Color palettes for overlaid profiles ─────────────────────────────────────
// Index 0 = primary (editable). Indices 1-4 = reference overlays (dashed).
const PALETTES = [
    { roll: '#ff3366', pitch: '#33ff66', yaw: '#ffaa00', throttle: '#00aaff', dash: [],        lineWidth: 3 },
    { roll: '#4488ff', pitch: '#ff8844', yaw: '#dd44ff', throttle: '#44ffdd', dash: [10, 5],   lineWidth: 2 },
    { roll: '#44ffcc', pitch: '#ccff44', yaw: '#ff4455', throttle: '#ffaadd', dash: [5, 5],    lineWidth: 2 },
    { roll: '#ffcc44', pitch: '#44ccff', yaw: '#aaff66', throttle: '#ff8888', dash: [12, 4],   lineWidth: 2 },
    { roll: '#cc44ff', pitch: '#ff44cc', yaw: '#88ff44', throttle: '#ffcc88', dash: [6, 3, 2, 3], lineWidth: 2 },
];

// ── Profile encoding / decoding (browser-safe base64url) ─────────────────────

function encodeProfiles(profiles) {
    const json = JSON.stringify(profiles);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeProfiles(encoded) {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
}

// ── Convert between flat (API / URL) format and the internal model ────────────

function flatToModel(flat) {
    return {
        name: flat.name ?? '',
        rates: {
            roll:  { center: flat.roll_rc_rate  ?? 70,  maxRate: flat.roll_rate  ?? 670, expo: flat.roll_expo  ?? 0 },
            pitch: { center: flat.pitch_rc_rate ?? 70,  maxRate: flat.pitch_rate ?? 670, expo: flat.pitch_expo ?? 0 },
            yaw:   { center: flat.yaw_rc_rate   ?? 70,  maxRate: flat.yaw_rate   ?? 670, expo: flat.yaw_expo   ?? 0 },
        },
        throttle: { mid: flat.thr_mid ?? 50, expo: flat.thr_expo ?? 0 },
    };
}

function modelToFlat(model) {
    return {
        ...(model.name ? { name: model.name } : {}),
        roll_rc_rate:  model.rates.roll.center,
        roll_rate:     model.rates.roll.maxRate,
        roll_expo:     model.rates.roll.expo,
        pitch_rc_rate: model.rates.pitch.center,
        pitch_rate:    model.rates.pitch.maxRate,
        pitch_expo:    model.rates.pitch.expo,
        yaw_rc_rate:   model.rates.yaw.center,
        yaw_rate:      model.rates.yaw.maxRate,
        yaw_expo:      model.rates.yaw.expo,
        thr_mid:       model.throttle.mid,
        thr_expo:      model.throttle.expo,
    };
}

// ── Main class ────────────────────────────────────────────────────────────────

class RateProfile {
    constructor() {
        // Default rate settings (primary / editable profile)
        this.rates = {
            roll:  { center: 70, maxRate: 670, expo: 0 },
            pitch: { center: 70, maxRate: 670, expo: 0 },
            yaw:   { center: 70, maxRate: 670, expo: 0 },
        };
        this.throttle = { mid: 50, expo: 0 };

        // Reference profiles loaded from URL (shown as dashed overlays)
        this.referenceProfiles = [];

        this.initializeControls();
        this.initializeCanvases();
        this.initializeImportExport();
        this.loadFromURL();   // must run after controls are wired up
        this.updateGraphs();
        this.updateExport();
    }

    // ── URL loading ──────────────────────────────────────────────────────────

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get('profiles');
        if (!encoded) return;

        try {
            const profiles = decodeProfiles(encoded);
            if (!Array.isArray(profiles) || profiles.length === 0) return;

            // First profile → loaded into sliders
            const primary = flatToModel(profiles[0]);
            this.rates    = primary.rates;
            this.throttle = primary.throttle;
            this.updateUIFromModel();

            // Remaining profiles → reference overlays
            this.referenceProfiles = profiles.slice(1).map(flatToModel);
            this.updateReferenceProfilesBanner();
        } catch {
            console.warn('FPV Playground: could not decode ?profiles= param');
        }
    }

    updateReferenceProfilesBanner() {
        const banner = document.getElementById('reference-profiles-banner');
        if (!banner) return;
        if (this.referenceProfiles.length === 0) {
            banner.hidden = true;
            return;
        }
        banner.hidden = false;
        const list = this.referenceProfiles
            .map((p, i) => {
                const palette = PALETTES[i + 1] ?? PALETTES[PALETTES.length - 1];
                const label   = p.name || `Profile ${i + 2}`;
                return `<span class="ref-badge" style="border-color:${palette.roll}">${label}</span>`;
            })
            .join('');
        banner.innerHTML = `<strong>Comparing against:</strong> ${list}`;
    }

    // ── Share URL ────────────────────────────────────────────────────────────

    generateShareURL() {
        const primaryFlat = modelToFlat({ rates: this.rates, throttle: this.throttle });
        const refFlats    = this.referenceProfiles.map(modelToFlat);
        const encoded     = encodeProfiles([primaryFlat, ...refFlats]);
        const url = `${window.location.origin}${window.location.pathname}?profiles=${encoded}`;
        return url;
    }

    copyShareURL() {
        const url = this.generateShareURL();
        const statusDiv = document.getElementById('share-status');
        const input = document.getElementById('share-url-input');
        if (input) input.value = url;

        navigator.clipboard.writeText(url).then(() => {
            statusDiv.textContent = '✓ Share URL copied to clipboard!';
            statusDiv.className = 'status-message success';
            setTimeout(() => { statusDiv.textContent = ''; }, 3000);
        }).catch(() => {
            statusDiv.textContent = url;
            statusDiv.className = 'status-message';
        });
    }

    // ── Controls ─────────────────────────────────────────────────────────────

    initializeControls() {
        const axes = ['roll', 'pitch', 'yaw'];

        axes.forEach(axis => {
            const centerSlider = document.getElementById(`${axis}-center`);
            const centerValue  = document.getElementById(`${axis}-center-value`);
            centerSlider.addEventListener('input', (e) => {
                this.rates[axis].center = parseInt(e.target.value);
                centerValue.textContent = e.target.value;
                this.updateGraphs();
                this.updateExport();
            });

            const maxSlider = document.getElementById(`${axis}-max`);
            const maxValue  = document.getElementById(`${axis}-max-value`);
            maxSlider.addEventListener('input', (e) => {
                this.rates[axis].maxRate = parseInt(e.target.value);
                maxValue.textContent = e.target.value;
                this.updateGraphs();
                this.updateExport();
            });

            const expoSlider = document.getElementById(`${axis}-expo`);
            const expoValue  = document.getElementById(`${axis}-expo-value`);
            expoSlider.addEventListener('input', (e) => {
                this.rates[axis].expo = parseInt(e.target.value);
                expoValue.textContent = e.target.value;
                this.updateGraphs();
                this.updateExport();
            });
        });

        const throttleMidSlider = document.getElementById('throttle-mid');
        const throttleMidValue  = document.getElementById('throttle-mid-value');
        throttleMidSlider.addEventListener('input', (e) => {
            this.throttle.mid = parseInt(e.target.value);
            throttleMidValue.textContent = (e.target.value / 100).toFixed(2);
            this.updateGraphs();
            this.updateExport();
        });

        const throttleExpoSlider = document.getElementById('throttle-expo');
        const throttleExpoValue  = document.getElementById('throttle-expo-value');
        throttleExpoSlider.addEventListener('input', (e) => {
            this.throttle.expo = parseInt(e.target.value);
            throttleExpoValue.textContent = e.target.value;
            this.updateGraphs();
            this.updateExport();
        });
    }

    initializeCanvases() {
        this.rateCanvas    = document.getElementById('rate-canvas');
        this.rateCtx       = this.rateCanvas.getContext('2d');
        this.throttleCanvas = document.getElementById('throttle-canvas');
        this.throttleCtx   = this.throttleCanvas.getContext('2d');
    }

    initializeImportExport() {
        document.getElementById('import-btn').addEventListener('click', () => this.importSettings());
        document.getElementById('clear-import-btn').addEventListener('click', () => {
            document.getElementById('import-text').value = '';
            document.getElementById('import-status').textContent = '';
        });
        document.getElementById('copy-export-btn').addEventListener('click', () => this.copyExport());
        document.getElementById('share-btn').addEventListener('click', () => this.copyShareURL());
    }

    // ── Import / export ──────────────────────────────────────────────────────

    parseCLI(text) {
        const settings = {};
        for (const line of text.split('\n')) {
            const match = line.match(/^\s*(?:set\s+)?([a-z_]+)\s*=\s*(.+?)\s*$/i);
            if (match) settings[match[1].toLowerCase()] = match[2].trim();
        }
        return settings;
    }

    importSettings() {
        const importText = document.getElementById('import-text').value;
        const statusDiv  = document.getElementById('import-status');

        if (!importText.trim()) {
            statusDiv.textContent = 'Please paste CLI dump text first.';
            statusDiv.className = 'status-message error';
            return;
        }

        const settings = this.parseCLI(importText);
        let importedCount = 0;
        const imported = [];

        const mapping = {
            'roll_rc_rate':  (v) => { this.rates.roll.center   = parseInt(v); imported.push('roll center'); },
            'pitch_rc_rate': (v) => { this.rates.pitch.center  = parseInt(v); imported.push('pitch center'); },
            'yaw_rc_rate':   (v) => { this.rates.yaw.center    = parseInt(v); imported.push('yaw center'); },
            'roll_rate':     (v) => { this.rates.roll.maxRate   = parseInt(v); imported.push('roll max rate'); },
            'pitch_rate':    (v) => { this.rates.pitch.maxRate  = parseInt(v); imported.push('pitch max rate'); },
            'yaw_rate':      (v) => { this.rates.yaw.maxRate    = parseInt(v); imported.push('yaw max rate'); },
            'roll_expo':     (v) => { this.rates.roll.expo      = parseInt(v); imported.push('roll expo'); },
            'pitch_expo':    (v) => { this.rates.pitch.expo     = parseInt(v); imported.push('pitch expo'); },
            'yaw_expo':      (v) => { this.rates.yaw.expo       = parseInt(v); imported.push('yaw expo'); },
            'thr_mid':       (v) => { this.throttle.mid         = parseInt(v); imported.push('throttle mid'); },
            'thr_expo':      (v) => { this.throttle.expo        = parseInt(v); imported.push('throttle expo'); },
        };

        for (const [key, handler] of Object.entries(mapping)) {
            if (settings[key] !== undefined) { handler(settings[key]); importedCount++; }
        }

        this.updateUIFromModel();
        this.updateGraphs();
        this.updateExport();

        if (importedCount > 0) {
            statusDiv.textContent = `✓ Imported ${importedCount} settings: ${imported.join(', ')}`;
            statusDiv.className = 'status-message success';
        } else {
            statusDiv.textContent = 'No recognized rate settings found.';
            statusDiv.className = 'status-message warning';
        }
    }

    updateUIFromModel() {
        const axes = ['roll', 'pitch', 'yaw'];
        axes.forEach(axis => {
            document.getElementById(`${axis}-center`).value          = this.rates[axis].center;
            document.getElementById(`${axis}-center-value`).textContent = this.rates[axis].center;
            document.getElementById(`${axis}-max`).value             = this.rates[axis].maxRate;
            document.getElementById(`${axis}-max-value`).textContent    = this.rates[axis].maxRate;
            document.getElementById(`${axis}-expo`).value            = this.rates[axis].expo;
            document.getElementById(`${axis}-expo-value`).textContent   = this.rates[axis].expo;
        });
        document.getElementById('throttle-mid').value                  = this.throttle.mid;
        document.getElementById('throttle-mid-value').textContent       = (this.throttle.mid / 100).toFixed(2);
        document.getElementById('throttle-expo').value                 = this.throttle.expo;
        document.getElementById('throttle-expo-value').textContent      = this.throttle.expo;
    }

    generateCLI() {
        return [
            '# Betaflight Rate Profile Configuration',
            '# Generated by FPV Rate Profile Playground',
            '',
            '# Rate Type',
            'set rates_type = ACTUAL',
            '',
            '# Roll Rates',
            `set roll_rc_rate = ${this.rates.roll.center}`,
            `set roll_rate = ${this.rates.roll.maxRate}`,
            `set roll_expo = ${this.rates.roll.expo}`,
            '',
            '# Pitch Rates',
            `set pitch_rc_rate = ${this.rates.pitch.center}`,
            `set pitch_rate = ${this.rates.pitch.maxRate}`,
            `set pitch_expo = ${this.rates.pitch.expo}`,
            '',
            '# Yaw Rates',
            `set yaw_rc_rate = ${this.rates.yaw.center}`,
            `set yaw_rate = ${this.rates.yaw.maxRate}`,
            `set yaw_expo = ${this.rates.yaw.expo}`,
            '',
            '# Throttle',
            `set thr_mid = ${this.throttle.mid}`,
            `set thr_expo = ${this.throttle.expo}`,
            '',
            'save',
        ].join('\n');
    }

    updateExport() {
        document.getElementById('export-text').value = this.generateCLI();
    }

    copyExport() {
        const exportText = document.getElementById('export-text');
        const statusDiv  = document.getElementById('export-status');
        exportText.select();
        exportText.setSelectionRange(0, 99999);
        try {
            navigator.clipboard.writeText(exportText.value).then(() => {
                statusDiv.textContent = '✓ Copied to clipboard!';
                statusDiv.className = 'status-message success';
                setTimeout(() => { statusDiv.textContent = ''; }, 3000);
            }).catch(() => {
                document.execCommand('copy');
                statusDiv.textContent = '✓ Copied to clipboard!';
                statusDiv.className = 'status-message success';
                setTimeout(() => { statusDiv.textContent = ''; }, 3000);
            });
        } catch {
            statusDiv.textContent = '✗ Failed to copy. Select and copy manually.';
            statusDiv.className = 'status-message error';
        }
    }

    // ── Rate calculations ────────────────────────────────────────────────────

    calculateActualRate(rcCommand, center, maxRate, expo) {
        const rcCommandAbs = Math.abs(rcCommand);
        let expof;
        if (expo > 0) {
            expof = (expo / 100.0) * Math.pow(rcCommandAbs, 3) + rcCommandAbs * (1 - expo / 100.0);
        } else {
            expof = rcCommandAbs;
        }
        const centerSensitivity = center * 10;
        const rate = rcCommandAbs * centerSensitivity + expof * (maxRate - centerSensitivity);
        return rcCommand >= 0 ? rate : -rate;
    }

    calculateThrottle(input, throttle) {
        const mid  = throttle.mid / 100;
        const expo = throttle.expo / 100;
        const expof = input * (1 - expo) + Math.pow(input, 3) * expo;
        if (expof < 0.5) return expof * 2 * mid;
        return mid + (expof - 0.5) * 2 * (1 - mid);
    }

    // ── Drawing ──────────────────────────────────────────────────────────────

    drawGrid(ctx, width, height, padding) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        for (let i = 0; i <= 10; i++) {
            const x = padding + (width - 2 * padding) * (i / 10);
            ctx.beginPath(); ctx.moveTo(x, padding); ctx.lineTo(x, height - padding); ctx.stroke();
            const y = padding + (height - 2 * padding) * (i / 10);
            ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
        }
        ctx.setLineDash([]);
    }

    drawAxes(ctx, width, height, padding, yMax) {
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(padding, padding); ctx.lineTo(padding, height - padding); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padding, height / 2); ctx.lineTo(width - padding, height / 2); ctx.stroke();

        ctx.fillStyle = '#999';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const value = yMax - (i * yMax / 2);
            const y = padding + (height - 2 * padding) * (i / 4);
            ctx.fillText(Math.round(value) + '°/s', padding - 10, y + 4);
        }
        ctx.textAlign = 'center';
        ctx.fillText('-1.0', padding, height - padding + 20);
        ctx.fillText('0.0',  width / 2, height - padding + 20);
        ctx.fillText('1.0',  width - padding, height - padding + 20);
        ctx.fillText('RC Command', width / 2, height - 10);
    }

    /** Draw a single axis's rate curve with given style. Returns the yMax used. */
    drawRateCurve(ctx, width, height, padding, rateValues, color, yMax, dash = [], lineWidth = 3) {
        const steps = 200;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(dash);
        ctx.beginPath();

        for (let i = 0; i <= steps; i++) {
            const rcCommand = -1 + (2 * i / steps);
            const rateValue = this.calculateActualRate(
                rcCommand, rateValues.center, rateValues.maxRate, rateValues.expo
            );
            const x = padding + (width - 2 * padding) * ((rcCommand + 1) / 2);
            const y = (height / 2) - ((rateValue / yMax) * (height - 2 * padding) / 2);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /** Compute the overall yMax across the primary profile + all references. */
    computeYMax() {
        const allProfiles = [
            { rates: this.rates, throttle: this.throttle },
            ...this.referenceProfiles,
        ];
        let yMax = 1000;
        for (const p of allProfiles) {
            for (const axis of ['roll', 'pitch', 'yaw']) {
                const r = p.rates[axis];
                yMax = Math.max(yMax,
                    Math.abs(this.calculateActualRate( 1, r.center, r.maxRate, r.expo)),
                    Math.abs(this.calculateActualRate(-1, r.center, r.maxRate, r.expo))
                );
            }
        }
        return yMax * 1.1;
    }

    updateGraphs() {
        this.updateRateGraph();
        this.updateThrottleGraph();
    }

    updateRateGraph() {
        const canvas  = this.rateCanvas;
        const ctx     = this.rateCtx;
        const { width, height } = canvas;
        const padding = 60;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        this.drawGrid(ctx, width, height, padding);

        const yMax = this.computeYMax();

        // Reference profiles first (drawn underneath)
        for (let i = 0; i < this.referenceProfiles.length; i++) {
            const p  = this.referenceProfiles[i];
            const pal = PALETTES[i + 1] ?? PALETTES[PALETTES.length - 1];
            this.drawRateCurve(ctx, width, height, padding, p.rates.roll,  pal.roll,  yMax, pal.dash, pal.lineWidth);
            this.drawRateCurve(ctx, width, height, padding, p.rates.pitch, pal.pitch, yMax, pal.dash, pal.lineWidth);
            this.drawRateCurve(ctx, width, height, padding, p.rates.yaw,   pal.yaw,   yMax, pal.dash, pal.lineWidth);
        }

        // Primary profile on top (solid)
        const p0 = PALETTES[0];
        this.drawRateCurve(ctx, width, height, padding, this.rates.roll,  p0.roll,  yMax, p0.dash, p0.lineWidth);
        this.drawRateCurve(ctx, width, height, padding, this.rates.pitch, p0.pitch, yMax, p0.dash, p0.lineWidth);
        this.drawRateCurve(ctx, width, height, padding, this.rates.yaw,   p0.yaw,   yMax, p0.dash, p0.lineWidth);

        this.drawAxes(ctx, width, height, padding, yMax);
    }

    updateThrottleGraph() {
        const canvas  = this.throttleCanvas;
        const ctx     = this.throttleCtx;
        const { width, height } = canvas;
        const padding = 60;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        for (let i = 0; i <= 10; i++) {
            const x = padding + (width - 2 * padding) * (i / 10);
            ctx.beginPath(); ctx.moveTo(x, padding); ctx.lineTo(x, height - padding); ctx.stroke();
            const y = padding + (height - 2 * padding) * (i / 10);
            ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
        }
        ctx.setLineDash([]);

        // Axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        ctx.fillStyle = '#999';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 10; i++) {
            const value = 1.0 - (i / 10);
            const y = padding + (height - 2 * padding) * (i / 10);
            ctx.fillText(value.toFixed(1), padding - 10, y + 4);
        }
        ctx.textAlign = 'center';
        for (let i = 0; i <= 10; i++) {
            const x = padding + (width - 2 * padding) * (i / 10);
            ctx.fillText((i / 10).toFixed(1), x, height - padding + 20);
        }
        ctx.fillText('Throttle Input', width / 2, height - 10);
        ctx.save();
        ctx.translate(20, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Throttle Output', 0, 0);
        ctx.restore();

        // Reference throttle curves
        for (let i = 0; i < this.referenceProfiles.length; i++) {
            const p   = this.referenceProfiles[i];
            const pal = PALETTES[i + 1] ?? PALETTES[PALETTES.length - 1];
            this.drawThrottleCurve(ctx, width, height, padding, p.throttle, pal.throttle, pal.dash, pal.lineWidth);
        }

        // Primary throttle curve
        const p0 = PALETTES[0];
        this.drawThrottleCurve(ctx, width, height, padding, this.throttle, p0.throttle, p0.dash, p0.lineWidth);
    }

    drawThrottleCurve(ctx, width, height, padding, throttle, color, dash = [], lineWidth = 3) {
        const steps = 200;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(dash);
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const input    = i / steps;
            const throttleOut = this.calculateThrottle(input, throttle);
            const x = padding + (width - 2 * padding) * input;
            const y = height - padding - (height - 2 * padding) * throttleOut;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Mid-point indicator (only for primary)
        if (dash.length === 0) {
            const mid  = throttle.mid / 100;
            const midX = padding + (width - 2 * padding) * 0.5;
            const midY = height - padding - (height - 2 * padding) * mid;
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(midX, height - padding);
            ctx.lineTo(midX, midY);
            ctx.lineTo(width - padding, midY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ff6600';
            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`Mid: ${mid.toFixed(2)}`, width - padding + 10, midY + 4);
        }
    }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    new RateProfile();
});
