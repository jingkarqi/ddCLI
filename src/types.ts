export interface ProviderConfig {
  model: string;
  base_url?: string;
  api_key: string;
  timeout: number;
}

export interface AppConfig {
  default_provider: 'openai' | 'anthropic' | 'deepseek';
  providers: {
    openai: ProviderConfig;
    anthropic: ProviderConfig;
    deepseek: ProviderConfig;
  };
  auto_execute: boolean;
  shell: 'auto' | 'powershell' | 'bash';
}

export interface ProcessOptions {
  provider?: string;
  autoExecute?: boolean;
  debug?: boolean;
}

export interface CommandResponse {
  command: string;
  explanation: string;
  safe: boolean;
}

export interface SecurityCheckResult {
  safe: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'blocked';
  warning?: string;
  requiresConfirmation: boolean;
}

export interface ExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  command: string;
}

export interface SecurityResult {
  safe: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'blocked';
  warning?: string;
  requiresConfirmation: boolean;
}

export interface CommandResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}