import { BaseAdapter } from './BaseAdapter';
import { OpenAIAdapter } from './adapters/OpenAIAdapter';
import { AnthropicAdapter } from './adapters/AnthropicAdapter';
import { DeepSeekAdapter } from './adapters/DeepSeekAdapter';
import { ConfigManager } from '../config/ConfigManager';
import { APIResponse } from './types';

export class APIRouter {
  private configManager: ConfigManager;
  private adapters: Map<string, { adapter: BaseAdapter; lastUsed: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟
  private adapterFactories = new Map<string, new (apiKey: string, baseUrl: string, model: string, timeout: number) => BaseAdapter>();

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;

    // 注册适配器工厂
    this.registerAdapter('openai', OpenAIAdapter);
    this.registerAdapter('anthropic', AnthropicAdapter);
    this.registerAdapter('deepseek', DeepSeekAdapter);
  }

  /**
   * 注册适配器工厂
   */
  public registerAdapter(name: string, factory: new (apiKey: string, baseUrl: string, model: string, timeout: number) => BaseAdapter): void {
    this.adapterFactories.set(name, factory);
  }

  /**
   * 创建适配器实例
   */
  private createAdapter(providerName: string, providerConfig: any): BaseAdapter {
    const Factory = this.adapterFactories.get(providerName);
    if (!Factory) {
      throw new Error(`不支持的API提供商: ${providerName}`);
    }
    return new Factory(
      providerConfig.api_key,
      providerConfig.base_url || this.getDefaultUrl(providerName),
      providerConfig.model,
      providerConfig.timeout
    );
  }

  /**
   * 获取默认URL
   */
  private getDefaultUrl(providerName: string): string {
    const defaultUrls = {
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages',
      deepseek: 'https://api.deepseek.com/v1/chat/completions'
    };
    return defaultUrls[providerName as keyof typeof defaultUrls] || '';
  }

  /**
   * 获取指定提供商的适配器
   */
  private async getAdapter(providerName?: string): Promise<BaseAdapter> {
    const config = await this.configManager.getConfig();
    const provider = providerName || config.default_provider;
    const now = Date.now();

    // 检查缓存和过期
    const cached = this.adapters.get(provider);
    if (cached && (now - cached.lastUsed) < this.CACHE_TTL) {
      cached.lastUsed = now;
      return cached.adapter;
    }

    // 创建新的适配器
    const providerConfig = config.providers[provider as keyof typeof config.providers];
    if (!providerConfig) {
      throw new Error(`未知的API提供商: ${provider}`);
    }

    // 使用工厂模式创建适配器
    const adapter = this.createAdapter(provider, providerConfig);

    // 缓存适配器并记录时间
    this.adapters.set(provider, { adapter, lastUsed: now });
    return adapter;
  }

  /**
   * 将自然语言转换为命令
   */
  async convertToCommand(
    query: string,
    options: {
      provider?: string;
      context?: string;
      shellType?: string;
    } = {}
  ): Promise<APIResponse> {
    const adapter = await this.getAdapter(options.provider);

    try {
      const response = await adapter.convertToCommand(query, options.context);
      return response;
    } catch (error) {
      // 如果是配置错误，尝试提供有用的提示
      if (error instanceof Error && error.message.includes('API Key 未配置')) {
        const config = await this.configManager.getConfig();
        const provider = options.provider || config.default_provider;
        throw new Error(
          `API Key 未配置。请运行以下命令配置：\n` +
          `dd config --show  # 查看当前配置\n` +
          `# 编辑 ~/.ddcli/config.yaml 文件，设置 providers.${provider}.api_key`
        );
      }
      throw error;
    }
  }

  /**
   * 测试指定提供商的连接
   */
  async testConnection(providerName?: string): Promise<boolean> {
    try {
      const adapter = await this.getAdapter(providerName);
      // 使用一个简单的查询测试连接
      await adapter.convertToCommand('echo hello');
      return true;
    } catch (error) {
      console.error(`连接测试失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * 获取可用的提供商列表
   */
  async getAvailableProviders(): Promise<string[]> {
    const config = await this.configManager.getConfig();
    return Object.keys(config.providers);
  }

  /**
   * 检查提供商是否已配置
   */
  async isProviderConfigured(providerName: string): Promise<boolean> {
    try {
      const providerConfig = await this.configManager.getProviderConfig(providerName);
      return !!providerConfig.api_key;
    } catch {
      return false;
    }
  }

  /**
   * 清除适配器缓存
   */
  clearCache(): void {
    this.adapters.clear();
  }

  /**
   * 清除过期的适配器缓存
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.adapters.entries()) {
      if (now - cached.lastUsed > this.CACHE_TTL) {
        this.adapters.delete(key);
      }
    }
  }
}