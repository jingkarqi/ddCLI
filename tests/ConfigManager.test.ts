import { ConfigManager } from '../src/config/ConfigManager';
import { DEFAULT_CONFIG } from '../src/config/defaultConfig';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'yaml';

// Mock fs and os modules
jest.mock('fs');
jest.mock('os');
jest.mock('yaml', () => ({
  parse: jest.fn(),
  stringify: jest.fn()
}));

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedOs = os as jest.Mocked<typeof os>;
const mockedYaml = yaml as jest.Mocked<typeof yaml>;

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockConfigDir: string;
  let mockConfigFile: string;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock paths
    mockConfigDir = path.join('/mock/home', '.ddcli');
    mockConfigFile = path.join(mockConfigDir, 'config.yaml');

    mockedOs.homedir.mockReturnValue('/mock/home');
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.mkdirSync.mockImplementation();
    mockedFs.writeFileSync.mockImplementation();
    mockedFs.readFileSync.mockImplementation();

    configManager = new ConfigManager();
  });

  describe('constructor', () => {
    it('should initialize with correct paths', () => {
      expect(configManager.getConfigPath()).toBe(mockConfigFile);
    });
  });

  describe('getConfig', () => {
    it('should return default config when no config file exists', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const config = await configManager.getConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should load and merge config from file', async () => {
      const mockConfig = {
        default_provider: 'anthropic',
        auto_execute: true,
        providers: {
          anthropic: {
            model: 'claude-3-5-sonnet-20241022',
            api_key: 'test-key',
            timeout: 15
          }
        }
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('yaml-content');
      mockedYaml.parse.mockReturnValue(mockConfig);

      const config = await configManager.getConfig();

      expect(config.default_provider).toBe('anthropic');
      expect(config.auto_execute).toBe(true);
      expect(config.providers.anthropic.model).toBe('claude-3-5-sonnet-20241022');
      expect(config.providers.anthropic.api_key).toBe('test-key');
      expect(config.providers.anthropic.timeout).toBe(15);
    });

    it('should return default config on file read error', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const config = await configManager.getConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('saveConfig', () => {
    it('should create config directory and save config', async () => {
      const newConfig = {
        default_provider: 'deepseek' as const,
        auto_execute: true
      };

      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockImplementation();
      mockedFs.writeFileSync.mockImplementation();

      await configManager.saveConfig(newConfig);

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, { recursive: true });
      expect(mockedFs.writeFileSync).toHaveBeenCalled();
    });

    it('should throw error on save failure', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockImplementation();
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      await expect(configManager.saveConfig({ auto_execute: true })).rejects.toThrow('保存配置文件失败');
    });
  });

  describe('configExists', () => {
    it('should return true when config exists', () => {
      mockedFs.existsSync.mockReturnValue(true);
      expect(configManager.configExists()).toBe(true);
    });

    it('should return false when config does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);
      expect(configManager.configExists()).toBe(false);
    });
  });

  describe('getProviderConfig', () => {
    it('should return default provider config when no provider specified', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const config = await configManager.getProviderConfig();

      expect(config).toEqual(DEFAULT_CONFIG.providers.openai);
    });

    it('should return specified provider config', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const config = await configManager.getProviderConfig('anthropic');

      expect(config).toEqual(DEFAULT_CONFIG.providers.anthropic);
    });
  });

  describe('resetConfig', () => {
    it('should reset config to default values', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockImplementation();
      mockedFs.writeFileSync.mockImplementation();

      await configManager.resetConfig();

      expect(mockedFs.writeFileSync).toHaveBeenCalled();
    });
  });
});