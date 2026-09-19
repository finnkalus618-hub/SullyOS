import { getMemoryBackendConfig } from './memoryBackend';
import {
  testMcpConnection,
  type McpServerConfig,
} from './mcpClient';

export interface OmbreHealthResult {
  ok: boolean;
  message: string;
}

/** 测试 Ombre Brain 的真实 MCP 握手和工具发现。 */
export async function checkOmbreHealth(): Promise<OmbreHealthResult> {
  const config = getMemoryBackendConfig();
  const url = config.serverUrl.trim();

  if (!url) {
    return {
      ok: false,
      message: '尚未填写 Ombre Brain 地址',
    };
  }

  const server: McpServerConfig = {
    id: 'ombre-memory',
    name: 'Ombre Brain',
    url,
    token: config.apiKey?.trim() || undefined,
    enabled: true,
    updatedAt: Date.now(),
  };

  const result = await testMcpConnection(server);

  if (!result.ok) {
    return {
      ok: false,
      message: `Ombre MCP 连接失败：${result.message}`,
    };
  }

  const toolNames = (result.tools || []).map(tool => tool.name);

  if (
    !toolNames.includes('breath') &&
    !toolNames.includes('breath_search')
  ) {
    return {
      ok: false,
      message: '连接成功，但没有发现 Ombre 记忆工具',
    };
  }

  return {
    ok: true,
    message: `Ombre MCP 连接正常，发现 ${toolNames.length} 个工具`,
  };
}
