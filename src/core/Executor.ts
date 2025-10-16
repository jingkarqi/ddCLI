import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import { ExecutionResult } from '../types';

const execAsync = promisify(exec);

export interface IExecutor {
  execute(command: string): Promise<ExecutionResult>;
  executeWithStream(command: string, onStdout?: (data: string) => void, onStderr?: (data: string) => void): Promise<ExecutionResult>;
}

export class Executor implements IExecutor {
  private shellType: string;

  constructor(shellType: string = 'auto') {
    this.shellType = shellType === 'auto' ? this.detectShell() : shellType;
  }

  /**
   * 检测当前Shell类型
   */
  private detectShell(): string {
    const platform = os.platform();
    return platform === 'win32' ? 'powershell' : 'bash';
  }

  /**
   * 执行命令
   */
  async execute(command: string): Promise<ExecutionResult> {
    try {
      if (this.shellType === 'powershell') {
        return await this.executePowerShell(command);
      } else {
        return await this.executeUnix(command);
      }
    } catch (error: any) {
      return {
        success: false,
        stdout: '',
        stderr: error.message || String(error),
        exitCode: error.code || 1,
        command
      };
    }
  }

  /**
   * 在PowerShell中执行命令
   */
  private async executePowerShell(command: string): Promise<ExecutionResult> {
    try {
      const { stdout, stderr } = await execAsync(`powershell -Command "${command.replace(/"/g, '""')}"`, {
        timeout: 30000,
        encoding: 'utf8'
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
        command
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || '',
        exitCode: error.code || 1,
        command
      };
    }
  }

  /**
   * 在Unix Shell中执行命令
   */
  private async executeUnix(command: string): Promise<ExecutionResult> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000,
        encoding: 'utf8'
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
        command
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || '',
        exitCode: error.code || 1,
        command
      };
    }
  }

  /**
   * 实时执行命令（流式输出）
   */
  async executeWithStream(
    command: string,
    onStdout?: (data: string) => void,
    onStderr?: (data: string) => void
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';

      let child: any;
      if (this.shellType === 'powershell') {
        child = spawn('powershell', ['-Command', command], {
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } else {
        child = spawn('/bin/sh', ['-c', command], {
          stdio: ['pipe', 'pipe', 'pipe']
        });
      }

      child.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        onStdout?.(text);
      });

      child.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        onStderr?.(text);
      });

      child.on('close', (code: number | null) => {
        resolve({
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0,
          command
        });
      });

      child.on('error', (error: Error) => {
        resolve({
          success: false,
          stdout: '',
          stderr: error.message,
          exitCode: 1,
          command
        });
      });
    });
  }

  /**
   * 获取Shell类型
   */
  getShellType(): string {
    return this.shellType;
  }

  /**
   * 检查命令是否存在
   */
  async commandExists(command: string): Promise<boolean> {
    try {
      if (this.shellType === 'powershell') {
        const { stdout } = await execAsync(`powershell -Command "Get-Command ${command} -ErrorAction SilentlyContinue"`, {
          timeout: 5000
        });
        return stdout.trim().length > 0;
      } else {
        const { stdout } = await execAsync(`which ${command}`, {
          timeout: 5000
        });
        return stdout.trim().length > 0;
      }
    } catch {
      return false;
    }
  }

  /**
   * 获取当前工作目录
   */
  getCurrentDirectory(): string {
    return process.cwd();
  }

  /**
   * 更改工作目录
   */
  async changeDirectory(path: string): Promise<boolean> {
    try {
      process.chdir(path);
      return true;
    } catch {
      return false;
    }
  }
}