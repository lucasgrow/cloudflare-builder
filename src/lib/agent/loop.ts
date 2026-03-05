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
  baseURL?: string;
  systemPrompt: string;
  userMessage: string;
  tools: ToolDefinition[];
  toolHandlers: Record<string, ToolHandler>;
  model?: string;
  maxTurns?: number;
}

export interface AgentResult {
  content: string;
  toolCalls: Array<{ name: string; input: Record<string, unknown> }>;
  turns: number;
}

// ── Anthropic-format types (what the loop uses internally) ──

interface TextBlock {
  type: "text";
  text: string;
}

interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type ContentBlock = TextBlock | ToolUseBlock;

interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}

interface Message {
  role: "user" | "assistant";
  content: string | ContentBlock[] | ToolResultBlock[];
}

interface AnthropicResponse {
  content: ContentBlock[];
  stop_reason: string;
}

// ── OpenAI-format types (what OpenRouter returns) ──

interface OpenAIToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OpenAIChoice {
  message: {
    role: string;
    content: string | null;
    tool_calls?: OpenAIToolCall[];
  };
  finish_reason: string;
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
}

// ── Translation layer ──

function toOpenAIRequest(
  model: string,
  systemPrompt: string,
  messages: Message[],
  tools: ToolDefinition[]
) {
  const openaiMessages: Record<string, unknown>[] = [
    { role: "system", content: systemPrompt },
  ];

  for (const msg of messages) {
    if (msg.role === "user") {
      if (typeof msg.content === "string") {
        openaiMessages.push({ role: "user", content: msg.content });
      } else if (Array.isArray(msg.content) && msg.content.length > 0 && "tool_use_id" in msg.content[0]) {
        // Tool results → one message per result
        for (const block of msg.content as ToolResultBlock[]) {
          openaiMessages.push({
            role: "tool",
            tool_call_id: block.tool_use_id,
            content: block.content,
          });
        }
      } else {
        openaiMessages.push({ role: "user", content: JSON.stringify(msg.content) });
      }
    } else {
      // Assistant message with potential tool calls
      const blocks = msg.content as ContentBlock[];
      const textParts = blocks.filter((b): b is TextBlock => b.type === "text");
      const toolParts = blocks.filter((b): b is ToolUseBlock => b.type === "tool_use");

      const assistantMsg: Record<string, unknown> = {
        role: "assistant",
        content: textParts.map((b) => b.text).join("\n") || null,
      };

      if (toolParts.length > 0) {
        assistantMsg.tool_calls = toolParts.map((t) => ({
          id: t.id,
          type: "function",
          function: {
            name: t.name,
            arguments: JSON.stringify(t.input),
          },
        }));
      }

      openaiMessages.push(assistantMsg);
    }
  }

  const openaiTools = tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));

  return {
    model,
    max_tokens: 4096,
    messages: openaiMessages,
    tools: openaiTools.length > 0 ? openaiTools : undefined,
  };
}

function fromOpenAIResponse(resp: OpenAIResponse): AnthropicResponse {
  const choice = resp.choices[0];
  if (!choice) {
    return { content: [{ type: "text", text: "Empty response" }], stop_reason: "end_turn" };
  }

  const content: ContentBlock[] = [];

  if (choice.message.content) {
    content.push({ type: "text", text: choice.message.content });
  }

  if (choice.message.tool_calls) {
    for (const tc of choice.message.tool_calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        args = { _raw: tc.function.arguments };
      }
      content.push({
        type: "tool_use",
        id: tc.id,
        name: tc.function.name,
        input: args,
      });
    }
  }

  // Map finish_reason
  const stopReason =
    choice.finish_reason === "tool_calls" || choice.finish_reason === "function_call"
      ? "tool_use"
      : "end_turn";

  return { content, stop_reason: stopReason };
}

// ── Detect if baseURL is OpenRouter or Anthropic-compatible ──

function isOpenAICompatible(baseURL?: string): boolean {
  if (!baseURL) return false;
  return baseURL.includes("openrouter.ai") || baseURL.includes("openai.com");
}

// ── Main loop ──

export async function runAgentLoop(
  options: AgentLoopOptions
): Promise<AgentResult> {
  const {
    apiKey,
    systemPrompt,
    userMessage,
    tools,
    toolHandlers,
    baseURL,
    model = "claude-sonnet-4-6-20250514",
    maxTurns = 6,
  } = options;

  const useOpenAIFormat = isOpenAICompatible(baseURL);
  const messages: Message[] = [{ role: "user", content: userMessage }];
  const allToolCalls: AgentResult["toolCalls"] = [];
  let turns = 0;

  while (turns < maxTurns) {
    turns++;

    let response: AnthropicResponse;

    if (useOpenAIFormat) {
      // OpenAI-compatible endpoint (OpenRouter, etc.)
      const body = toOpenAIRequest(model, systemPrompt, messages, tools);
      const res = await fetch(baseURL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Agent API ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as OpenAIResponse;
      response = fromOpenAIResponse(data);
    } else {
      // Anthropic-native endpoint (direct API or compatible proxy)
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });

      const raw = await client.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        tools: tools as Parameters<typeof client.messages.create>[0]["tools"],
        messages: messages as Parameters<typeof client.messages.create>[0]["messages"],
      });

      response = {
        content: raw.content as ContentBlock[],
        stop_reason: raw.stop_reason ?? "end_turn",
      };
    }

    // Extract blocks
    const textBlocks = response.content.filter((b): b is TextBlock => b.type === "text");
    const toolUseBlocks = response.content.filter((b): b is ToolUseBlock => b.type === "tool_use");

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

    const toolResults: ToolResultBlock[] = [];

    for (const block of toolUseBlocks) {
      allToolCalls.push({ name: block.name, input: block.input });

      const handler = toolHandlers[block.name];
      let result: string;

      if (!handler) {
        result = `Error: no handler registered for tool "${block.name}"`;
      } else {
        try {
          result = await handler(block.input);
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

  // Max turns exhausted
  const lastAssistant = messages.filter((m) => m.role === "assistant").pop();
  let finalText = "";
  if (lastAssistant && Array.isArray(lastAssistant.content)) {
    finalText = (lastAssistant.content as ContentBlock[])
      .filter((b): b is TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }

  return {
    content: finalText || "[max turns reached without final response]",
    toolCalls: allToolCalls,
    turns,
  };
}
