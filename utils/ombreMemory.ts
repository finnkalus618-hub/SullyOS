import {
  callMcpTool,
  testMcpConnection,
  type McpServerConfig,
  type McpToolDef,
  type McpToolResult,
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

export interface OmbreToolsResult {
  tools: McpToolDef[];
  error?: string;
}

/** 动态读取 Ombre 当前实际开放的全部工具及参数 Schema。 */
export async function getOmbreTools(): Promise<OmbreToolsResult> {
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
      tools: [],
      error: '尚未填写 Ombre Brain 地址',
    };
  }

  try {
    const connection = await testMcpConnection(server);

    if (!connection.ok || !connection.tools) {
      return {
        tools: [],
        error: connection.message || '无法读取 Ombre 工具',
      };
    }

    return {
      tools: connection.tools,
    };
  } catch (error) {
    return {
      tools: [],
      error:
        error instanceof Error
          ? error.message
          : '读取 Ombre 工具失败',
    };
  }
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
export interface OmbreSaveOptions {
  charId: string;
  charName: string;
  userName: string;
  content: string;
}

/** 将一段值得长期保留的经历写入 Ombre Brain。 */
export async function saveOmbreMemory(
  options: OmbreSaveOptions,
): Promise<{ ok: boolean; error?: string }> {
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
      ok: false,
      error: '尚未填写 Ombre Brain 地址',
    };
  }

  try {
    const connection = await testMcpConnection(server);

    if (!connection.ok || !connection.tools) {
      return {
        ok: false,
        error: connection.message,
      };
    }

    server.tools = connection.tools;

    const growTool = connection.tools.find(
      tool => tool.name === 'grow',
    );

    if (!growTool) {
      return {
        ok: false,
        error: 'Ombre Brain 没有提供 grow 工具',
      };
    }

    const memoryText = [
      `[character:${options.charId}]`,
      `我是${options.charName}。`,
      `与${options.userName}的这段经历：`,
      options.content.trim(),
    ].join('\n');

    const properties =
      growTool.inputSchema?.properties || {};

    let args: Record<string, unknown>;

    if ('content' in properties) {
      args = { content: memoryText };
    } else if ('text' in properties) {
      args = { text: memoryText };
    } else if ('conversation' in properties) {
      args = { conversation: memoryText };
    } else {
      return {
        ok: false,
        error: '无法识别当前 grow 工具的写入参数',
      };
    }

    const result = await callMcpTool(
      server,
      'grow',
      args,
    );

    if (!result.success) {
      return {
        ok: false,
        error: result.error || 'Ombre 记忆写入失败',
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Ombre 记忆写入失败',
    };
  }
}
