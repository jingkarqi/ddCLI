import { createWriteStream, existsSync, mkdirSync, WriteStream } from 'fs';
import { join } from 'path';
import * as os from 'os';
import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static instance: Logger;
  private logFile: string;
  private logLevel: LogLevel;
  private logDir: string;
  private logStream: WriteStream;

  private constructor() {
    this.logDir = join(os.homedir(), '.ddcli', 'logs');
    this.logFile = join(this.logDir, `ddcli-${this.getDateString()}.log`);
    this.logLevel = LogLevel.INFO;

    // 确保日志目录存在
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }

    // 创建持久化的日志流
    this.logStream = createWriteStream(this.logFile, { flags: 'a' });
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 获取日期字符串
   */
  private getDateString(): string {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    return dateString || ''; // YYYY-MM-DD
  }

  /**
   * 获取时间戳字符串
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString(); // ISO 8601
  }

  /**
   * 设置日志级别
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * 写入日志
   */
  private writeLog(level: LogLevel, message: string, error?: Error): void {
    if (level < this.logLevel) {
      return;
    }

    const timestamp = this.getTimestamp();
    const levelStr = LogLevel[level];
    const logMessage = `[${timestamp}] [${levelStr}] ${message}`;

    // 控制台输出
    let consoleMessage: string;
    switch (level) {
      case LogLevel.DEBUG:
        consoleMessage = chalk.gray(logMessage);
        break;
      case LogLevel.INFO:
        consoleMessage = chalk.blue(logMessage);
        break;
      case LogLevel.WARN:
        consoleMessage = chalk.yellow(logMessage);
        break;
      case LogLevel.ERROR:
        consoleMessage = chalk.red(logMessage);
        break;
      default:
        consoleMessage = logMessage;
    }

    if (level >= LogLevel.WARN) {
      console.error(consoleMessage);
    } else {
      console.log(consoleMessage);
    }

    // 文件输出 - 复用流
    try {
      this.logStream.write(logMessage + '\n');
      if (error) {
        this.logStream.write(`  Error: ${error.message}\n`);
        this.logStream.write(`  Stack: ${error.stack}\n`);
      }
    } catch (fileError) {
      console.error('写入日志文件失败:', fileError);
    }
  }

  /**
   * 调试日志
   */
  public debug(message: string): void {
    this.writeLog(LogLevel.DEBUG, message);
  }

  /**
   * 信息日志
   */
  public info(message: string): void {
    this.writeLog(LogLevel.INFO, message);
  }

  /**
   * 警告日志
   */
  public warn(message: string): void {
    this.writeLog(LogLevel.WARN, message);
  }

  /**
   * 错误日志
   */
  public error(message: string, error?: Error): void {
    this.writeLog(LogLevel.ERROR, message, error);
  }

  /**
   * 记录命令执行
   */
  public logCommand(command: string, success: boolean, output?: string, error?: string): void {
    const status = success ? 'SUCCESS' : 'FAILED';
    let message = `Command [${status}]: ${command}`;

    if (output) {
      message += `\nOutput: ${output}`;
    }

    if (error) {
      message += `\nError: ${error}`;
    }

    if (success) {
      this.info(message);
    } else {
      this.error(message);
    }
  }

  /**
   * 记录API调用
   */
  public logApiCall(provider: string, query: string, success: boolean, response?: string, error?: string): void {
    const status = success ? 'SUCCESS' : 'FAILED';
    const message = `API [${status}] Provider: ${provider}, Query: "${query}"`;

    if (response) {
      // 只记录响应的摘要，避免记录敏感内容
      const responseSummary = response.length > 100 ?
        `${response.substring(0, 100)}...` : response;
      this.debug(`API Response: ${responseSummary}`);
    }

    if (error) {
      this.error(`${message}, Error: ${error}`);
    } else {
      this.info(message);
    }
  }

  /**
   * 记录配置变更
   */
  public logConfigChange(action: string, details: string): void {
    this.info(`Config [${action}]: ${details}`);
  }

  /**
   * 记录安全事件
   */
  public logSecurityEvent(event: string, command: string, details?: string): void {
    const message = `Security [${event}]: ${command}`;
    if (details) {
      this.warn(`${message}, Details: ${details}`);
    } else {
      this.warn(message);
    }
  }

  /**
   * 获取日志文件路径
   */
  public getLogFile(): string {
    return this.logFile;
  }

  /**
   * 获取日志目录
   */
  public getLogDir(): string {
    return this.logDir;
  }

  /**
   * 清理旧日志文件（保留最近7天）
   */
  public cleanOldLogs(): void {
    // 这里可以实现日志清理逻辑
    // 由于需要文件系统操作，这里简化处理
    this.info('Log cleanup requested (not implemented yet)');
  }
}

// 导出单例实例
export const logger = Logger.getInstance();