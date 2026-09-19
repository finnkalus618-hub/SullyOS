import {
  MemoryConfig,
  normalizeMemoryConfig,
} from '../types';

const MEMORY_CONFIG_KEY = 'os_memory_config';

/** 读取记忆库配置；旧用户默认使用原生记忆库。 */
export function loadMemoryConfig(): MemoryConfig {
  try {
    const saved = localStorage.getItem(MEMORY_CONFIG_KEY);

    return normalizeMemoryConfig(
      saved ? JSON.parse(saved) : undefined,
    );
  } catch {
    return normalizeMemoryConfig();
  }
}

/** 保存并返回格式化后的记忆库配置。 */
export function saveMemoryConfig(
  config: Partial<MemoryConfig>,
): MemoryConfig {
  const normalized = normalizeMemoryConfig(config);

  localStorage.setItem(
    MEMORY_CONFIG_KEY,
    JSON.stringify(normalized),
  );

  return normalized;
}
