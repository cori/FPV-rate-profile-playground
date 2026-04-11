/**
 * FPV Rate Profile Playground – API server
 *
 * Serves the static app and exposes a small API that lets any client
 * (or LLM) POST rate profile data and receive a shareable URL back.
 *
 * Discoverability endpoints:
 *   GET /openapi.json              – OpenAPI 3.0 spec
 *   GET /.well-known/ai-plugin.json – AI plugin manifest
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

export const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// ── validation schema ────────────────────────────────────────────────────────

const PROFILE_FIELDS = {
    roll_rc_rate:  { min: 0,   max: 255  },
    roll_rate:     { min: 200, max: 2000 },
    roll_expo:     { min: 0,   max: 100  },
    pitch_rc_rate: { min: 0,   max: 255  },
    pitch_rate:    { min: 200, max: 2000 },
    pitch_expo:    { min: 0,   max: 100  },
    yaw_rc_rate:   { min: 0,   max: 255  },
    yaw_rate:      { min: 200, max: 2000 },
    yaw_expo:      { min: 0,   max: 100  },
    thr_mid:       { min: 0,   max: 100  },
    thr_expo:      { min: 0,   max: 100  },
};

/** Returns an error string, or null if the profile is valid. */
export function validateProfile(profile) {
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        return 'profile must be an object';
    }
    for (const [field, { min, max }] of Object.entries(PROFILE_FIELDS)) {
        if (profile[field] !== undefined) {
            const val = Number(profile[field]);
            if (!Number.isFinite(val) || val < min || val > max) {
                return `${field} must be between ${min} and ${max}`;
            }
        }
    }
    if (profile.name !== undefined && typeof profile.name !== 'string') {
        return 'name must be a string';
    }
    return null;
}

// ── encoding ─────────────────────────────────────────────────────────────────

export function encodeProfiles(profiles) {
    return Buffer.from(JSON.stringify(profiles)).toString('base64url');
}

export function decodeProfiles(encoded) {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
}

// ── POST /api/share ───────────────────────────────────────────────────────────

app.post('/api/share', (req, res) => {
    const { profiles } = req.body ?? {};

    if (!Array.isArray(profiles) || profiles.length === 0) {
        return res.status(400).json({ error: 'profiles must be a non-empty array' });
    }
    if (profiles.length > 5) {
        return res.status(400).json({ error: 'maximum 5 profiles allowed' });
    }
    for (let i = 0; i < profiles.length; i++) {
        const err = validateProfile(profiles[i]);
        if (err) return res.status(400).json({ error: `profile ${i + 1}: ${err}` });
    }

    const encoded = encodeProfiles(profiles);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ url: `${baseUrl}/?profiles=${encoded}` });
});

// ── OpenAPI spec ─────────────────────────────────────────────────────────────

