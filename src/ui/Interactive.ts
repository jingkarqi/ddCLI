import inquirer from 'inquirer';
import chalk from 'chalk';

export class Interactive {
  /**
   * 确认执行普通命令
   */
  async confirmExecution(command: string): Promise<boolean> {
    console.log(chalk.blue('将执行命令:'));
    console.log(chalk.yellow(command));
    console.log();

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: '确认执行此命令吗？',
        default: false
      }
    ]);

    return confirmed;
  }

  /**
   * 确认执行危险命令
   */
  async confirmDangerousCommand(command: string, warning: string): Promise<boolean> {
    console.log(chalk.red('⚠️  危险命令警告:'));
    console.log(chalk.red(warning));
    console.log();
    console.log(chalk.red('将执行命令:'));
    console.log(chalk.yellow(command));
    console.log();

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: chalk.red('这是一个危险命令，您确定要执行吗？请输入 "yes" 确认:'),
        default: false,
        validate: (input: boolean) => {
          if (!input) {
            return true;
          }
          // 对于危险命令，要求用户明确输入 "yes"
          return false; // 这里简化处理，实际可以实现更复杂的验证
        }
      }
    ]);

    return confirmed;
  }

  /**
   * 选择API提供商
   */
  async selectProvider(providers: string[], currentProvider?: string): Promise<string> {
    const { provider } = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: '选择API提供商:',
        choices: providers,
        default: currentProvider || providers[0]
      }
    ]);

    return provider;
  }

  /**
   * 输入API密钥
   */
  async inputApiKey(provider: string): Promise<string> {
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: `请输入 ${provider} API Key:`,
        mask: '*',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'API Key 不能为空';
          }
          return true;
        }
      }
    ]);

    return apiKey.trim();
  }

  /**
   * 输入自定义基础URL
   */
  async inputBaseUrl(provider: string, defaultUrl?: string): Promise<string> {
    const { baseUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'baseUrl',
        message: `请输入 ${provider} API Base URL (可选):`,
        default: defaultUrl,
        validate: (input: string) => {
          if (!input) {
            return true; // 可选字段
          }
          try {
            new URL(input);
            return true;
          } catch {
            return '请输入有效的URL';
          }
        }
      }
    ]);

    return baseUrl.trim();
  }

  /**
   * 选择模型
   */
  async selectModel(provider: string, availableModels: string[], currentModel?: string): Promise<string> {
    const { model } = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: `选择 ${provider} 模型:`,
        choices: availableModels,
        default: currentModel || availableModels[0]
      }
    ]);

    return model;
  }

  /**
   * 设置超时时间
   */
  async setTimeout(defaultTimeout: number): Promise<number> {
    const { timeout } = await inquirer.prompt([
      {
        type: 'number',
        name: 'timeout',
        message: '设置API请求超时时间（秒）:',
        default: defaultTimeout,
        validate: (input: number) => {
          if (input <= 0) {
            return '超时时间必须大于0';
          }
          if (input > 300) {
            return '超时时间不能超过300秒';
          }
          return true;
        }
      }
    ]);

    return timeout;
  }

  /**
   * 设置自动执行模式
   */
  async setAutoExecute(currentValue: boolean): Promise<boolean> {
    const { autoExecute } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'autoExecute',
        message: '是否启用自动执行模式（跳过确认直接执行命令）？',
        default: currentValue
      }
    ]);

    return autoExecute;
  }

  /**
   * 选择Shell类型
   */
  async selectShell(currentShell: string): Promise<string> {
    const { shell } = await inquirer.prompt([
      {
        type: 'list',
        name: 'shell',
        message: '选择Shell类型:',
        choices: [
          { name: '自动检测', value: 'auto' },
          { name: 'PowerShell', value: 'powershell' },
          { name: 'Bash', value: 'bash' }
        ],
        default: currentShell
      }
    ]);

    return shell;
  }

  /**
   * 确认重置配置
   */
  async confirmResetConfig(): Promise<boolean> {
    console.log(chalk.red('⚠️  重置配置将清除所有自定义设置'));
    console.log(chalk.red('包括API密钥、模型配置等'));
    console.log();

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: chalk.red('您确定要重置配置吗？此操作不可撤销！'),
        default: false
      }
    ]);

    return confirmed;
  }

  /**
   * 多选配置项
   */
  async selectConfigItems(items: Array<{ name: string; value: string; checked?: boolean }>): Promise<string[]> {
    const { selectedItems } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedItems',
        message: '选择要配置的项目:',
        choices: items
      }
    ]);

    return selectedItems;
  }

  /**
   * 输入文本
   */
  async inputText(message: string, defaultValue?: string, required: boolean = false): Promise<string> {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message,
        default: defaultValue,
        validate: required ? (value: string) => {
          if (!value || value.trim().length === 0) {
            return '此字段为必填项';
          }
          return true;
        } : undefined
      }
    ]);

    return input.trim();
  }
}