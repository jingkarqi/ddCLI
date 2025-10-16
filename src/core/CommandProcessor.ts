import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../config/ConfigManager';
import { APIRouter } from '../api/APIRouter';
import { SecurityChecker } from './SecurityChecker';
import { Executor } from './Executor';
import { ShellDetector } from '../utils/shell';
import { Interactive } from '../ui/Interactive';
import { Formatter } from '../ui/Formatter';
import { ProcessOptions, CommandResponse } from '../types';

export class CommandProcessor {
  private configManager: ConfigManager;
  private apiRouter: APIRouter;
  private executor: Executor;
  private interactive: Interactive;
  private formatter: Formatter;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.apiRouter = new APIRouter(configManager);
    this.executor = new Executor();
    this.interactive = new Interactive();
    this.formatter = new Formatter();
  }

  /**
   * 处理自然语言命令
   */
  async process(query: string, options: ProcessOptions = {}): Promise<void> {
    try {
      if (options.debug) {
        console.log(chalk.gray('处理查询:'), query);
      }

      // 显示处理中状态
      const spinner = ora('正在转换命令...').start();

      try {
        // 检测Shell类型
        const shellInfo = await ShellDetector.getShellInfo();
        const shellType = await this.getShellType(shellInfo.shell);

        // 调用API转换命令
        const apiOptions: { provider?: string; context?: string; shellType?: string } = {};
        if (options.provider) {
          apiOptions.provider = options.provider;
        }
        apiOptions.context = await this.buildContext(shellInfo);
        apiOptions.shellType = shellType;

        const response = await this.apiRouter.convertToCommand(query, apiOptions);

        spinner.stop();

        if (options.debug) {
          console.log(chalk.gray('API响应:'), response);
        }

        // 安全检查
        const securityResult = SecurityChecker.checkCommandByShell(response.command, shellType);

        if (options.debug) {
          console.log(chalk.gray('安全检查:'), securityResult);
        }

        // 处理被阻止的命令
        if (securityResult.riskLevel === 'blocked') {
          this.formatter.displayError('命令被安全检查阻止:', securityResult.warning || '');
          return;
        }

        // 显示命令和解释
        const commandResponse: CommandResponse = {
          ...response,
          safe: securityResult.safe
        };
        this.displayCommand(commandResponse, securityResult, shellType);

        // 确认执行
        const shouldExecute = await this.confirmExecution(
          commandResponse,
          securityResult,
          options.autoExecute
        );

        if (!shouldExecute) {
          this.formatter.displayInfo('命令已取消执行');
          return;
        }

        // 执行命令
        await this.executeCommand(response.command, options.debug);

      } catch (error) {
        spinner.stop();
        throw error;
      }

    } catch (error) {
      this.formatter.displayError('处理失败:', error instanceof Error ? error.message : String(error));
      if (options.debug) {
        console.error(error);
      }
    }
  }

  /**
   * 获取Shell类型
   */
  private async getShellType(detectedShell: string): Promise<string> {
    const config = await this.configManager.getConfig();
    if (config.shell === 'auto') {
      return detectedShell;
    }
    return config.shell;
  }

  /**
   * 构建上下文信息
   */
  private async buildContext(shellInfo: any): Promise<string> {
    const contextParts: string[] = [];

    // 添加当前目录信息
    const currentDir = this.executor.getCurrentDirectory();
    contextParts.push(`当前工作目录: ${currentDir}`);

    // 添加Shell信息
    contextParts.push(`Shell类型: ${shellInfo.shell}`);
    if (shellInfo.powerShellVersion) {
      contextParts.push(`PowerShell版本: ${shellInfo.powerShellVersion}`);
    }

    // 添加平台信息
    contextParts.push(`操作系统: ${shellInfo.platform} (${shellInfo.arch})`);

    return contextParts.join('\n');
  }

  /**
   * 显示命令信息
   */
  private displayCommand(response: CommandResponse, securityResult: any, shellType: string): void {
    this.formatter.displayHeader('命令生成完成');

    // 显示命令
    console.log(chalk.blue('将执行命令:'));
    console.log(chalk.yellow(response.command));
    console.log();

    // 显示解释
    if (response.explanation) {
      console.log(chalk.green('说明:'));
      console.log(response.explanation);
      console.log();
    }

    // 显示安全信息
    if (securityResult.warning) {
      console.log(chalk.yellow('⚠️  安全警告:'));
      console.log(securityResult.warning);
      console.log();
    }

    // 显示Shell信息
    console.log(chalk.gray(`Shell类型: ${shellType}`));
    console.log();
  }

  /**
   * 确认执行
   */
  private async confirmExecution(
    response: CommandResponse,
    securityResult: any,
    autoExecute?: boolean
  ): Promise<boolean> {
    // 获取配置
    const config = await this.configManager.getConfig();

    // 自动执行模式
    if (autoExecute || config.auto_execute) {
      // 如果是高危命令，仍然需要确认
      if (securityResult.requiresConfirmation) {
        return await this.interactive.confirmDangerousCommand(
          response.command,
          securityResult.warning
        );
      }
      return true;
    }

    // 交互模式
    if (securityResult.requiresConfirmation) {
      return await this.interactive.confirmDangerousCommand(
        response.command,
        securityResult.warning
      );
    } else {
      return await this.interactive.confirmExecution(response.command);
    }
  }

  /**
   * 执行命令
   */
  private async executeCommand(command: string, debug: boolean = false): Promise<void> {
    const spinner = ora('正在执行命令...').start();

    try {
      const result = await this.executor.executeWithStream(
        command,
        (data: string) => {
          spinner.stop();
          process.stdout.write(data);
        },
        (data: string) => {
          spinner.stop();
          process.stderr.write(data);
        }
      );

      spinner.stop();

      if (debug) {
        console.log(chalk.gray('\n执行结果:'), result);
      }

      // 显示执行结果摘要
      if (result.success) {
        console.log(chalk.green('\n✅ 命令执行成功'));
      } else {
        console.log(chalk.red('\n❌ 命令执行失败'));
        if (result.stderr) {
          console.log(chalk.red('错误信息:'), result.stderr);
        }
      }

    } catch (error) {
      spinner.stop();
      this.formatter.displayError('命令执行失败:', error instanceof Error ? error.message : String(error));
    }
  }
}