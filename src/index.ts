#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { CommandProcessor } from './core/CommandProcessor';
import { ConfigManager } from './config/ConfigManager';
import { ProcessOptions } from './types';

const program = new Command();

program
  .name('dd')
  .description('自然语言命令行工具 - 通过AI将自然语言转换为终端命令')
  .version('1.0.0');

program
  .argument('<query>', '自然语言描述的命令意图')
  .option('-p, --provider <provider>', '指定API提供商 (openai|anthropic|deepseek)')
  .option('-y, --yes', '跳过确认直接执行命令')
  .option('-d, --debug', '启用调试模式')
  .action(async (query: string, options: { provider?: string; yes?: boolean; debug?: boolean }) => {
    try {
      if (options.debug) {
        console.log(chalk.gray('调试模式已启用'));
      }

      const configManager = new ConfigManager();
      const commandProcessor = new CommandProcessor(configManager);

      const processOptions: ProcessOptions = {};
      if (options.provider) processOptions.provider = options.provider;
      if (options.yes) processOptions.autoExecute = true;
      if (options.debug) processOptions.debug = true;

      await commandProcessor.process(query, processOptions);
    } catch (error) {
      console.error(chalk.red('错误:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('config')
  .description('配置管理')
  .option('-s, --show', '显示当前配置')
  .option('-r, --reset', '重置配置')
  .action(async (options: { show?: boolean; reset?: boolean }) => {
    const configManager = new ConfigManager();

    if (options.show) {
      const config = await configManager.getConfig();
      console.log(chalk.blue('当前配置:'));
      console.log(JSON.stringify(config, null, 2));
    } else if (options.reset) {
      await configManager.resetConfig();
      console.log(chalk.green('配置已重置'));
    } else {
      console.log(chalk.yellow('请使用 --show 查看配置或 --reset 重置配置'));
    }
  });

program.parse();