import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { BaseAdapter, APIResponse } from '../BaseAdapter';

export class OpenAIAdapter extends BaseAdapter {
  private client: AxiosInstance;

  constructor(apiKey: string, baseUrl: string, model: string, timeout: number = 10) {
    super(apiKey, baseUrl, model, timeout);

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: timeout * 1000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
  }

  async convertToCommand(query: string, context?: string): Promise<APIResponse> {
    this.validateConfig();

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(query, context);

      const requestData = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      };

      const config: AxiosRequestConfig = {
        timeout: this.timeout * 1000
      };

      const response = await this.client.post('', requestData, config);

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('API 响应格式不正确');
      }

      const content = response.data.choices[0].message.content.trim();
      return this.parseResponse(content);

    } catch (error: any) {
      this.handleAPIError(error);
    }
  }

  private buildUserPrompt(query: string, context?: string): string {
    let prompt = `请将以下自然语言描述转换为 shell 命令：\n\n"${query}"`;

    if (context) {
      prompt += `\n\n上下文信息：${context}`;
    }

    prompt += '\n\n请只返回 JSON 格式的响应，例如：{"command": "命令", "explanation": "解释"}';

    return prompt;
  }
}