# ddCLI 实施计划 - 多API支持

## 📋 项目概述

**项目名称**: ddCLI - 自然语言命令行工具
**技术栈**: Node.js + TypeScript
**核心价值**: 降低终端使用门槛，提升工作效率
**API支持**: OpenAI、Anthropic、DeepSeek
**适配终端**: Windows PowerShell 5.1+/7.x

## 🎯 核心功能

- 自然语言命令转换 (`dd <自然语言描述>`)
- 多API提供商支持 (OpenAI/Anthropic/DeepSeek)
- 命令预览和用户确认机制
- 危险命令拦截
- 配置文件管理 (`~/.ddcli/config.yaml`)

## 🏗️ 技术架构

```
用户终端 → CLI入口点 → 配置管理器 → 命令解析器 → 安全检查器
    ↓
API适配器层 → 具体API客户端 → 统一响应处理器
    ↓
命令确认器 → 执行器 → 结果格式化器
```

## 📁 项目结构

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
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 使用示例

### 安装和配置
```bash
# 全局安装
npm install -g ddcli

# 配置文件示例 (~/.ddcli/config.yaml)
default_provider: "openai"

providers:
  openai:
    model: "gpt-4o"
    base_url: "https://your-custom-endpoint.com/v1/chat/completions"
    api_key: "sk-xxxx"
    timeout: 10

  anthropic:
    model: "claude-3-5-sonnet-20241022"
    base_url: "https://your-custom-endpoint.com/v1/messages"   
    api_key: "sk-ant-xxxx"
    timeout: 10

  deepseek:
    model: "deepseek-reasoner"
    base_url: "https://your-custom-endpoint.com/v1/chat/completions"
    api_key: "sk-xxxx"
    timeout: 10

auto_execute: false
shell: "auto"
```

### 基础使用
```bash
dd "创建一个名为 logs 的目录"
dd --provider anthropic "列出当前目录所有文件"
dd --provider deepseek "分析这个错误日志文件"
```

## 🔒 安全机制

### 危险命令分类
- **禁止执行**: `rm -rf /`, `:(){ :|:& };:`, `mkfs`, `format c:`
- **需要确认**: `rm`, `mv`, `chmod`, `sudo`, `Remove-Item`, `Format-Volume`

### Shell 支持
- **PowerShell 5.1+**: Windows 10/11 默认环境
- **PowerShell 7.x**: 跨平台现代化 PowerShell
- **自动检测**: 根据运行环境自动适配命令语法

### 安全流程
1. 本地危险命令检测
2. 用户确认机制
3. 命令预览和说明
4. 执行前最终确认

## 📋 开发任务

### 项目初始化
- [ ] 创建项目目录结构
- [ ] 配置 TypeScript 和构建工具
- [ ] 设置 package.json 和依赖
- [ ] 实现基础 CLI 框架 (Commander.js)

### API适配器开发
- [ ] 实现基础适配器接口 (BaseAdapter)
- [ ] 创建 API 路由器 (APIRouter)
- [ ] 实现 OpenAI 适配器
- [ ] 实现 Anthropic 适配器
- [ ] 实现 DeepSeek 适配器
- [ ] 添加 API 错误处理

### 核心功能
- [ ] 实现危险命令检测器
- [ ] 实现命令确认机制
- [ ] 实现 Shell 类型检测和命令执行
- [ ] 添加交互式界面

### 测试与文档
- [ ] 编写单元测试
- [ ] 编写用户使用文档
- [ ] 测试多API兼容性
- [ ] PowerShell 环境兼容性测试

## 🎯 技术选型

- **CLI框架**: Commander.js
- **HTTP客户端**: Axios
- **配置管理**: js-yaml
- **交互界面**: Inquirer.js
- **测试框架**: Jest
- **进程管理**: child_process (PowerShell 执行)

## 🔧 PowerShell 适配要点

### 命令转换示例
```javascript
// Unix → PowerShell 转换
"ls -la" → "Get-ChildItem -Force"
"rm -rf logs" → "Remove-Item -Recurse -Force logs"
"cp file1.txt file2.txt" → "Copy-Item file1.txt file2.txt"
"cat file.txt" → "Get-Content file.txt"
```

### 执行环境检测
```javascript
// 检测 PowerShell 版本和执行策略
const shellInfo = {
  version: process.env.PSVersionTable?.PSVersion,
  executionPolicy: // 获取执行策略
  isWindows: process.platform === 'win32'
}
```

---

准备开始实施吗？从项目初始化开始逐步构建。
