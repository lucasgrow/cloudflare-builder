import Anthropic from "@anthropic-ai/sdk";

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ToolHandler {
  (input: Record<string, unknown>): Promise<string>;
}

interface AgentLoopOptions {
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  tools: ToolDefinition[];
  toolHandlers: Record<string, ToolHandler>;
  maxTurns?: number;
}

export interface AgentResult {
  content: string;
  toolCalls: Array<{ name: string; input: Record<string, unknown> }>;
  turns: number;
}

export async function runAgentLoop(
  options: AgentLoopOptions
): Promise<AgentResult> {
  const {
    apiKey,
    systemPrompt,
    userMessage,
    tools,
    toolHandlers,
    maxTurns = 6,
  } = options;

  const client = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  const allToolCalls: AgentResult["toolCalls"] = [];
  let turns = 0;

  while (turns < maxTurns) {
    turns++;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools: tools as Anthropic.Tool[],
      messages,
    });

    // Extract text from response
    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    // If end_turn or no tool calls, return final text
    if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
      return {
        content: textBlocks.map((b) => b.text).join("\n"),
        toolCalls: allToolCalls,
        turns,
      };
    }

    // Process tool calls
    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of toolUseBlocks) {
      const input = block.input as Record<string, unknown>;
      allToolCalls.push({ name: block.name, input });

      const handler = toolHandlers[block.name];
      let result: string;

      if (!handler) {
        result = `Error: no handler registered for tool "${block.name}"`;
      } else {
        try {
          result = await handler(input);
        } catch (err) {
          result = `Error executing tool "${block.name}": ${err instanceof Error ? err.message : String(err)}`;
        }
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  // Max turns exhausted — return whatever text we have from the last response
  const lastAssistant = messages
    .filter((m) => m.role === "assistant")
    .pop();

  let finalText = "";
  if (lastAssistant && Array.isArray(lastAssistant.content)) {
    finalText = (lastAssistant.content as Anthropic.ContentBlock[])
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }

  return {
    content: finalText || "[max turns reached without final response]",
    toolCalls: allToolCalls,
    turns,
  };
}
