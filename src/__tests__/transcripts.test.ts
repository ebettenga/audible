import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '../..');

type TranscriptIndexEntry = {
  id: string;
  title: string;
  url: string;
  topic: string;
  file: string;
};

describe('quiz source transcripts', () => {
  const index: TranscriptIndexEntry[] = JSON.parse(
    readFileSync(join(root, 'transcripts/index.json'), 'utf8'),
  );

  it('indexes the seven Fourth and Film videos', () => {
    expect(index.map((item) => item.id)).toEqual([
      'sRaIlyv95hs',
      'Ebn6c1jNZbo',
      'Q6iuu58jLgU',
      'DqdeUAgXiyo',
      'Of_TwCsCETs',
      'ROliJ27Br9A',
      'IgM3nO_ZHjM',
    ]);
  });

  it('keeps each caption file and maps it to a Learn topic', () => {
    const topics = new Set(index.map((item) => item.topic));
    expect(topics.size).toBe(index.length);
    for (const item of index) {
      const path = join(root, item.file);
      expect(existsSync(path)).toBe(true);
      const text = readFileSync(path, 'utf8');
      expect(text).toContain(item.title);
      expect(text).toContain(item.url);
      expect(text).toContain(`Topic: ${item.topic}`);
      expect(text.length).toBeGreaterThan(2000);
    }
  });

  it('does not split mid-sentence headings in the formations transcript', () => {
    const text = readFileSync(join(root, 'transcripts/sRaIlyv95hs-offensive-formations.txt'), 'utf8');
    expect(text).not.toMatch(/running backs\n\n## Spread\n\nspread out/);
    expect(text).toMatch(/## Spread\n\nSpread\. Take the single back formation/);
  });
});
