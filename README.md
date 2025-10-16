# ddCLI - 自然语言命令行工具

<div align="center">

![ddCLI Logo](https://via.placeholder.com/150x150/007ACC/FFFFFF?text=ddCLI)

[![npm version](https://badge.fury.io/js/ddcli.svg)](https://badge.fury.io/js/ddcli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue)](https://www.typescriptlang.org/)

**用自然语言描述你的意图，AI 自动转换为准确的终端命令**

</div>

## ✨ 特性

- 🗣️ **自然语言交互** - 用日常语言描述任务，无需记忆复杂命令
- 🤖 **多AI模型支持** - 支持 OpenAI、Anthropic、DeepSeek 等主流AI提供商
- 🛡️ **安全优先** - 内置危险命令检测和拦截机制
- 🖥️ **跨平台支持** - 优化支持 Windows PowerShell 和 Unix Shell
- ⚡ **快速响应** - 优化的API调用和响应处理
- 🔧 **灵活配置** - 支持自定义API端点、模型和参数
- 📊 **详细日志** - 完整的操作日志记录和调试支持

## 🚀 快速开始

### 安装

```bash
# 全局安装
npm install -g ddcli

# 或使用 yarn
yarn global add ddcli

# 或使用 pnpm
pnpm add -g ddcli
```

### 初始配置

首次使用需要配置API密钥：

```bash
# 创建配置文件目录
mkdir -p ~/.ddcli

# 创建配置文件
cat > ~/.ddcli/config.yaml << EOF
default_provider: "openai"

providers:
  openai:
    model: "gpt-4o"
    base_url: "https://api.openai.com/v1/chat/completions"
    api_key: "sk-your-openai-api-key"
    timeout: 10

  anthropic:
    model: "claude-3-5-sonnet-20241022"
    base_url: "https://api.anthropic.com/v1/messages"
    api_key: "sk-ant-your-anthropic-api-key"
    timeout: 10

  deepseek:
    model: "deepseek-reasoner"
    base_url: "https://api.deepseek.com/v1/chat/completions"
    api_key: "sk-your-deepseek-api-key"
    timeout: 10

auto_execute: false
shell: "auto"
EOF
```

或者使用命令行配置：

```bash
# 重置配置为正确格式
dd config --reset

# 查看当前配置
dd config --show

# 手动编辑配置文件
nano ~/.ddcli/config.yaml  # macOS/Linux
notepad ~/.ddcli\config.yaml  # Windows
```

### 基本使用

```bash
# 简单命令转换
dd "创建一个名为 logs 的目录"

# 查看当前目录文件
dd "列出当前目录所有文件并按大小排序"

# 文件操作
dd "把所有 .log 文件移动到 backup 目录"

# 指定AI提供商
dd --provider anthropic "分析这个错误日志文件"

# 跳过确认直接执行
dd --yes "显示当前日期和时间"

# 启用调试模式
dd --debug "查看系统信息"
```

## 📋 配置说明

配置文件位于 `~/.ddcli/config.yaml`：

```yaml
# 默认API提供商
default_provider: "openai"  # openai | anthropic | deepseek

# API提供商配置
providers:
  openai:
    model: "gpt-4o"
    base_url: "https://api.openai.com/v1/chat/completions"  # 可选自定义端点
    api_key: "sk-your-api-key"
    timeout: 10  # 请求超时时间（秒）

  anthropic:
    model: "claude-3-5-sonnet-20241022"
    base_url: "https://api.anthropic.com/v1/messages"
    api_key: "sk-ant-your-api-key"
    timeout: 10

  deepseek:
    model: "deepseek-reasoner"
    base_url: "https://api.deepseek.com/v1/chat/completions"
    api_key: "sk-your-api-key"
    timeout: 10

# 行为配置
auto_execute: false  # 是否自动执行命令（默认false，需要确认）
shell: "auto"        # Shell类型：auto | powershell | bash
```

### 配置命令

```bash
dd config --show     # 显示当前配置
dd config --reset    # 重置配置为默认值
```

## 🛡️ 安全机制

ddCLI 内置多层安全检查：

### 危险命令分类

- **🚫 已阻止命令** - 直接拒绝执行
  - `rm -rf /`, `:(){ :|:& };:`, `format c:`
  - 系统破坏性命令

- **⚠️ 高风险命令** - 需要二次确认
  - `sudo`, `chmod 777`, `dd if=`
  - 可能影响系统稳定的命令

- **⚡ 中等风险命令** - 需要确认
  - `rm`, `mv`, `chmod`
  - 文件操作类命令

### PowerShell 特定保护

- 检测执行策略绕过尝试
- 注册表操作警告
- 管理员权限操作确认

## 🖥️ 支持的Shell

### Windows PowerShell
- PowerShell 5.1+ (Windows 10/11 默认)
- PowerShell 7.x (跨平台版本)

### Unix Shell
- Bash
- Zsh
- Fish

## 📖 命令参考

### 基本命令

```bash
dd <自然语言描述>                    # 转换并执行命令
  [选项] <查询>

选项:
  -p, --provider <provider>         # 指定API提供商 (openai|anthropic|deepseek)
  -y, --yes                        # 跳过确认直接执行
  -d, --debug                      # 启用调试模式
  -h, --help                       # 显示帮助信息
  -V, --version                    # 显示版本信息
```

### 配置命令

```bash
dd config --show                    # 显示当前配置
dd config --reset                   # 重置配置为默认值
```

## 🔧 开发

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/your-org/ddcli.git
cd ddcli

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 运行测试
npm test

# 全局安装本地版本
npm install -g .
```

### 项目结构

```
ddcli/
├── src/
│   ├── index.ts                 # CLI入口点
│   ├── config/                  # 配置管理
│   │   ├── ConfigManager.ts
│   │   └── defaultConfig.ts
│   ├── core/                    # 核心功能
│   │   ├── CommandProcessor.ts
│   │   ├── SecurityChecker.ts
│   │   └── Executor.ts
│   ├── api/                     # API适配器
│   │   ├── BaseAdapter.ts
│   │   ├── APIRouter.ts
│   │   ├── adapters/
│   │   │   ├── OpenAIAdapter.ts
│   │   │   ├── AnthropicAdapter.ts
│   │   │   └── DeepSeekAdapter.ts
│   │   └── types.ts
│   ├── ui/                      # 用户界面
│   │   ├── Interactive.ts
│   │   └── Formatter.ts
│   ├── utils/                   # 工具函数
│   │   ├── shell.ts
│   │   └── logger.ts
│   └── types.ts                 # 类型定义
├── tests/                       # 测试文件
├── api-doc/                     # API文档
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

### 开发流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🐛 问题反馈

如果您遇到问题或有建议，请在 [GitHub Issues](https://github.com/your-org/ddcli/issues) 中提交。

## 🙏 致谢

- [Commander.js](https://github.com/tj/commander.js) - 命令行界面框架
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) - 交互式命令行界面
- [Chalk](https://github.com/chalk/chalk) - 终端字符串样式
- [Ora](https://github.com/sindresorhus/ora) - 终端加载动画

## 📊 路线图

- [ ] 支持更多AI提供商（Google Gemini、本地模型等）
- [ ] 添加命令历史记录功能
- [ ] 实现命令模板和别名
- [ ] 添加Web界面配置工具
- [ ] 支持批量命令处理
- [ ] 添加插件系统

---

<div align="center">

**Made with ❤️ by the ddCLI Team**

</div>