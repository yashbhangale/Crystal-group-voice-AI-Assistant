import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

class OpenAIService {
  private client: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Initialize with API key from environment
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      this.setApiKey(apiKey);
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // For development only
    });
  }

  isConfigured(): boolean {
    return this.client !== null && this.apiKey !== null;
  }

  async sendMessage(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not configured. Please set your API key in the .env file.');
    }

    const {
      model = 'gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 150
    } = options;

    try {
      const completion = await this.client.chat.completions.create({
        model: model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: temperature,
        max_tokens: maxTokens
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response received from OpenAI');
      }

      return response;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to get response from OpenAI: ${error}`);
    }
  }
}

export const openAIService = new OpenAIService();