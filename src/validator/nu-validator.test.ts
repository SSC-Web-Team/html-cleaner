import { describe, expect, it, vi } from 'vitest';
import { validateHtml } from './nu-validator.ts';

function mockFetch(payload: unknown, ok = true) {
  return vi.fn(async () => ({
    ok,
    status: ok ? 200 : 503,
    statusText: ok ? 'OK' : 'Unavailable',
    json: async () => payload,
  })) as unknown as typeof fetch;
}

describe('validateHtml', () => {
  it('wraps fragments and maps line numbers back', async () => {
    const fetchImpl = mockFetch({
      messages: [{ type: 'error', message: 'bad', lastLine: 5, firstColumn: 1, lastColumn: 6 }],
    });
    const result = await validateHtml('<img>', 'en', { fetchImpl });
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0];
    expect(url as string).toContain('out=json');
    expect((init as { body: string }).body).toContain('<!DOCTYPE html>');
    expect(result[0]).toMatchObject({ line: 1, column: 1, endColumn: 6, message: 'bad' });
  });

  it('uses the selected language on the wrapper', async () => {
    const fetchImpl = mockFetch({ messages: [] });
    await validateHtml('<p>Bonjour</p>', 'fr', { fetchImpl });
    expect((vi.mocked(fetchImpl).mock.calls[0][1] as { body: string }).body).toContain(
      '<html lang="fr">',
    );
  });

  it('does not wrap full documents', async () => {
    const fetchImpl = mockFetch({ messages: [] });
    const doc = '<!DOCTYPE html><html><body></body></html>';
    await validateHtml(doc, 'fr', { fetchImpl });
    expect((vi.mocked(fetchImpl).mock.calls[0][1] as { body: string }).body).toBe(doc);
  });

  it('throws on HTTP errors', async () => {
    await expect(
      validateHtml('<p></p>', 'en', { fetchImpl: mockFetch({}, false) }),
    ).rejects.toThrow(/503/);
  });
});
