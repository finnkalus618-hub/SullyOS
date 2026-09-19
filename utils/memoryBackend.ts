/**
 * 统一记忆总线路由控制器 (Memory Backend Controller)
 *
 * 负责管理全局记忆后端模式：
 *  - 'local': 完全使用 SullyOS 原生记忆宫殿
 *  - 'ombre_first': 优先从 OmbreBrain 召回与写入，网络故障时平滑回退本地
 *  - 'ombre_only': 纯血模式，完全接管，绝不产生本地长期记忆
 */

export type MemoryBackendMode = 'local' | 'ombre_first' | 'ombre_only';

export interface MemoryBackendConfig {
    mode: MemoryBackendMode;
    serverUrl: string;
    apiKey?: string;
    timeoutMs: number;
    maxRecallChars: number;
}

const STORAGE_KEY = 'sully_memory_backend_config';
const EVENT_NAME = 'sully_memory_backend_change';

const DEFAULT_CONFIG: MemoryBackendConfig = {
    mode: 'local',
    serverUrl: 'https://faces-from-utilize-administration.trycloudflare.com/mcp',
    apiKey: '',
    timeoutMs: 4000,
    maxRecallChars: 3000,
};

export function getMemoryBackendConfig(): MemoryBackendConfig {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_CONFIG;
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_CONFIG;
    }
}

export function setMemoryBackendConfig(patch: Partial<MemoryBackendConfig>): MemoryBackendConfig {
    const current = getMemoryBackendConfig();
    const updated = { ...current, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    }
    return updated;
}

/** 当前是否选择了 OB 作为主记忆中枢 */
export function isOmbreMemorySelected(): boolean {
    const config = getMemoryBackendConfig();
    return config.mode === 'ombre_first' || config.mode === 'ombre_only';
}

/** 是否仅使用 OB（严格禁止本地长期读写） */
export function isOmbreOnlyMode(): boolean {
    return getMemoryBackendConfig().mode === 'ombre_only';
}

/** 是否允许读取本地长期记忆（local 模式或 ombre_first 故障回退时） */
export function shouldReadLocalMemory(ombreFailed: boolean = false): boolean {
    const config = getMemoryBackendConfig();
    if (config.mode === 'local') return true;
    if (config.mode === 'ombre_first') return ombreFailed;
    return false; // ombre_only 模式下始终为 false
}

/** 是否允许写入本地长期记忆库（记忆宫殿 / 向量提取 / 自动归档） */
export function shouldWriteLocalMemory(): boolean {
    const config = getMemoryBackendConfig();
    return config.mode === 'local';
}
