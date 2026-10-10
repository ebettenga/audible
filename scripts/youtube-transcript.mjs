#!/usr/bin/env node
/**
 * Pull a public YouTube caption track and print a clean transcript.
 *
 *   node scripts/youtube-transcript.mjs https://youtu.be/sRaIlyv95hs
 *   npm run transcript -- https://youtu.be/sRaIlyv95hs --out transcript.txt
 *
 * YouTube blocks most cloud / datacenter IPs. Run this on a normal home
 * network, or pass a Netscape cookies file from a signed-in browser.
 *
 * Options:
 *   --lang <code>     Prefer this language (default: en)
 *   --out <path>      Write the transcript to a file instead of stdout
 *   --json            Emit timed segments as JSON
 *   --srt             Emit SubRip captions
 *   --timed           Prefix each line with [mm:ss]
 *   --list            List available caption tracks and exit
 *   --cookies <file>  Netscape cookies.txt from a signed-in YouTube session
 */

import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ANDROID_KEY = 'AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w';
const ANDROID_UA =
  'com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip';
const WEB_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

const CLIENTS = [
  {
    name: 'ANDROID',
    url: `https://www.youtube.com/youtubei/v1/player?key=${ANDROID_KEY}&prettyPrint=false`,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': ANDROID_UA,
      'X-YouTube-Client-Name': '3',
      'X-YouTube-Client-Version': '20.10.38',
    },
    body: (videoId) => ({
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '20.10.38',
          androidSdkVersion: 34,
          hl: 'en',
          gl: 'US',
        },
      },
    }),
  },
  {
    name: 'WEB',
    url: 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': WEB_UA,
      'X-YouTube-Client-Name': '1',
      'X-YouTube-Client-Version': '2.20241010.01.00',
    },
    body: (videoId) => ({
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20241010.01.00',
          hl: 'en',
          gl: 'US',
        },
      },
    }),
  },
];

