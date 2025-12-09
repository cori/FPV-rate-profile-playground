// Betaflight Rate Profile Configuration
// Based on Betaflight's Actual Rates algorithm

class RateProfile {
    constructor() {
        // Default rate settings
        this.rates = {
            roll: { center: 70, maxRate: 670, expo: 0 },
            pitch: { center: 70, maxRate: 670, expo: 0 },
            yaw: { center: 70, maxRate: 670, expo: 0 }
        };

        this.throttle = {
            mid: 50,
            expo: 0
        };

        this.initializeControls();
        this.initializeCanvases();
        this.initializeImportExport();
        this.updateGraphs();
        this.updateExport();
    }

    initializeControls() {
        const axes = ['roll', 'pitch', 'yaw'];

        axes.forEach(axis => {
            // Center Sensitivity
            const centerSlider = document.getElementById(`${axis}-center`);
            const centerValue = document.getElementById(`${axis}-center-value`);
            centerSlider.addEventListener('input', (e) => {
                this.rates[axis].center = parseInt(e.target.value);
                centerValue.textContent = e.target.value;
                this.updateGraphs();
                this.updateExport();
            });

            // Max Rate
            const maxSlider = document.getElementById(`${axis}-max`);
            const maxValue = document.getElementById(`${axis}-max-value`);
            maxSlider.addEventListener('input', (e) => {
                this.rates[axis].maxRate = parseInt(e.target.value);
                maxValue.textContent = e.target.value;
                this.updateGraphs();
                this.updateExport();
            });

            // Expo
            const expoSlider = document.getElementById(`${axis}-expo`);
            const expoValue = document.getElementById(`${axis}-expo-value`);
            expoSlider.addEventListener('input', (e) => {
                this.rates[axis].expo = parseInt(e.target.value);
                expoValue.textContent = e.target.value;
                this.updateGraphs();
                this.updateExport();
            });
        });

        // Throttle controls
        const throttleMidSlider = document.getElementById('throttle-mid');
        const throttleMidValue = document.getElementById('throttle-mid-value');
        throttleMidSlider.addEventListener('input', (e) => {
            this.throttle.mid = parseInt(e.target.value);
            throttleMidValue.textContent = (e.target.value / 100).toFixed(2);
            this.updateGraphs();
            this.updateExport();
        });

        const throttleExpoSlider = document.getElementById('throttle-expo');
        const throttleExpoValue = document.getElementById('throttle-expo-value');
        throttleExpoSlider.addEventListener('input', (e) => {
            this.throttle.expo = parseInt(e.target.value);
            throttleExpoValue.textContent = e.target.value;
            this.updateGraphs();
            this.updateExport();
        });
    }

    initializeCanvases() {
        this.rateCanvas = document.getElementById('rate-canvas');
        this.rateCtx = this.rateCanvas.getContext('2d');
        this.throttleCanvas = document.getElementById('throttle-canvas');
        this.throttleCtx = this.throttleCanvas.getContext('2d');
    }

    initializeImportExport() {
        // Import button
        const importBtn = document.getElementById('import-btn');
        importBtn.addEventListener('click', () => this.importSettings());

        // Clear import button
        const clearImportBtn = document.getElementById('clear-import-btn');
        clearImportBtn.addEventListener('click', () => {
            document.getElementById('import-text').value = '';
            document.getElementById('import-status').textContent = '';
        });

        // Copy export button
        const copyExportBtn = document.getElementById('copy-export-btn');
        copyExportBtn.addEventListener('click', () => this.copyExport());
    }

    parseCLI(text) {
        // Parse Betaflight CLI dump format
        // Format: set parameter_name = value
        const settings = {};
        const lines = text.split('\n');

        for (const line of lines) {
            // Match pattern: set parameter_name = value
            // Also support without 'set' prefix and various spacing
            const match = line.match(/^\s*(?:set\s+)?([a-z_]+)\s*=\s*(.+?)\s*$/i);
            if (match) {
                const key = match[1].toLowerCase();
                const value = match[2].trim();
                // Store last occurrence (overwrites previous)
                settings[key] = value;
            }
        }

        return settings;
    }

