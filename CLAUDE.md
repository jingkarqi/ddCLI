# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

ddCLI 是一个基于 Node.js + TypeScript 的命令行工具，允许用户通过自然语言描述意图，由远程云端大语言模型（LLM）将其自动转换为准确、安全的终端命令并执行。

## 核心技术栈

- **语言**: TypeScript
- **运行时**: Node.js
- **CLI框架**: Commander.js
- **HTTP客户端**: Axios
- **配置管理**: js-yaml
- **交互界面**: Inquirer.js
- **测试框架**: Jest

## 支持的API提供商

- OpenAI (Chat Completions API)
- Anthropic (Messages API)
- DeepSeek (Reasoning Chat API)

## 项目结构 (基于 IMPLEMENTATION_PLAN.md)

```
ddcli/
├── src/
│   ├── index.ts                 # CLI入口点
│   ├── config/
│   │   ├── ConfigManager.ts     # 配置文件管理
│   │   └── defaultConfig.ts     # 默认配置
│   ├── core/
│   │   ├── CommandProcessor.ts  # 命令处理核心逻辑
│   │   ├── SecurityChecker.ts   # 安全检查器
│   │   └── Executor.ts          # 命令执行器
│   ├── api/
│   │   ├── APIRouter.ts         # API路由器
│   │   ├── BaseAdapter.ts       # 基础适配器接口
│   │   ├── adapters/
│   │   │   ├── OpenAIAdapter.ts # OpenAI适配器
│   │   │   ├── AnthropicAdapter.ts # Anthropic适配器
│   │   │   └── DeepSeekAdapter.ts # DeepSeek适配器
│   │   └── types.ts             # API类型定义
│   ├── ui/
│   │   ├── Interactive.ts       # 交互式确认
│   │   └── Formatter.ts         # 输出格式化
│   └── utils/
│       ├── shell.ts             # Shell检测
│       └── logger.ts            # 日志记录
├── tests/
├── api-doc/                     # API文档
├── package.json
├── tsconfig.json
└── README.md
```

## 开发环境设置

由于这是一个新项目，尚未创建实际的源代码文件。在开始开发之前，需要：

1. 初始化项目并安装依赖
2. 创建 TypeScript 配置
3. 设置构建脚本
4. 创建项目结构

## 常用开发命令

待项目初始化完成后，常用的开发命令将包括：

```bash
# 开发模式运行
npm run dev

# 构建项目
npm run build

# 运行测试
npm test

# 全局安装(用于本地测试)
npm install -g .

# 运行CLI
dd "创建一个名为 logs 的目录"
```

## API 接口规范

### OpenAI 兼容接口
- 端点: `/v1/chat/completions`
- 支持流式响应
- 支持函数调用
- 详细文档: `api-doc/openai-chat.md`

### Anthropic 接口
- 端点: `/v1/messages`
- 支持流式响应
- 支持工具调用
- 详细文档: `api-doc/anthropic-chat.md`

### DeepSeek 推理接口
- 端点: `/v1/chat/completions`
- 支持推理内容 (reasoning_content)
- 详细文档: `api-doc/deepseek-reasoning-chat.md`

## 核心架构概念

### API适配器模式
- 所有API提供商都实现统一的 `BaseAdapter` 接口
- `APIRouter` 负责根据配置选择合适的适配器
- 每个适配器处理特定API的请求/响应格式转换

### 安全机制
- **危险命令检测**: 本地预检查危险命令
- **用户确认**: 默认需要用户确认才能执行
- **命令白名单/黑名单**: 禁止执行高危操作

### 配置系统
- 配置文件位置: `~/.ddcli/config.yaml`
- 支持多API提供商配置
- 可设置默认提供商和模型

## PowerShell 支持

项目专门针对 Windows PowerShell 环境进行优化：
- 支持 PowerShell 5.1+ 和 PowerShell 7.x
- 自动检测 Shell 类型
- Unix 到 PowerShell 命令转换

## 安全注意事项

- 默认不自动执行命令，需要用户确认
- 危险命令（如 `rm -rf /`, `sudo rm -rf /` 等）被禁止
- 高风险命令需要二次确认
- 不在日志中记录敏感信息

## 开发注意事项

1. **类型安全**: 使用 TypeScript 严格模式
2. **错误处理**: 提供清晰的错误信息和上下文
3. **可测试性**: 使用依赖注入，便于单元测试
4. **模块化**: 保持模块间的低耦合
5. **配置驱动**: 通过配置文件控制行为，避免硬编码