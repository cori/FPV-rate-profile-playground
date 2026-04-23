// RED phase: tests written before implementation
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

let server;
let port;

before(async () => {
    const { app } = await import('../server.js');
    await new Promise((resolve) => {
        server = app.listen(0, resolve);
    });
    port = server.address().port;
});

after(() => new Promise(resolve => server.close(resolve)));

// ── helpers ──────────────────────────────────────────────────────────────────

function postShare(body) {
    return fetch(`http://localhost:${port}/api/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

const VALID_PROFILE = {
    name: 'Test Profile',
    roll_rc_rate: 70,  roll_rate: 670,  roll_expo: 0,
    pitch_rc_rate: 70, pitch_rate: 670, pitch_expo: 0,
    yaw_rc_rate: 70,   yaw_rate: 600,   yaw_expo: 0,
    thr_mid: 50, thr_expo: 0,
};

// ── POST /api/share ───────────────────────────────────────────────────────────

test('POST /api/share – 400 when profiles key missing', async () => {
    const res = await postShare({});
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.ok(json.error, 'should include error message');
});

test('POST /api/share – 400 when profiles is empty array', async () => {
    const res = await postShare({ profiles: [] });
    assert.equal(res.status, 400);
});

test('POST /api/share – 400 when more than 5 profiles', async () => {
    const profiles = Array(6).fill({ ...VALID_PROFILE });
    const res = await postShare({ profiles });
    assert.equal(res.status, 400);
});

test('POST /api/share – 400 when roll_rc_rate out of range', async () => {
    const res = await postShare({ profiles: [{ roll_rc_rate: 999 }] });
    assert.equal(res.status, 400);
});

test('POST /api/share – 400 when roll_rate below minimum', async () => {
    const res = await postShare({ profiles: [{ roll_rate: 10 }] });
    assert.equal(res.status, 400);
});

test('POST /api/share – 400 when name is not a string', async () => {
    const res = await postShare({ profiles: [{ name: 42, roll_rc_rate: 70 }] });
    assert.equal(res.status, 400);
});

test('POST /api/share – 200 with valid single profile', async () => {
    const res = await postShare({ profiles: [VALID_PROFILE] });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.url, 'response should include url');
    assert.ok(json.url.includes('/?profiles='), 'url should contain ?profiles= param');
});

test('POST /api/share – partial profile is accepted (missing fields use defaults)', async () => {
    const res = await postShare({ profiles: [{ roll_rc_rate: 80, roll_rate: 750 }] });
    assert.equal(res.status, 200);
});

test('POST /api/share – URL decodes back to the original profiles', async () => {
    const profiles = [
        { name: 'A', roll_rc_rate: 70, roll_rate: 670, roll_expo: 0,
          pitch_rc_rate: 75, pitch_rate: 650, pitch_expo: 10,
          yaw_rc_rate: 60,  yaw_rate: 600,  yaw_expo: 5,
          thr_mid: 50, thr_expo: 0 },
        { name: 'B', roll_rc_rate: 80, roll_rate: 800, roll_expo: 20,
          pitch_rc_rate: 80, pitch_rate: 800, pitch_expo: 20,
          yaw_rc_rate: 70,  yaw_rate: 700,  yaw_expo: 10,
          thr_mid: 45, thr_expo: 5 },
    ];
    const res = await postShare({ profiles });
    assert.equal(res.status, 200);
    const { url } = await res.json();

    const urlObj = new URL(url);
    const encoded = urlObj.searchParams.get('profiles');
    assert.ok(encoded, 'url should have profiles param');

    const { decodeProfiles } = await import('../server.js');
    const decoded = decodeProfiles(encoded);
    assert.deepEqual(decoded, profiles);
});

// ── GET /openapi.json ─────────────────────────────────────────────────────────

test('GET /openapi.json – returns 200 with valid OpenAPI 3.0 spec', async () => {
    const res = await fetch(`http://localhost:${port}/openapi.json`);
    assert.equal(res.status, 200);
    const spec = await res.json();
    assert.equal(spec.openapi, '3.0.0');
    assert.ok(spec.info?.title);
    assert.ok(spec.paths?.['/api/share']?.post, 'should document POST /api/share');
    assert.ok(spec.components?.schemas?.RateProfile, 'should include RateProfile schema');
});

// ── GET /.well-known/ai-plugin.json ──────────────────────────────────────────

test('GET /.well-known/ai-plugin.json – returns plugin manifest', async () => {
    const res = await fetch(`http://localhost:${port}/.well-known/ai-plugin.json`);
    assert.equal(res.status, 200);
    const manifest = await res.json();
    assert.ok(manifest.name_for_model);
    assert.ok(manifest.description_for_model);
    assert.ok(manifest.api?.url);
});

// ── static serving ────────────────────────────────────────────────────────────

test('GET / – serves index.html', async () => {
    const res = await fetch(`http://localhost:${port}/`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('<!DOCTYPE html>'));
});

// ── unit: validateProfile ─────────────────────────────────────────────────────

test('validateProfile – returns null for a fully valid profile', async () => {
    const { validateProfile } = await import('../server.js');
    assert.equal(validateProfile(VALID_PROFILE), null);
});

test('validateProfile – returns null for an empty profile object (all optional)', async () => {
    const { validateProfile } = await import('../server.js');
    assert.equal(validateProfile({}), null);
});

test('validateProfile – returns error string for non-object', async () => {
    const { validateProfile } = await import('../server.js');
    assert.ok(validateProfile(null));
    assert.ok(validateProfile('string'));
    assert.ok(validateProfile(42));
});

test('validateProfile – returns error for roll_rc_rate > 255', async () => {
    const { validateProfile } = await import('../server.js');
    assert.ok(validateProfile({ roll_rc_rate: 256 }));
});

test('validateProfile – returns error for roll_rate < 200', async () => {
    const { validateProfile } = await import('../server.js');
    assert.ok(validateProfile({ roll_rate: 199 }));
});

// ── unit: encode / decode round-trip ─────────────────────────────────────────

test('encodeProfiles / decodeProfiles round-trip', async () => {
    const { encodeProfiles, decodeProfiles } = await import('../server.js');
    const profiles = [VALID_PROFILE, { name: 'Café ☕', roll_rc_rate: 80 }];
    const encoded = encodeProfiles(profiles);
    assert.equal(typeof encoded, 'string');
    // should be URL-safe (no +, /, = characters)
    assert.ok(!/[+/=]/.test(encoded), 'encoded should be URL-safe base64url');
    const decoded = decodeProfiles(encoded);
    assert.deepEqual(decoded, profiles);
});