export function parseYouTubeVideoId(input) {
  const raw = String(input ?? '').trim();
  if (!raw) throw new Error('Pass a YouTube URL or 11-character video id.');

  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Not a YouTube URL or video id: ${raw}`);
  }

  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return id;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const fromQuery = url.searchParams.get('v');
    if (fromQuery && /^[A-Za-z0-9_-]{11}$/.test(fromQuery)) return fromQuery;

    const parts = url.pathname.split('/').filter(Boolean);
    const prefixed = ['embed', 'shorts', 'live', 'v'].includes(parts[0]) ? parts[1] : parts[0];
    if (prefixed && /^[A-Za-z0-9_-]{11}$/.test(prefixed)) return prefixed;
  }

  throw new Error(`Could not find a video id in ${raw}`);
}

export function parseArgs(argv) {
  const args = {
    target: '',
    lang: 'en',
    out: '',
    cookies: '',
    json: false,
    srt: false,
    timed: false,
    list: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--lang') args.lang = argv[++i] ?? args.lang;
    else if (token === '--out') args.out = argv[++i] ?? '';
    else if (token === '--cookies') args.cookies = argv[++i] ?? '';
    else if (token === '--json') args.json = true;
    else if (token === '--srt') args.srt = true;
    else if (token === '--timed') args.timed = true;
    else if (token === '--list') args.list = true;
    else if (token === '--help' || token === '-h') args.help = true;
    else if (!token.startsWith('-') && !args.target) args.target = token;
    else throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function cleanCaptionText(text) {
  return decodeEntities(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function cookieHeaderFromFile(path) {
  if (!path) return '';
  const raw = await readFile(path, 'utf8');
  const pairs = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    if (line.includes('\t')) {
      const cols = line.split('\t');
      const name = cols[5];
      const value = cols[6];
      if (name && value != null) pairs.push(`${name}=${value}`);
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.includes('=')) pairs.push(trimmed.replace(/^Cookie:\s*/i, ''));
  }
  return pairs.join('; ');
}

function requestHeaders(base, cookieHeader) {
  return cookieHeader ? { ...base, Cookie: cookieHeader } : { ...base };
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res.json();
}

function tracksFromPlayer(player) {
  return player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
}

function playabilityError(player) {
  const status = player?.playabilityStatus;
  if (!status || status.status === 'OK') return '';
  return status.reason || status.status;
}

function botBlocked(message) {
  return /sign in to confirm|not a bot|requestblocked|ip.?block/i.test(message);
}

async function fetchPlayer(videoId, cookieHeader) {
  const errors = [];
  for (const client of CLIENTS) {
    try {
      const player = await fetchJson(client.url, {
        method: 'POST',
        headers: requestHeaders(client.headers, cookieHeader),
        body: JSON.stringify(client.body(videoId)),
      });
      const blocked = playabilityError(player);
      const tracks = tracksFromPlayer(player);
      if (tracks.length) {
        return { player, tracks, client: client.name };
      }
      errors.push(blocked ? `${client.name}: ${blocked}` : `${client.name}: no caption tracks`);
    } catch (err) {
      errors.push(`${client.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(errors.join(' | '));
}

function scoreTrack(track, preferred) {
  const lang = String(track.languageCode ?? '').toLowerCase();
  const want = preferred.toLowerCase();
  let score = 0;
  if (lang === want || lang.startsWith(`${want}-`)) score += 100;
  else if (lang.split('-')[0] === want.split('-')[0]) score += 60;
  if (!track.kind || track.kind !== 'asr') score += 10;
  return score;
}

function pickTrack(tracks, preferred) {
  if (!tracks.length) throw new Error('This video has no public captions.');
  return [...tracks].sort((a, b) => scoreTrack(b, preferred) - scoreTrack(a, preferred))[0];
}

function timedTextUrl(baseUrl) {
  const url = new URL(baseUrl);
  url.searchParams.set('fmt', 'json3');
  return url.toString();
}

export function segmentsFromJson3(data) {
  const events = Array.isArray(data?.events) ? data.events : [];
  const segments = [];
  for (const event of events) {
    const text = cleanCaptionText((event.segs ?? []).map((seg) => seg.utf8 ?? '').join(''));
    if (!text || text === '\n') continue;
    segments.push({
      text,
      start: (event.tStartMs ?? 0) / 1000,
      duration: (event.dDurationMs ?? 0) / 1000,
    });
  }
  return segments;
}

function formatTimestamp(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatSrtTime(seconds) {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const frac = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(frac).padStart(3, '0')}`;
}

export function joinPlainText(segments) {
  const parts = [];
  for (const segment of segments) {
    const text = segment.text.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (!parts.length) {
      parts.push(text);
      continue;
    }
    const prev = parts[parts.length - 1];
    const needsSpace = !/[(\[]$/.test(prev) && !/^[,.;:?!)\]}]/.test(text);
    parts[parts.length - 1] = `${prev}${needsSpace ? ' ' : ''}${text}`;
  }
  return parts
    .join(' ')
    .replace(/\s+([,.;:?!])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatTranscript(segments, mode) {
  if (mode === 'json') return `${JSON.stringify(segments, null, 2)}\n`;
  if (mode === 'srt') {
    return `${segments
      .map((segment, index) => {
        const end = segment.start + (segment.duration || 2);
        return `${index + 1}\n${formatSrtTime(segment.start)} --> ${formatSrtTime(end)}\n${segment.text}\n`;
      })
      .join('\n')}\n`;
  }
  if (mode === 'timed') {
    return `${segments.map((segment) => `[${formatTimestamp(segment.start)}] ${segment.text}`).join('\n')}\n`;
  }
  return `${joinPlainText(segments)}\n`;
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr.trim() || `${command} exited ${code}`));
    });
  });
}

function parseVtt(vtt) {
  const segments = [];
  const blocks = vtt.replace(/^\uFEFF/, '').split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).filter((line) => line && !line.startsWith('WEBVTT') && !line.startsWith('NOTE') && !line.startsWith('Kind:') && !line.startsWith('Language:'));
    const stamp = lines.find((line) => line.includes('-->'));
    if (!stamp) continue;
    const start = stamp.split('-->')[0].trim();
    const text = cleanCaptionText(
      lines
        .filter((line) => !line.includes('-->') && !/^\d+$/.test(line))
        .join(' ')
        .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, ''),
    );
    if (!text) continue;
    const [hh = '0', mm = '0', rest = '0'] = start.split(':');
    const seconds = Number(hh) * 3600 + Number(mm) * 60 + Number(rest.replace(',', '.'));
    const last = segments[segments.length - 1];
    if (last && last.text === text) continue;
    segments.push({ text, start: seconds, duration: 0 });
  }
  return segments;
}

async function fetchViaYtDlp(videoId, lang, cookiesPath) {
  const dir = await mkdtemp(join(tmpdir(), 'audible-yt-'));
  const output = join(dir, 'captions');
  const args = [
    '--skip-download',
    '--write-subs',
    '--write-auto-subs',
    '--sub-langs',
    `${lang}.*`,
    '--sub-format',
    'vtt',
    '-o',
    output,
    `https://www.youtube.com/watch?v=${videoId}`,
  ];
  if (cookiesPath) args.unshift('--cookies', cookiesPath);
  try {
    await runCommand('yt-dlp', args);
    const { readdir } = await import('node:fs/promises');
    const files = (await readdir(dir)).filter((name) => name.endsWith('.vtt'));
    if (!files.length) throw new Error('yt-dlp did not write a caption file.');
    const vtt = await readFile(join(dir, files[0]), 'utf8');
    const segments = parseVtt(vtt);
    if (!segments.length) throw new Error('yt-dlp caption file was empty.');
    return {
      player: { videoDetails: { title: videoId } },
      tracks: [{ languageCode: lang, kind: 'asr', name: { simpleText: files[0] } }],
      client: 'yt-dlp',
      segments,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function printUsage() {
  console.log(`Pull a public YouTube caption track.

Usage:
  node scripts/youtube-transcript.mjs <url-or-id> [--lang en] [--out file.txt]
  npm run transcript -- <url-or-id> [--timed|--srt|--json|--list]
  npm run transcript -- <url-or-id> --cookies cookies.txt
`);
}

function formatLoadError(videoId, cause) {
  if (!botBlocked(cause)) {
    return `Could not load captions for ${videoId}. ${cause}`;
  }
  return [
    `YouTube blocked this network for ${videoId} (bot check).`,
    'Run the script on your own machine, or pass cookies from a signed-in browser:',
    '  npm run transcript -- URL --cookies cookies.txt',
    'Export cookies with a "Get cookies.txt LOCALLY" browser extension (Netscape format).',
  ].join('\n');
}

async function writeOutput(text, outPath) {
  if (outPath) {
    await writeFile(outPath, text, 'utf8');
    return;
  }
  process.stdout.write(text);
}

export async function main(argv = process.argv.slice(2), io = { writeOutput }) {
  const args = parseArgs(argv);
  if (args.help || !args.target) {
    printUsage();
    if (!args.target && !args.help) process.exitCode = 1;
    return;
  }

  const videoId = parseYouTubeVideoId(args.target);
  const cookieHeader = await cookieHeaderFromFile(args.cookies);

  let player;
  let tracks;
  let client;
  let segments;
  let selectedTrack;

  try {
    ({ player, tracks, client } = await fetchPlayer(videoId, cookieHeader));
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    try {
      const fallback = await fetchViaYtDlp(videoId, args.lang, args.cookies);
      player = fallback.player;
      tracks = fallback.tracks;
      client = fallback.client;
      segments = fallback.segments;
    } catch {
      throw new Error(formatLoadError(videoId, cause));
    }
  }

  const title = player?.videoDetails?.title ?? videoId;

  if (args.list) {
    const lines = [
      `Title: ${title}`,
      `Video: ${videoId}`,
      `Client: ${client}`,
      'Tracks:',
      ...tracks.map((track) => {
        const kind = track.kind === 'asr' ? 'auto' : 'manual';
        return `  - ${track.languageCode} (${kind}) ${track.name?.simpleText ?? ''}`.trim();
      }),
    ];
    await io.writeOutput(`${lines.join('\n')}\n`, args.out);
    return { videoId, title, tracks };
  }

  if (!segments) {
    const track = pickTrack(tracks, args.lang);
    const captions = await fetchJson(timedTextUrl(track.baseUrl), {
      headers: requestHeaders({ 'User-Agent': ANDROID_UA }, cookieHeader),
    });
    segments = segmentsFromJson3(captions);
    if (!segments.length) {
      throw new Error(`Caption track ${track.languageCode} was empty.`);
    }
    selectedTrack = track;
  }

  const language = selectedTrack?.languageCode ?? args.lang;
  const generated = selectedTrack?.kind === 'asr' || client === 'yt-dlp';
  const mode = args.json ? 'json' : args.srt ? 'srt' : args.timed ? 'timed' : 'text';
  const body = formatTranscript(segments, mode);
  const header =
    mode === 'json'
      ? ''
      : `# ${title}\n# https://youtu.be/${videoId}\n# language: ${language}${generated ? ' (auto)' : ''}\n\n`;
  const output = `${header}${body}`;

  await io.writeOutput(output, args.out);
  if (args.out) {
    process.stderr.write(`Wrote ${segments.length} segments to ${args.out}\n`);
  }

  return { videoId, title, segments, language };
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
