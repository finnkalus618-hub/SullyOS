import { getMemoryBackendConfig } from './memoryBackend';
import {
  callMcpTool,
  testMcpConnection,
  type McpServerConfig,
} from './mcpClient';

export interface OmbreRecallOptions {
  charId: string;
  charName: string;
  userName: string;
  query: string;
}

export interface OmbreRecallResult {
  content: string;
  error?: string;
}

/** 从 Ombre Brain 召回角色相关记忆。 */
export async function recallOmbreMemory(
  options: OmbreRecallOptions,
): Promise<OmbreRecallResult> {
  const config = getMemoryBackendConfig();

  const server: McpServerConfig = {
    id: 'ombre-memory',
    name: 'Ombre Brain',
    url: config.serverUrl.trim(),
    token: config.apiKey?.trim() || undefined,
    enabled: true,
    updatedAt: Date.now(),
  };

  if (!server.url) {
    return {
      content: '',
      error: '尚未填写 Ombre Brain 地址',
    };
  }

  try {
    const connection = await testMcpConnection(server);

    if (!connection.ok || !connection.tools) {
      return {
        content: '',
        error: connection.message,
      };
    }

    server.tools = connection.tools;

    const toolName = connection.tools.some(
      tool => tool.name === 'breath_search',
    )
      ? 'breath_search'
      : 'breath';

    const query = [
      `[character:${options.charId}]`,
      `角色：${options.charName}`,
      `用户：${options.userName}`,
      options.query,
    ]
      .filter(Boolean)
      .join('\n');

    const result = await callMcpTool(
      server,
      toolName,
      toolName === 'breath_search'
        ? {
            query,
            max_results: 8,
          }
        : {},
    );

    if (!result.success) {
      return {
        content: '',
        error: result.error || 'Ombre 记忆召回失败',
      };
    }

    const content =
      typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data ?? '', null, 2);

    return {
      content: content.slice(0, config.maxRecallChars),
    };
  } catch (error) {
    return {
      content: '',
      error:
        error instanceof Error
          ? error.message
          : 'Ombre 记忆召回失败',
    };
  }
}
