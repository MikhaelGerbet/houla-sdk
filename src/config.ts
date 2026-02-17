export interface HoulaConfig {
  apiKey: string;
  apiUrl?: string;
  timeout?: number;
  /** Default workspace ID. All requests will include X-Workspace-Id header when set. */
  workspaceId?: string;
}

export const DEFAULT_CONFIG: Partial<HoulaConfig> = {
  apiUrl: "https://hou.la",
  timeout: 30000,
};

export function createConfig(config: HoulaConfig): Required<Omit<HoulaConfig, "workspaceId">> & { workspaceId?: string } {
  if (!config.apiKey) {
    throw new Error("Hou.la SDK: apiKey is required. Get one at https://hou.la/admin/settings/api-keys");
  }

  if (!config.apiKey.startsWith("houla_sk_")) {
    throw new Error("Hou.la SDK: Invalid API key format. API keys must start with houla_sk_");
  }

  return {
    apiKey: config.apiKey,
    apiUrl: config.apiUrl || DEFAULT_CONFIG.apiUrl!,
    timeout: config.timeout || DEFAULT_CONFIG.timeout!,
    workspaceId: config.workspaceId,
  };
}