    importSettings() {
        const importText = document.getElementById('import-text').value;
        const statusDiv = document.getElementById('import-status');

        if (!importText.trim()) {
            statusDiv.textContent = 'Please paste CLI dump text first.';
            statusDiv.className = 'status-message error';
            return;
        }

        const settings = this.parseCLI(importText);
        let importedCount = 0;
        const imported = [];

        // Map CLI parameter names to our internal structure
        const mapping = {
            'roll_rc_rate': (val) => { this.rates.roll.center = parseInt(val); imported.push('roll center'); },
            'pitch_rc_rate': (val) => { this.rates.pitch.center = parseInt(val); imported.push('pitch center'); },
            'yaw_rc_rate': (val) => { this.rates.yaw.center = parseInt(val); imported.push('yaw center'); },
            'roll_rate': (val) => { this.rates.roll.maxRate = parseInt(val); imported.push('roll max rate'); },
            'pitch_rate': (val) => { this.rates.pitch.maxRate = parseInt(val); imported.push('pitch max rate'); },
            'yaw_rate': (val) => { this.rates.yaw.maxRate = parseInt(val); imported.push('yaw max rate'); },
            'roll_expo': (val) => { this.rates.roll.expo = parseInt(val); imported.push('roll expo'); },
            'pitch_expo': (val) => { this.rates.pitch.expo = parseInt(val); imported.push('pitch expo'); },
            'yaw_expo': (val) => { this.rates.yaw.expo = parseInt(val); imported.push('yaw expo'); },
            'thr_mid': (val) => { this.throttle.mid = parseInt(val); imported.push('throttle mid'); },
            'thr_expo': (val) => { this.throttle.expo = parseInt(val); imported.push('throttle expo'); }
        };

        // Apply settings
        for (const [key, handler] of Object.entries(mapping)) {
            if (settings[key] !== undefined) {
                handler(settings[key]);
                importedCount++;
            }
        }

        // Update UI
        this.updateUIFromModel();
        this.updateGraphs();
        this.updateExport();

        // Show status
        if (importedCount > 0) {
            statusDiv.textContent = `✓ Successfully imported ${importedCount} settings: ${imported.join(', ')}`;
            statusDiv.className = 'status-message success';
        } else {
            statusDiv.textContent = 'No recognized rate settings found in the text.';
            statusDiv.className = 'status-message warning';
        }
    }

    updateUIFromModel() {
        // Update all sliders and their value displays
        const axes = ['roll', 'pitch', 'yaw'];

        axes.forEach(axis => {
            // Center
            const centerSlider = document.getElementById(`${axis}-center`);
            const centerValue = document.getElementById(`${axis}-center-value`);
            centerSlider.value = this.rates[axis].center;
            centerValue.textContent = this.rates[axis].center;

            // Max Rate
            const maxSlider = document.getElementById(`${axis}-max`);
            const maxValue = document.getElementById(`${axis}-max-value`);
            maxSlider.value = this.rates[axis].maxRate;
            maxValue.textContent = this.rates[axis].maxRate;

            // Expo
            const expoSlider = document.getElementById(`${axis}-expo`);
            const expoValue = document.getElementById(`${axis}-expo-value`);
            expoSlider.value = this.rates[axis].expo;
            expoValue.textContent = this.rates[axis].expo;
        });

        // Throttle
        const throttleMidSlider = document.getElementById('throttle-mid');
        const throttleMidValue = document.getElementById('throttle-mid-value');
        throttleMidSlider.value = this.throttle.mid;
        throttleMidValue.textContent = (this.throttle.mid / 100).toFixed(2);

        const throttleExpoSlider = document.getElementById('throttle-expo');
        const throttleExpoValue = document.getElementById('throttle-expo-value');
        throttleExpoSlider.value = this.throttle.expo;
        throttleExpoValue.textContent = this.throttle.expo;
    }

