export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export abstract class BaseLLMService {
  protected apiKey?: string;
  protected baseURL?: string;

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  abstract complete(prompt: string, options?: LLMOptions): Promise<LLMResponse>;

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export class OpenAIService extends BaseLLMService {
  async complete(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(`${this.baseURL || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return {
      content: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }
}

export class AnthropicService extends BaseLLMService {
  async complete(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch(`${this.baseURL || 'https://api.anthropic.com/v1'}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options?.model || 'claude-3-5-haiku-20240307',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    const textContent = data.content?.find(c => c.type === 'text')?.text || '';

    return {
      content: textContent,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }
}

export type LLMProvider = 'openai' | 'anthropic';

export function createLLMService(
  provider: LLMProvider,
  apiKey?: string,
  baseURL?: string
): BaseLLMService {
  switch (provider) {
    case 'openai':
      return new OpenAIService(apiKey, baseURL);
    case 'anthropic':
      return new AnthropicService(apiKey, baseURL);
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}
