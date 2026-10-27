// Tests for version comparison and the GitHub release check. The network call
// is replaced with a stub so the tests are deterministic and offline.

const test = require('node:test');
const assert = require('node:assert/strict');

const {compareVersions, checkLatestRelease} = require('../src/update.js');

test('compareVersions handles equal, newer and older versions', () => {
    assert.equal(compareVersions('3.2.0', '3.2.0'), 0);
    assert.equal(compareVersions('3.2.1', '3.2.0'), 1);
    assert.equal(compareVersions('3.1.9', '3.2.0'), -1);
    assert.equal(compareVersions('4.0', '3.9.9'), 1);
});

test('compareVersions ignores a leading v and missing parts', () => {
    assert.equal(compareVersions('v3.2.0', '3.2'), 0);
    assert.equal(compareVersions('v3.3', '3.2.9'), 1);
    assert.equal(compareVersions('3', '3.0.0'), 0);
});

test('compareVersions treats pre-release suffixes as the base version', () => {
    assert.equal(compareVersions('3.2.0-beta.1', '3.2.0'), 0);
    assert.equal(compareVersions('3.2.0-rc1', '3.1.0'), 1);
});

test('compareVersions tolerates junk', () => {
    assert.equal(compareVersions('', '0.0.0'), 0);
    assert.equal(compareVersions('abc', '0'), 0);
});

test('checkLatestRelease reports an available update', async () => {
    const result = await checkLatestRelease('3.1.0', {
        fetchImpl: async () => ({
            ok: true,
            json: async () => ({
                tag_name: 'v3.2.0',
                html_url: 'https://example.test/release',
                name: 'instaling-bot 3.2.0',
                published_at: '2026-10-27T00:00:00Z',
                body: 'Notes'
            })
        })
    });

    assert.deepEqual(result, {
        current: '3.1.0',
        latest: '3.2.0',
        available: true,
        url: 'https://example.test/release',
        name: 'instaling-bot 3.2.0',
        publishedAt: '2026-10-27T00:00:00Z',
        notes: 'Notes'
    });
});

test('checkLatestRelease reports no update for the same version', async () => {
    const result = await checkLatestRelease('3.2.0', {
        fetchImpl: async () => ({
            ok: true,
            json: async () => ({tag_name: 'v3.2.0'})
        })
    });

    assert.equal(result.available, false);
    assert.equal(result.latest, '3.2.0');
    assert.match(result.url, /releases\/latest$/);
    assert.equal(result.name, 'instaling-bot 3.2.0');
    assert.equal(result.publishedAt, null);
    assert.equal(result.notes, '');
});

test('checkLatestRelease falls back to the current version when the tag is missing', async () => {
    const result = await checkLatestRelease('3.2.0', {
        fetchImpl: async () => ({ok: true, json: async () => ({})})
    });

    assert.equal(result.latest, '3.2.0');
    assert.equal(result.available, false);
});

test('checkLatestRelease rejects a non-OK response', async () => {
    await assert.rejects(
        checkLatestRelease('3.2.0', {
            fetchImpl: async () => ({ok: false, status: 503, json: async () => ({})})
        }),
        /HTTP 503/
    );
});

test('checkLatestRelease fails clearly without fetch', async () => {
    await assert.rejects(
        checkLatestRelease('3.2.0', {fetchImpl: null}),
        /Fetch is not available/
    );
});
