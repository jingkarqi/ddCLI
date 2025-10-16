import chalk from 'chalk';
import ora from 'ora';
import { ExecutionResult, SecurityResult } from '../types';

export class Formatter {
  /**
   * 显示标题
   */
  displayHeader(title: string): void {
    console.log();
    console.log(chalk.blue.bold(`=== ${title} ===`));
    console.log();
  }

  /**
   * 显示成功信息
   */
  displaySuccess(message: string, details?: string): void {
    console.log(chalk.green('✅'), message);
    if (details) {
      console.log(chalk.green('   '), details);
    }
  }

  /**
   * 显示错误信息
   */
  displayError(message: string, details?: string): void {
    console.log(chalk.red('❌'), message);
    if (details) {
      console.log(chalk.red('   '), details);
    }
  }

  /**
   * 显示警告信息
   */
  displayWarning(message: string, details?: string): void {
    console.log(chalk.yellow('⚠️ '), message);
    if (details) {
      console.log(chalk.yellow('   '), details);
    }
  }

  /**
   * 显示信息
   */
  displayInfo(message: string, details?: string): void {
    console.log(chalk.blue('ℹ️ '), message);
    if (details) {
      console.log(chalk.blue('   '), details);
    }
  }

  /**
   * 显示配置信息
   */
  displayConfig<T extends Record<string, unknown>>(config: T, title: string = '配置信息'): void {
    this.displayHeader(title);
    console.log(JSON.stringify(config, null, 2));
    console.log();
  }

  /**
   * 显示命令结果
   */
  displayCommandResult(command: string, result: ExecutionResult): void {
    console.log(chalk.blue('执行的命令:'));
    console.log(chalk.yellow(command));
    console.log();

    if (result.success) {
      this.displaySuccess('命令执行成功');
      if (result.stdout) {
        console.log(chalk.gray('输出:'));
        console.log(result.stdout);
      }
    } else {
      this.displayError('命令执行失败');
      if (result.stderr) {
        console.log(chalk.red('错误:'));
        console.log(result.stderr);
      }
      if (result.exitCode !== undefined) {
        console.log(chalk.red('退出码:'), result.exitCode);
      }
    }
    console.log();
  }

  /**
   * 显示安全检查结果
   */
  displaySecurityResult(securityResult: SecurityResult): void {
    const riskLevelColors: Record<string, (text: string) => string> = {
      low: chalk.green,
      medium: chalk.yellow,
      high: chalk.red,
      blocked: chalk.red.bold
    };

    const color = riskLevelColors[securityResult.riskLevel] || chalk.gray;
    const riskText = `安全等级: ${this.getRiskLevelText(securityResult.riskLevel)}`;

    console.log(color(riskText));

    if (securityResult.warning) {
      console.log(chalk.yellow('警告:'), securityResult.warning);
    }

    console.log(chalk.gray(`需要确认: ${securityResult.requiresConfirmation ? '是' : '否'}`));
    console.log();
  }

  /**
   * 获取风险等级文本
   */
  private getRiskLevelText(riskLevel: string): string {
    const texts = {
      low: '低风险',
      medium: '中等风险',
      high: '高风险',
      blocked: '已阻止'
    };
    return texts[riskLevel as keyof typeof texts] || '未知';
  }

  /**
   * 显示API测试结果
   */
  displayApiTestResult(provider: string, success: boolean, error?: string): void {
    if (success) {
      this.displaySuccess(`${provider} API 连接测试成功`);
    } else {
      this.displayError(`${provider} API 连接测试失败`, error);
    }
  }

  /**
   * 显示提供商列表
   */
  displayProviders(providers: Array<{ name: string; configured: boolean; model?: string }>): void {
    this.displayHeader('API 提供商');

    providers.forEach(provider => {
      const status = provider.configured ?
        chalk.green('✅ 已配置') :
        chalk.red('❌ 未配置');

      console.log(`${provider.name}: ${status}`);
      if (provider.model) {
        console.log(chalk.gray(`  模型: ${provider.model}`));
      }
    });
    console.log();
  }

  /**
   * 显示帮助信息
   */
  displayHelp(): void {
    this.displayHeader('ddCLI 帮助信息');

    console.log(chalk.yellow('基本用法:'));
    console.log('  dd "自然语言描述"                    # 转换并执行命令');
    console.log('  dd "列出当前目录所有文件"              # 示例');
    console.log();

    console.log(chalk.yellow('选项:'));
    console.log('  -p, --provider <provider>           # 指定API提供商');
    console.log('  -y, --yes                          # 跳过确认直接执行');
    console.log('  -d, --debug                        # 启用调试模式');
    console.log();

    console.log(chalk.yellow('配置命令:'));
    console.log('  dd config --show                    # 显示当前配置');
    console.log('  dd config --reset                   # 重置配置');
    console.log();

    console.log(chalk.yellow('支持的提供商:'));
    console.log('  openai, anthropic, deepseek');
    console.log();

    console.log(chalk.yellow('示例:'));
    console.log('  dd "创建一个名为 logs 的目录"');
    console.log('  dd --provider anthropic "查找所有 .py 文件"');
    console.log('  dd --yes "显示当前日期和时间"');
    console.log();
  }

  /**
   * 显示进度
   */
  createSpinner(text: string) {
    return ora(text).start();
  }

  /**
   * 显示表格数据
   */
  displayTable(data: Array<Record<string, unknown>>, headers: string[]): void {
    if (data.length === 0) {
      console.log(chalk.gray('没有数据'));
      return;
    }

    // 计算列宽
    const colWidths = headers.map((header, index) => {
      const maxDataWidth = Math.max(...data.map(row => {
        const rowKey = Object.keys(row)[index];
        if (rowKey === undefined) return 0;
        return String(row[rowKey] || '').length;
      }));
      return Math.max(header.length, maxDataWidth);
    });

    // 显示表头
    const headerRow = headers.map((header, index) => {
      const width = colWidths[index];
      return header.padEnd(width || 0);
    }).join(' | ');
    console.log(chalk.bold(headerRow));
    console.log(colWidths.map(width => '-'.repeat(width || 0)).join('-|-'));

    // 显示数据行
    data.forEach(row => {
      const dataRow = Object.keys(row).map((key, index) => {
        const colWidth = colWidths[index];
        if (colWidth === undefined) return '';
        return String(row[key] || '').padEnd(colWidth);
      }).join(' | ');
      console.log(dataRow);
    });
    console.log();
  }

  /**
   * 显示分隔线
   */
  displaySeparator(char: string = '-', length: number = 50): void {
    console.log(char.repeat(length));
  }

  /**
   * 显示版本信息
   */
  displayVersion(version: string): void {
    console.log(chalk.blue(`ddCLI 版本: ${version}`));
  }
}