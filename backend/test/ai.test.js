import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL = 'mysql://x';
process.env.JWT_SECRET = 'secret-secret-secret-1';
process.env.AI_MODE = 'mock';
process.env.AI_MOCK_DELAY_MS = '0';

const { mockAnalyze } = await import('../src/lib/ai.js');

describe('mockAnalyze', () => {
  it('menghasilkan keluaran sama untuk foto yang sama', () => {
    const buffer = Buffer.from('foto-contoh-1');
    assert.deepEqual(mockAnalyze(buffer), mockAnalyze(buffer));
  });

  it('selalu sesuai kontrak respons AI', () => {
    for (let i = 0; i < 50; i += 1) {
      const result = mockAnalyze(Buffer.from(`foto-${i}`));
      assert.ok(result.label === null || typeof result.label === 'string');
      assert.ok(result.score >= 0 && result.score <= 1);
      assert.ok(Array.isArray(result.colors));
      assert.ok(Array.isArray(result.detections));
    }
  });
});
