import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'yaml';
import { AppConfig } from '../types';
import { DEFAULT_CONFIG } from './defaultConfig';

export class ConfigManager {
  private configDir: string;
  private configFile: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.ddcli');
    this.configFile = path.join(this.configDir, 'config.yaml');
  }

  /**
   * 确保配置目录存在
   */
  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  /**
   * 获取配置文件路径
   */
  public getConfigPath(): string {
    return this.configFile;
  }

  /**
   * 读取配置文件
   */
  public async getConfig(): Promise<AppConfig> {
    try {
      if (fs.existsSync(this.configFile)) {
        const configContent = fs.readFileSync(this.configFile, 'utf8');
        const config = yaml.parse(configContent) as AppConfig;

        // 合并默认配置，确保所有必需字段都存在
        return {
          ...DEFAULT_CONFIG,
          ...config,
          providers: {
            ...DEFAULT_CONFIG.providers,
            ...(config.providers || {})
          }
        };
      }
    } catch (error) {
      console.warn('读取配置文件失败，使用默认配置:', error);
    }

    // 如果配置文件不存在或读取失败，返回默认配置
    return DEFAULT_CONFIG;
  }

  /**
   * 写入配置文件
   */
  public async saveConfig(config: Partial<AppConfig>): Promise<void> {
    try {
      this.ensureConfigDir();

      const currentConfig = await this.getConfig();
      const updatedConfig = {
        ...currentConfig,
        ...config,
        providers: {
          ...currentConfig.providers,
          ...(config.providers || {})
        }
      };

      const yamlContent = yaml.stringify(updatedConfig, {
        indent: 2,
        lineWidth: 120
      });

      fs.writeFileSync(this.configFile, yamlContent, 'utf8');
    } catch (error) {
      throw new Error(`保存配置文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 重置配置为默认值
   */
  public async resetConfig(): Promise<void> {
    try {
      this.ensureConfigDir();
      const yamlContent = yaml.stringify(DEFAULT_CONFIG, {
        indent: 2,
        lineWidth: 120
      });
      fs.writeFileSync(this.configFile, yamlContent, 'utf8');
    } catch (error) {
      throw new Error(`重置配置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 检查配置是否存在
   */
  public configExists(): boolean {
    return fs.existsSync(this.configFile);
  }

  /**
   * 获取指定提供商的配置
   */
  public async getProviderConfig(providerName?: string): Promise<AppConfig['providers'][keyof AppConfig['providers']]> {
    const config = await this.getConfig();
    const provider = providerName || config.default_provider;
    return config.providers[provider as keyof AppConfig['providers']];
  }

  /**
   * 更新指定提供商的配置
   */
  public async updateProviderConfig(
    providerName: keyof AppConfig['providers'],
    providerConfig: Partial<AppConfig['providers'][keyof AppConfig['providers']]>
  ): Promise<void> {
    const config = await this.getConfig();
    await this.saveConfig({
      providers: {
        ...config.providers,
        [providerName]: {
          ...config.providers[providerName],
          ...providerConfig
        }
      }
    });
  }

  /**
   * 设置默认提供商
   */
  public async setDefaultProvider(providerName: keyof AppConfig['providers']): Promise<void> {
    await this.saveConfig({ default_provider: providerName });
  }

  /**
   * 设置自动执行模式
   */
  public async setAutoExecute(autoExecute: boolean): Promise<void> {
    await this.saveConfig({ auto_execute: autoExecute });
  }

  /**
   * 设置Shell类型
   */
  public async setShell(shell: AppConfig['shell']): Promise<void> {
    await this.saveConfig({ shell });
  }
}