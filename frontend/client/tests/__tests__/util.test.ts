
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { url, submitForm } from '../../src/util/index';

describe('util', () => {
  describe('url', () => {
    it('returns url with full path', () => {
      expect(url('xxx')).toBe('/xxx'); // adaptado ao novo util
    });
  });

  describe('submitForm', () => {
    beforeEach(() => {
      const f = (globalThis as any).fetch;
      if (f && 'mockClear' in f) (f as any).mockClear();
    });

    it('submits all data', async () => {
      // mock de resposta 200 + JSON
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        ok: true,
        json: () => Promise.resolve({ x: 'y' })
      } as unknown as Response));

      await submitForm('POST', '/some-enzyme', { name: 'Test' }, (status, response) => {
        // fetch chamado corretamente
        expect((fetch as any).mock.calls.length).toBe(1);
        expect((fetch as any).mock.calls[0][0]).toBe('/some-enzyme');
        expect((fetch as any).mock.calls[0][1].method).toBe('POST');
        expect((fetch as any).mock.calls[0][1].body).toEqual(JSON.stringify({ name: 'Test' }));

        // resposta entregue ao callback
        expect(status).toBe(200);
        expect(response).toEqual({ x: 'y' });
      });
    });

    it('works with No Content (204) responses', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 204,
        statusText: 'No Content',
        ok: true,
        json: () => Promise.resolve({})
      } as unknown as Response));

      await submitForm('PUT', '/somewhere', { name: 'Test' }, (status, response) => {
        expect((fetch as any).mock.calls.length).toBe(1);
        expect(status).toBe(204);
        expect(response).toEqual({});
      });
    });
  });
});
