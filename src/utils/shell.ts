import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

export class ShellDetector {
  /**
   * 检测当前Shell类型
   */
  static detectShell(): string {
    const platform = os.platform();

    if (platform === 'win32') {
      // Windows环境检测PowerShell版本
      try {
        const psVersion = process.env.PSVersionTable;
        if (psVersion) {
          // 在PowerShell环境中运行
          return 'powershell';
        }

        // 检查是否可以通过命令行检测PowerShell
        const shell = process.env.SHELL || process.env.COMSPEC;
        if (shell && shell.toLowerCase().includes('powershell')) {
          return 'powershell';
        }

        // 默认Windows环境使用PowerShell
        return 'powershell';
      } catch {
        return 'powershell';
      }
    } else {
      // Unix-like系统检测Shell
      const shell = process.env.SHELL || '';
      if (shell.includes('bash')) {
        return 'bash';
      } else if (shell.includes('zsh')) {
        return 'zsh';
      } else if (shell.includes('fish')) {
        return 'fish';
      }
      return 'bash'; // 默认
    }
  }

  /**
   * 检测PowerShell版本
   */
  static async detectPowerShellVersion(): Promise<string | null> {
    if (os.platform() !== 'win32') {
      return null;
    }

    try {
      const { stdout } = await execAsync('powershell -Command "$PSVersionTable.PSVersion.Major"', {
        timeout: 5000
      });
      return stdout.trim();
    } catch {
      try {
        const { stdout } = await execAsync('pwsh -Command "$PSVersionTable.PSVersion.Major"', {
          timeout: 5000
        });
        return stdout.trim();
      } catch {
        return null;
      }
    }
  }

  /**
   * 检测PowerShell是否可用
   */
  static async isPowerShellAvailable(): Promise<boolean> {
    if (os.platform() !== 'win32') {
      return false;
    }

    try {
      await execAsync('powershell -Command "Write-Host test"', { timeout: 3000 });
      return true;
    } catch {
      try {
        await execAsync('pwsh -Command "Write-Host test"', { timeout: 3000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * 检测PowerShell执行策略
   */
  static async getPowerShellExecutionPolicy(): Promise<string | null> {
    if (os.platform() !== 'win32') {
      return null;
    }

    try {
      const { stdout } = await execAsync('powershell -Command "Get-ExecutionPolicy"', {
        timeout: 5000
      });
      return stdout.trim();
    } catch {
      try {
        const { stdout } = await execAsync('pwsh -Command "Get-ExecutionPolicy"', {
          timeout: 5000
        });
        return stdout.trim();
      } catch {
        return null;
      }
    }
  }

  /**
   * 检测Shell环境信息
   */
  static async getShellInfo(): Promise<{
    shell: string;
    platform: string;
    arch: string;
    powerShellVersion?: string;
    executionPolicy?: string;
  }> {
    const shell = this.detectShell();
    const platform = os.platform();
    const arch = os.arch();

    const info: {
      shell: string;
      platform: string;
      arch: string;
      powerShellVersion?: string;
      executionPolicy?: string;
    } = {
      shell,
      platform,
      arch
    };

    if (shell === 'powershell') {
      const psVersion = await this.detectPowerShellVersion();
      const execPolicy = await this.getPowerShellExecutionPolicy();
      if (psVersion) info.powerShellVersion = psVersion;
      if (execPolicy) info.executionPolicy = execPolicy;
    }

    return info;
  }
}