function buildOpenApiSpec(baseUrl) {
    return {
        openapi: '3.0.0',
        info: {
            title: 'FPV Rate Profile Playground API',
            version: '1.0.0',
            description:
                'Share and compare Betaflight FPV drone rate profiles. ' +
                'POST one or more profiles to receive a shareable visualization URL. ' +
                'The first profile is loaded into the interactive editor; ' +
                'additional profiles are shown as reference overlays.',
        },
        servers: [{ url: baseUrl }],
        paths: {
            '/api/share': {
                post: {
                    operationId: 'shareProfiles',
                    summary: 'Generate a shareable comparison URL',
                    description:
                        'Accepts 1–5 Betaflight Actual Rates profiles and returns a URL ' +
                        'that opens the playground with all profiles overlaid for comparison. ' +
                        'All numeric fields are optional; omitted fields show as defaults.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['profiles'],
                                    properties: {
                                        profiles: {
                                            type: 'array',
                                            minItems: 1,
                                            maxItems: 5,
                                            items: { $ref: '#/components/schemas/RateProfile' },
                                        },
                                    },
                                },
                                example: {
                                    profiles: [
                                        {
                                            name: 'Freestyle',
                                            roll_rc_rate: 70, roll_rate: 670, roll_expo: 0,
                                            pitch_rc_rate: 70, pitch_rate: 670, pitch_expo: 0,
                                            yaw_rc_rate: 70,  yaw_rate: 600,  yaw_expo: 0,
                                            thr_mid: 50, thr_expo: 0,
                                        },
                                        {
                                            name: 'Cinematic',
                                            roll_rc_rate: 40, roll_rate: 400, roll_expo: 40,
                                            pitch_rc_rate: 40, pitch_rate: 400, pitch_expo: 40,
                                            yaw_rc_rate: 40,  yaw_rate: 350,  yaw_expo: 40,
                                            thr_mid: 55, thr_expo: 30,
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Shareable URL generated',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        required: ['url'],
                                        properties: {
                                            url: {
                                                type: 'string',
                                                format: 'uri',
                                                description: 'Open this URL to view/compare the profiles interactively',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        '400': {
                            description: 'Invalid input',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: { error: { type: 'string' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        components: {
            schemas: {
                RateProfile: {
                    type: 'object',
                    description:
                        'Betaflight Actual Rates profile. ' +
                        'All numeric fields are optional – missing fields fall back to defaults ' +
                        '(center=70, maxRate=670, expo=0, thr_mid=50, thr_expo=0).',
                    properties: {
                        name:          { type: 'string',  description: 'Display label for this profile (optional)' },
                        roll_rc_rate:  { type: 'integer', minimum: 0,   maximum: 255,  description: 'Roll center sensitivity (0–255)' },
                        roll_rate:     { type: 'integer', minimum: 200, maximum: 2000, description: 'Roll max rate in deg/s (200–2000)' },
                        roll_expo:     { type: 'integer', minimum: 0,   maximum: 100,  description: 'Roll expo – 0 = linear, 100 = max curve' },
                        pitch_rc_rate: { type: 'integer', minimum: 0,   maximum: 255,  description: 'Pitch center sensitivity (0–255)' },
                        pitch_rate:    { type: 'integer', minimum: 200, maximum: 2000, description: 'Pitch max rate in deg/s (200–2000)' },
                        pitch_expo:    { type: 'integer', minimum: 0,   maximum: 100,  description: 'Pitch expo' },
                        yaw_rc_rate:   { type: 'integer', minimum: 0,   maximum: 255,  description: 'Yaw center sensitivity (0–255)' },
                        yaw_rate:      { type: 'integer', minimum: 200, maximum: 2000, description: 'Yaw max rate in deg/s (200–2000)' },
                        yaw_expo:      { type: 'integer', minimum: 0,   maximum: 100,  description: 'Yaw expo' },
                        thr_mid:       { type: 'integer', minimum: 0,   maximum: 100,  description: 'Throttle mid-point (0–100, where 50 = 0.50)' },
                        thr_expo:      { type: 'integer', minimum: 0,   maximum: 100,  description: 'Throttle expo' },
                    },
                },
            },
        },
    };
}

app.get('/openapi.json', (req, res) => {
    res.json(buildOpenApiSpec(`${req.protocol}://${req.get('host')}`));
});

// ── AI plugin manifest ───────────────────────────────────────────────────────

app.get('/.well-known/ai-plugin.json', (req, res) => {
    const base = `${req.protocol}://${req.get('host')}`;
    res.json({
        schema_version: 'v1',
        name_for_human: 'FPV Rate Profile Playground',
        name_for_model: 'fpv_rate_profile_playground',
        description_for_human:
            'Visualize and compare Betaflight FPV drone rate profiles interactively',
        description_for_model:
            'Use this to share Betaflight Actual Rates profiles and generate comparison URLs. ' +
            'POST to /api/share with {"profiles": [{roll_rc_rate, roll_rate, roll_expo, ' +
            'pitch_rc_rate, pitch_rate, pitch_expo, yaw_rc_rate, yaw_rate, yaw_expo, ' +
            'thr_mid, thr_expo, name?}, ...]} (1–5 profiles). ' +
            'The response contains a "url" the user can visit to see an interactive, ' +
            'zoomable graph comparing all submitted profiles side-by-side.',
        auth: { type: 'none' },
        api: { type: 'openapi', url: `${base}/openapi.json` },
    });
});

// ── start ────────────────────────────────────────────────────────────────────

if (process.argv[1] === __filename) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`\nFPV Rate Profile Playground`);
        console.log(`  App:    http://localhost:${PORT}/`);
        console.log(`  API:    http://localhost:${PORT}/openapi.json`);
        console.log(`  Plugin: http://localhost:${PORT}/.well-known/ai-plugin.json\n`);
    });
}
