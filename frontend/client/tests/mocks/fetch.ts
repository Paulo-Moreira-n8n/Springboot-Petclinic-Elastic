
import { vi } from 'vitest';

export function mockFetchJsonOnce(data: unknown, init: Partial<Response> = { status: 200, statusText: 'OK' }) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    ok: (init.status ?? 200) < 400,
    json: () => Promise.resolve(data),
    clone: function () { return { ...this }; }
  } as unknown as Response));
}

export function mockFetchNoContentOnce(status = 204) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    status,
    statusText: 'No Content',
    ok: status < 400,
    json: () => Promise.resolve({}) // não será chamado em 204
  } as unknown as Response));
}

export function clearFetchMock() {
  const f = (globalThis as any).fetch;
  if (f && 'mockClear' in f) (f as any).mockClear();
}