    generateCLI() {
        // Generate Betaflight CLI commands
        const commands = [
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
            'save'
        ];

        return commands.join('\n');
    }

    updateExport() {
        const exportText = document.getElementById('export-text');
        exportText.value = this.generateCLI();
    }

    copyExport() {
        const exportText = document.getElementById('export-text');
        const statusDiv = document.getElementById('export-status');

        exportText.select();
        exportText.setSelectionRange(0, 99999); // For mobile devices

        try {
            navigator.clipboard.writeText(exportText.value).then(() => {
                statusDiv.textContent = '✓ Copied to clipboard!';
                statusDiv.className = 'status-message success';
                setTimeout(() => {
                    statusDiv.textContent = '';
                }, 3000);
            }).catch(() => {
                // Fallback to document.execCommand
                document.execCommand('copy');
                statusDiv.textContent = '✓ Copied to clipboard!';
                statusDiv.className = 'status-message success';
                setTimeout(() => {
                    statusDiv.textContent = '';
                }, 3000);
            });
        } catch (err) {
            statusDiv.textContent = '✗ Failed to copy. Please select and copy manually.';
            statusDiv.className = 'status-message error';
        }
    }

    // Betaflight Actual Rates calculation
    // Based on: https://github.com/betaflight/betaflight/blob/master/src/main/flight/pid.c
    calculateActualRate(rcCommand, center, maxRate, expo) {
        // Normalize RC command from -1 to 1
        const rcCommandNormalized = rcCommand;
        const rcCommandAbs = Math.abs(rcCommandNormalized);

        // Apply expo curve
        let expof;
        if (expo > 0) {
            const expoPower = 3;
            expof = (expo / 100.0) * Math.pow(rcCommandAbs, expoPower) + rcCommandAbs * (1 - expo / 100.0);
        } else {
            expof = rcCommandAbs;
        }

        // Calculate center sensitivity (controls the slope/derivative at center stick)
        const centerSensitivity = center * 10; // center is 0-255, multiply by 10 for deg/s

        // Calculate max rate in deg/s
        const maxRateDegS = maxRate;

        // Calculate the rate
        // Center sensitivity controls the slope at center stick (rate increases linearly at small deflections)
        // Expo causes transition from linear center behavior to reaching maxRate at full deflection
        // At center stick (rcCommand = 0): rate = 0 (no rotation)
        // At small deflections: rate increases with slope = centerSensitivity
        // At full deflection: rate = maxRate
        const rate = rcCommandAbs * centerSensitivity + expof * rcCommandAbs * (maxRateDegS - centerSensitivity);

        return rcCommandNormalized >= 0 ? rate : -rate;
    }

    // Calculate throttle curve
    calculateThrottle(input) {
        // input is 0 to 1
        const mid = this.throttle.mid / 100;
        const expo = this.throttle.expo / 100;

        let throttle;
        if (input < 0.5) {
            // Lower half
            const x = input * 2; // 0 to 1
            throttle = mid * (x * (1 - expo) + Math.pow(x, 3) * expo);
        } else {
            // Upper half
            const x = (input - 0.5) * 2; // 0 to 1
            throttle = mid + (1 - mid) * (x * (1 - expo) + Math.pow(x, 3) * expo);
        }

        return throttle;
    }

