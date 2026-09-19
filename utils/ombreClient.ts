import { getMemoryBackendConfig } from './memoryBackend';

export interface OmbreHealthResult {
  ok: boolean;
  message: string;
}

/** 检查 Ombre Brain 服务是否在线。 */
export async function checkOmbreHealth(): Promise<OmbreHealthResult> {
  const config = getMemoryBackendConfig();

  try {
    const baseUrl = config.serverUrl
      .trim()
      .replace(/\/mcp\/?$/, '')
      .replace(/\/+$/, '');

    if (!baseUrl) {
      return {
        ok: false,
        message: '尚未填写 Ombre Brain 地址',
      };
    }

    const controller = new AbortController();
    const timer = window.setTimeout(
      () => controller.abort(),
      config.timeoutMs,
    );

    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return {
          ok: false,
          message: `连接失败：HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        ok: data?.status === 'ok',
        message:
          data?.status === 'ok'
            ? 'Ombre Brain 连接正常'
            : 'Ombre Brain 返回了异常状态',
      };
    } finally {
      window.clearTimeout(timer);
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? `连接失败：${error.message}`
          : '连接失败：未知错误',
    };
  }
}
