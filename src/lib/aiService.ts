import apiClient from './api';
import { AiChatResponse, AiConfirmResponse } from '@/types/ai';

export const aiService = {
  /**
   * Send a query to the backend AI agent.
   */
  async sendMessage(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<AiChatResponse> {
    const response = await apiClient.post<AiChatResponse>('/ai/chat', {
      message,
      history,
    });
    return response.data;
  },

  /**
   * Confirm or cancel a sensitive pending action.
   */
  async confirmAction(
    confirmationToken: string,
    confirm: boolean
  ): Promise<AiConfirmResponse> {
    const response = await apiClient.post<AiConfirmResponse>('/ai/confirm-action', {
      confirmation_token: confirmationToken,
      confirm,
    });
    return response.data;
  },

  /**
   * Get role-aware capabilities of the AI Agent.
   */
  async getCapabilities(): Promise<{ success: boolean; role: string; capabilities: any[] }> {
    const response = await apiClient.get('/ai/capabilities');
    return response.data;
  },
};

export default aiService;
