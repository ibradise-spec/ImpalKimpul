import fsp from 'node:fs/promises';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AiError, normalizeAiResponse } from './aiMapping.js';

const MOCK_SAMPLES = [
  {
    label: 'laptop',
    score: 0.91,
    colors: [{ name: 'biru', hex: '#1F3A93', ratio: 0.62 }],
    detections: [
      { label: 'laptop', score: 0.91 },
      { label: 'cell phone', score: 0.4 },
    ],
  },
  {
    label: 'cell phone',
    score: 0.87,
    colors: [{ name: 'merah', hex: '#C8102E', ratio: 0.55 }],
    detections: [{ label: 'cell phone', score: 0.87 }],
  },
  {
    label: 'backpack',
    score: 0.82,
    colors: [{ name: 'hitam', hex: '#1B1B1B', ratio: 0.71 }],
    detections: [{ label: 'backpack', score: 0.82 }],
  },
  {
    label: 'umbrella',
    score: 0.76,
    colors: [{ name: 'kuning', hex: '#F2C500', ratio: 0.6 }],
    detections: [{ label: 'umbrella', score: 0.76 }],
  },
  {
    label: 'bottle',
    score: 0.34,
    colors: [{ name: 'biru', hex: '#1F5FBF', ratio: 0.48 }],
    detections: [{ label: 'bottle', score: 0.34 }],
  },
  {
    label: 'book',
    score: 0.79,
    colors: [{ name: 'hijau', hex: '#2E8B57', ratio: 0.52 }],
    detections: [{ label: 'book', score: 0.79 }],
  },
  {
    label: 'wallet',
    score: 0.68,
    colors: [{ name: 'cokelat', hex: '#8B4513', ratio: 0.66 }],
    detections: [{ label: 'wallet', score: 0.68 }],
  },
  { label: null, score: 0, colors: [], detections: [] },
];

export function mockAnalyze(buffer) {
  const digest = crypto.createHash('sha1').update(buffer).digest();
  return normalizeAiResponse(MOCK_SAMPLES[digest[0] % MOCK_SAMPLES.length]);
}

export async function analyzeImage(file) {
  const buffer = await fsp.readFile(file.path);

  if (env.aiMode === 'mock') {
    if (env.aiMockDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, env.aiMockDelayMs));
    }
    return mockAnalyze(buffer);
  }

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: file.mimetype }), file.originalname || 'photo');

  let res;
  try {
    res = await fetch(`${env.aiServiceUrl}/analyze`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(env.aiTimeoutMs),
    });
  } catch (err) {
    throw new AiError(err.name === 'TimeoutError' ? 'timeout' : 'unavailable', err.message);
  }

  if (!res.ok) {
    throw new AiError('unavailable', `AI service membalas status ${res.status}`);
  }

  let raw;
  try {
    raw = await res.json();
  } catch {
    throw new AiError('unavailable', 'Respons AI bukan JSON');
  }
  return normalizeAiResponse(raw);
}