    drawGrid(ctx, width, height, padding) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
            const x = padding + (width - 2 * padding) * (i / 10);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }

        // Horizontal grid lines
        for (let i = 0; i <= 10; i++) {
            const y = padding + (height - 2 * padding) * (i / 10);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    drawAxes(ctx, width, height, padding, yMax) {
        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();

        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, height / 2);
        ctx.lineTo(width - padding, height / 2);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#999';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';

        // Y-axis labels
        for (let i = 0; i <= 4; i++) {
            const value = yMax - (i * yMax / 2);
            const y = padding + (height - 2 * padding) * (i / 4);
            ctx.fillText(Math.round(value) + '°/s', padding - 10, y + 4);
        }

        // X-axis labels
        ctx.textAlign = 'center';
        ctx.fillText('-1.0', padding, height - padding + 20);
        ctx.fillText('0.0', width / 2, height - padding + 20);
        ctx.fillText('1.0', width - padding, height - padding + 20);
        ctx.fillText('RC Command', width / 2, height - 10);
    }

    drawRateCurve(ctx, width, height, padding, axis, color) {
        const rate = this.rates[axis];
        const steps = 200;

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        // Find max rate for scaling
        const maxPossibleRate = Math.max(
            Math.abs(this.calculateActualRate(1, rate.center, rate.maxRate, rate.expo)),
            Math.abs(this.calculateActualRate(-1, rate.center, rate.maxRate, rate.expo))
        );

        const yMax = Math.max(1000, maxPossibleRate * 1.1);

        for (let i = 0; i <= steps; i++) {
            const rcCommand = -1 + (2 * i / steps);
            const rateValue = this.calculateActualRate(rcCommand, rate.center, rate.maxRate, rate.expo);

            const x = padding + (width - 2 * padding) * ((rcCommand + 1) / 2);
            const y = (height / 2) - ((rateValue / yMax) * (height - 2 * padding) / 2);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        return yMax;
    }

    drawThrottleCurve(ctx, width, height, padding) {
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const steps = 200;

        for (let i = 0; i <= steps; i++) {
            const input = i / steps;
            const throttle = this.calculateThrottle(input);

            const x = padding + (width - 2 * padding) * input;
            const y = height - padding - (height - 2 * padding) * throttle;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        // Draw throttle mid point indicator
        const mid = this.throttle.mid / 100;
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

        // Label
        ctx.fillStyle = '#ff6600';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Mid: ${mid.toFixed(2)}`, width - padding + 10, midY + 4);
    }

    updateGraphs() {
        this.updateRateGraph();
        this.updateThrottleGraph();
    }

    updateRateGraph() {
        const canvas = this.rateCanvas;
        const ctx = this.rateCtx;
        const width = canvas.width;
        const height = canvas.height;
        const padding = 60;

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        this.drawGrid(ctx, width, height, padding);

        // Draw curves
        const rollMax = this.drawRateCurve(ctx, width, height, padding, 'roll', '#ff3366');
        const pitchMax = this.drawRateCurve(ctx, width, height, padding, 'pitch', '#33ff66');
        const yawMax = this.drawRateCurve(ctx, width, height, padding, 'yaw', '#ffaa00');

        // Draw axes (use the maximum of all three)
        const yMax = Math.max(rollMax, pitchMax, yawMax);
        this.drawAxes(ctx, width, height, padding, yMax);
    }

    updateThrottleGraph() {
        const canvas = this.throttleCanvas;
        const ctx = this.throttleCtx;
        const width = canvas.width;
        const height = canvas.height;
        const padding = 60;

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        for (let i = 0; i <= 10; i++) {
            const x = padding + (width - 2 * padding) * (i / 10);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();

            const y = padding + (height - 2 * padding) * (i / 10);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        ctx.setLineDash([]);

        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Labels
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
            const value = i / 10;
            const x = padding + (width - 2 * padding) * (i / 10);
            ctx.fillText(value.toFixed(1), x, height - padding + 20);
        }

        ctx.fillText('Throttle Input', width / 2, height - 10);

        ctx.save();
        ctx.translate(20, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Throttle Output', 0, 0);
        ctx.restore();

        // Draw throttle curve
        this.drawThrottleCurve(ctx, width, height, padding);
    }
}

// Initialize the rate profile when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RateProfile();
});
