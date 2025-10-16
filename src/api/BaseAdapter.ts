export interface APIResponse {
  command: string;
  explanation: string;
}

export interface APIError {
  error: string;
  message?: string;
  code?: string;
}

export interface APIErrorResponse {
  response?: {
    status: number;
    data?: {
      error?: { message?: string };
      message?: string;
    };
  };
  code?: string;
  message?: string;
}

export abstract class BaseAdapter {
  protected apiKey: string;
  protected baseUrl: string;
  protected model: string;
  protected timeout: number;

  constructor(apiKey: string, baseUrl: string, model: string, timeout: number = 10) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
    this.timeout = timeout;
  }

  /**
   * 将自然语言转换为命令
   */
  abstract convertToCommand(query: string, context?: string): Promise<APIResponse>;

  /**
   * 检查API配置是否有效
   */
  protected validateConfig(): void {
    if (!this.apiKey) {
      throw new Error('API Key 未配置');
    }
    if (!this.baseUrl) {
      throw new Error('Base URL 未配置');
    }
    if (!this.model) {
      throw new Error('模型未配置');
    }
  }

  /**
   * 构建系统提示词
   */
  protected buildSystemPrompt(shellType: string = 'auto'): string {
    const shellInstructions = shellType === 'powershell'
      ? '请生成 PowerShell 命令。使用 PowerShell 原生命令（如 Get-ChildItem 而不是 ls）'
      : '请生成 Unix Shell 命令（bash/zsh）';

    return `你是一个专业的命令行助手，负责将自然语言描述转换为准确、安全的 shell 命令。

${shellInstructions}

要求：
1. 只返回一个可执行的命令，不要解释性文字
2. 确保命令安全，避免破坏性操作
3. 命令应该简洁高效
4. 如果需要多个步骤，使用 && 连接
5. 响应格式必须是 JSON: {"command": "命令", "explanation": "简短解释"}

示例：
输入: "列出当前目录所有文件并按大小排序"
输出: {"command": "ls -lS", "explanation": "列出文件并按大小排序"}

输入: "创建一个名为 logs 的目录"
输出: {"command": "mkdir logs", "explanation": "创建 logs 目录"}`;
  }

  /**
   * 解析API响应
   */
  protected parseResponse(response: string): APIResponse {
    try {
      const parsed = JSON.parse(response);
      if (typeof parsed.command === 'string' && typeof parsed.explanation === 'string') {
        return {
          command: parsed.command.trim(),
          explanation: parsed.explanation.trim()
        };
      }
      throw new Error('响应格式不正确');
    } catch (error) {
      throw new Error(`解析响应失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 处理API错误
   */
  protected handleAPIError(error: APIErrorResponse): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          throw new Error('API Key 无效或已过期');
        case 403:
          throw new Error('API 访问被拒绝，请检查权限');
        case 429:
          throw new Error('API 请求频率限制，请稍后重试');
        case 500:
          throw new Error('API 服务器内部错误');
        default:
          throw new Error(`API 请求失败 (${status}): ${data?.error?.message || data?.message || '未知错误'}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('API 请求超时');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到 API 服务器');
    } else {
      throw new Error(`请求失败: ${error.message || String(error)}`);
    }
  }
}