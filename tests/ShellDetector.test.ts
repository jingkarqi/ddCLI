import { ShellDetector } from '../src/utils/shell';
import * as os from 'os';

// Mock os module
jest.mock('os');
const mockedOs = os as jest.Mocked<typeof os>;

describe('ShellDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset process.env
    delete process.env.SHELL;
    delete process.env.COMSPEC;
    delete process.env.PSVersionTable;
  });

  describe('detectShell', () => {
    it('should detect PowerShell on Windows', () => {
      mockedOs.platform.mockReturnValue('win32');

      const shell = ShellDetector.detectShell();
      expect(shell).toBe('powershell');
    });

    it('should detect bash on Unix systems', () => {
      mockedOs.platform.mockReturnValue('linux');
      process.env.SHELL = '/bin/bash';

      const shell = ShellDetector.detectShell();
      expect(shell).toBe('bash');
    });

    it('should detect zsh on Unix systems', () => {
      mockedOs.platform.mockReturnValue('darwin');
      process.env.SHELL = '/bin/zsh';

      const shell = ShellDetector.detectShell();
      expect(shell).toBe('zsh');
    });

    it('should detect fish on Unix systems', () => {
      mockedOs.platform.mockReturnValue('linux');
      process.env.SHELL = '/usr/bin/fish';

      const shell = ShellDetector.detectShell();
      expect(shell).toBe('fish');
    });

    it('should default to bash on Unix systems when SHELL is not set', () => {
      mockedOs.platform.mockReturnValue('linux');

      const shell = ShellDetector.detectShell();
      expect(shell).toBe('bash');
    });

    it('should detect PowerShell when in PowerShell environment', () => {
      mockedOs.platform.mockReturnValue('win32');
      process.env.PSVersionTable = '{}';

      const shell = ShellDetector.detectShell();
      expect(shell).toBe('powershell');
    });

    it('should detect PowerShell from COMSPEC', () => {
      mockedOs.platform.mockReturnValue('win32');
      process.env.COMSPEC = 'C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';

      const shell = ShellDetector.detectShell();
      expect(shell).toBe('powershell');
    });
  });

  describe('getShellInfo', () => {
    beforeEach(() => {
      // Mock execAsync for these tests
      jest.mock('child_process', () => ({
        exec: jest.fn(),
        spawn: jest.fn()
      }));
    });

    it('should return basic shell info for Unix', async () => {
      mockedOs.platform.mockReturnValue('linux');
      mockedOs.arch.mockReturnValue('x64');
      process.env.SHELL = '/bin/bash';

      const info = await ShellDetector.getShellInfo();

      expect(info.shell).toBe('bash');
      expect(info.platform).toBe('linux');
      expect(info.arch).toBe('x64');
      expect(info.powerShellVersion).toBeUndefined();
      expect(info.executionPolicy).toBeUndefined();
    });

    it('should include PowerShell info on Windows', async () => {
      mockedOs.platform.mockReturnValue('win32');
      mockedOs.arch.mockReturnValue('x64');

      // Mock the async methods for this test
      const originalDetectPowerShellVersion = ShellDetector.detectPowerShellVersion;
      const originalGetPowerShellExecutionPolicy = ShellDetector.getPowerShellExecutionPolicy;

      ShellDetector.detectPowerShellVersion = jest.fn().mockResolvedValue('5');
      ShellDetector.getPowerShellExecutionPolicy = jest.fn().mockResolvedValue('RemoteSigned');

      const info = await ShellDetector.getShellInfo();

      expect(info.shell).toBe('powershell');
      expect(info.platform).toBe('win32');
      expect(info.arch).toBe('x64');
      expect(info.powerShellVersion).toBe('5');
      expect(info.executionPolicy).toBe('RemoteSigned');

      // Restore original methods
      ShellDetector.detectPowerShellVersion = originalDetectPowerShellVersion;
      ShellDetector.getPowerShellExecutionPolicy = originalGetPowerShellExecutionPolicy;
    });
  });
});