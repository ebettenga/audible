import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatTranscript,
  joinPlainText,
  parseArgs,
  parseYouTubeVideoId,
  segmentsFromJson3,
} from './youtube-transcript.mjs';

test('parses watch, short, embed, and raw ids', () => {
  assert.equal(parseYouTubeVideoId('sRaIlyv95hs'), 'sRaIlyv95hs');
  assert.equal(
    parseYouTubeVideoId('https://youtu.be/sRaIlyv95hs?is=mnVUcQvhuX5bqIB3'),
    'sRaIlyv95hs',
  );
  assert.equal(
    parseYouTubeVideoId('https://www.youtube.com/watch?v=sRaIlyv95hs&t=12s'),
    'sRaIlyv95hs',
  );
  assert.equal(
    parseYouTubeVideoId('https://www.youtube.com/embed/sRaIlyv95hs'),
    'sRaIlyv95hs',
  );
  assert.equal(
    parseYouTubeVideoId('https://www.youtube.com/shorts/sRaIlyv95hs'),
    'sRaIlyv95hs',
  );
});

test('rejects junk', () => {
  assert.throws(() => parseYouTubeVideoId(''), /Pass a YouTube URL/);
  assert.throws(() => parseYouTubeVideoId('https://example.com/watch'), /Could not find/);
});

test('parses CLI args', () => {
  const args = parseArgs([
    'https://youtu.be/sRaIlyv95hs',
    '--lang',
    'en',
    '--timed',
    '--out',
    'notes.txt',
  ]);
  assert.equal(args.target, 'https://youtu.be/sRaIlyv95hs');
  assert.equal(args.lang, 'en');
  assert.equal(args.timed, true);
  assert.equal(args.out, 'notes.txt');
});

test('joins caption fragments into readable prose', () => {
  const text = joinPlainText([
    { text: 'T formation', start: 0, duration: 1 },
    { text: 'is the grandfather', start: 1, duration: 1 },
    { text: 'of modern offenses.', start: 2, duration: 1 },
  ]);
  assert.equal(text, 'T formation is the grandfather of modern offenses.');
});

test('reads json3 caption events', () => {
  const segments = segmentsFromJson3({
    events: [
      { tStartMs: 1000, dDurationMs: 1500, segs: [{ utf8: 'I formation' }] },
      { tStartMs: 2500, dDurationMs: 800, segs: [{ utf8: '' }] },
    ],
  });
  assert.deepEqual(segments, [{ text: 'I formation', start: 1, duration: 1.5 }]);
});

test('formats timed output', () => {
  const out = formatTranscript([{ text: 'Shotgun', start: 65, duration: 2 }], 'timed');
  assert.equal(out, '[01:05] Shotgun\n');
});
