import { AppConfig } from '../types';

export const DEFAULT_CONFIG: AppConfig = {
  default_provider: 'openai',
  providers: {
    openai: {
      model: 'gpt-4o',
      base_url: 'https://api.openai.com/v1/chat/completions',
      api_key: '',
      timeout: 10
    },
    anthropic: {
      model: 'claude-3-5-sonnet-20241022',
      base_url: 'https://api.anthropic.com/v1/messages',
      api_key: '',
      timeout: 10
    },
    deepseek: {
      model: 'deepseek-reasoner',
      base_url: 'https://api.deepseek.com/v1/chat/completions',
      api_key: '',
      timeout: 10
    }
  },
  auto_execute: false,
  shell: 'auto'
};