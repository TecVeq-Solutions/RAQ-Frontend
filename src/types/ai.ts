export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  pending_action?: AiPendingAction | null;
  executed_tools?: AiExecutedTool[];
  isError?: boolean;
}

export interface AiExecutedTool {
  tool_name: string;
  arguments: Record<string, any>;
  success: boolean;
}

export interface AiPendingAction {
  status: 'pending_confirmation';
  action_name: string;
  title: string;
  summary: string;
  details: Record<string, string>;
  parameters: Record<string, any>;
  confirmation_token: string;
}

export interface AiChatResponse {
  success: boolean;
  response: string;
  pending_action: AiPendingAction | null;
  executed_tools: AiExecutedTool[];
}

export interface AiConfirmResponse {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}
