"""
ai/client.py

Provider-agnostic AI client factory.
Supports:
  - Anthropic (Claude models) — native tool_use blocks
  - OpenAI-compatible (OpenAI, Groq, Together AI, Mistral, Ollama, etc.)
    — uses openai SDK with configurable base_url

Configuration via Django settings (read from env vars):
  AI_PROVIDER   = 'anthropic' | 'openai'   (default: 'anthropic')
  AI_MODEL      = any model string          (default per provider below)
  ANTHROPIC_API_KEY
  OPENAI_API_KEY
  OPENAI_BASE_URL (optional, e.g. 'https://api.groq.com/openai/v1')
"""

import json
from django.conf import settings


# ─── Defaults ────────────────────────────────────────────────────────────────

DEFAULT_MODELS = {
    'anthropic': 'claude-haiku-4-5',
    'openai': 'gpt-4o-mini',
    'groq': 'llama-3.3-70b-versatile',
    'gemini': 'gemini-1.5-flash',
}


def get_provider() -> str:
    provider = getattr(settings, 'AI_PROVIDER', '').lower()
    if provider:
        return provider
    if (
        getattr(settings, 'OPENAI_API_KEY', '')
        or getattr(settings, 'GEMINI_API_KEY', '')
        or getattr(settings, 'GROQ_API_KEY', '')
    ):
        return 'openai'
    return 'anthropic'


def get_model() -> str:
    explicit = getattr(settings, 'AI_MODEL', '').strip()
    if explicit:
        return explicit

    provider = get_provider()
    base_url = getattr(settings, 'OPENAI_BASE_URL', '') or ''
    gemini_key = getattr(settings, 'GEMINI_API_KEY', '')
    groq_key = getattr(settings, 'GROQ_API_KEY', '')

    if provider == 'openai':
        if 'googleapis.com' in base_url or gemini_key:
            return DEFAULT_MODELS['gemini']
        if 'groq.com' in base_url or groq_key:
            return DEFAULT_MODELS['groq']
        return DEFAULT_MODELS['openai']

    return DEFAULT_MODELS.get(provider, 'claude-haiku-4-5')


# ─── Tool Schema Conversion ───────────────────────────────────────────────────

def _anthropic_tools_to_openai(anthropic_tools: list) -> list:
    """
    Convert Anthropic tool schema format to OpenAI function-calling format.
    Anthropic: { name, description, input_schema: { type, properties, required } }
    OpenAI:    { type: "function", function: { name, description, parameters } }
    """
    result = []
    for tool in anthropic_tools:
        result.append({
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool.get("description", ""),
                "parameters": tool.get("input_schema", {"type": "object", "properties": {}}),
            },
        })
    return result


# ─── Anthropic Backend ────────────────────────────────────────────────────────

def _get_anthropic_client():
    import anthropic
    api_key = getattr(settings, 'ANTHROPIC_API_KEY', '')
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY is not set in your environment.")
    return anthropic.Anthropic(api_key=api_key)


def _chat_anthropic(messages: list, system: str, tools: list = None, max_tokens: int = 1024) -> dict:
    """
    Run one turn with Claude. Returns a normalised response dict:
    {
        "stop_reason": "end_turn" | "tool_use",
        "text": str | None,          # final text reply (if end_turn)
        "tool_calls": [              # list of tool calls (if tool_use)
            { "id": str, "name": str, "input": dict }
        ],
        "raw": <native response>,
    }
    """
    client = _get_anthropic_client()
    kwargs = dict(
        model=get_model(),
        max_tokens=max_tokens,
        system=system,
        messages=messages,
    )
    if tools:
        kwargs['tools'] = tools

    response = client.messages.create(**kwargs)

    if response.stop_reason == 'tool_use':
        calls = [
            {"id": block.id, "name": block.name, "input": block.input}
            for block in response.content
            if block.type == "tool_use"
        ]
        return {"stop_reason": "tool_use", "text": None, "tool_calls": calls, "raw": response}

    text = "".join(b.text for b in response.content if hasattr(b, "text"))
    return {"stop_reason": "end_turn", "text": text, "tool_calls": [], "raw": response}


def _build_anthropic_tool_result_message(tool_calls_made: list, results: list) -> dict:
    """Build the user message that feeds tool results back to Claude."""
    content = []
    for call, result in zip(tool_calls_made, results):
        content.append({
            "type": "tool_result",
            "tool_use_id": call["id"],
            "content": json.dumps(result),
        })
    return {"role": "user", "content": content}


def _append_anthropic_assistant_message(messages: list, response: dict) -> list:
    """Append the raw Anthropic response content as an assistant message."""
    return messages + [{"role": "assistant", "content": response["raw"].content}]


# ─── OpenAI-compatible Backend ────────────────────────────────────────────────

def _get_openai_client():
    from openai import OpenAI
    api_key = (
        getattr(settings, 'OPENAI_API_KEY', '')
        or getattr(settings, 'GEMINI_API_KEY', '')
        or getattr(settings, 'GROQ_API_KEY', '')
    )
    if not api_key:
        raise ValueError(
            "No AI API key found. Please set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY."
        )
    base_url = getattr(settings, 'OPENAI_BASE_URL', None)
    if not base_url:
        if getattr(settings, 'GEMINI_API_KEY', ''):
            base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
        elif getattr(settings, 'GROQ_API_KEY', ''):
            base_url = "https://api.groq.com/openai/v1"
    kwargs = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    return OpenAI(**kwargs)


def _chat_openai(messages: list, system: str, tools: list = None, max_tokens: int = 1024) -> dict:
    """
    Run one turn with an OpenAI-compatible provider (OpenAI, Groq, etc.).
    Returns the same normalised dict as _chat_anthropic.
    """
    client = _get_openai_client()

    # Prepend system message in OpenAI format
    full_messages = [{"role": "system", "content": system}] + messages

    kwargs = dict(
        model=get_model(),
        max_tokens=max_tokens,
        messages=full_messages,
    )
    if tools:
        kwargs['tools'] = _anthropic_tools_to_openai(tools)
        kwargs['tool_choice'] = 'auto'

    response = client.chat.completions.create(**kwargs)
    choice = response.choices[0]

    if choice.finish_reason == 'tool_calls' or (choice.message and choice.message.tool_calls):
        calls = []
        for tc in (choice.message.tool_calls or []):
            raw_args = tc.function.arguments or "{}"
            if isinstance(raw_args, str):
                try:
                    parsed_args = json.loads(raw_args)
                except Exception:
                    parsed_args = {}
            else:
                parsed_args = raw_args or {}
            calls.append({
                "id": tc.id,
                "name": tc.function.name,
                "input": parsed_args,
            })
        return {"stop_reason": "tool_use", "text": None, "tool_calls": calls, "raw": response}

    text = choice.message.content or ""
    return {"stop_reason": "end_turn", "text": text, "tool_calls": [], "raw": response}


def _build_openai_tool_result_message(tool_calls_made: list, results: list) -> list:
    """
    OpenAI requires one 'tool' message per tool call result.
    Returns a list of messages to extend the conversation with.
    """
    msgs = []
    for call, result in zip(tool_calls_made, results):
        msgs.append({
            "role": "tool",
            "tool_call_id": call["id"],
            "content": json.dumps(result),
        })
    return msgs


def _append_openai_assistant_message(messages: list, response: dict) -> list:
    """Append the assistant message (with tool_calls) for OpenAI format."""
    choice = response["raw"].choices[0]
    msg = choice.message
    assistant_msg = {"role": "assistant", "content": msg.content}
    if msg.tool_calls:
        assistant_msg["tool_calls"] = [
            {
                "id": tc.id,
                "type": "function",
                "function": {"name": tc.function.name, "arguments": tc.function.arguments},
            }
            for tc in msg.tool_calls
        ]
    return messages + [assistant_msg]


# ─── Unified Agentic Loop ─────────────────────────────────────────────────────

def run_agentic_loop(
    messages: list,
    system: str,
    tools: list,
    tool_executor,           # callable(name: str, input: dict) -> dict
    max_tokens: int = 1024,
) -> tuple[str, list]:
    """
    Run a full agentic loop until the model stops calling tools.
    Works with both Anthropic and OpenAI-compatible providers.

    Args:
        messages:       Conversation history (OpenAI-style role/content dicts).
        system:         System prompt string.
        tools:          Tool schemas in Anthropic format (we convert internally).
        tool_executor:  Function that takes (tool_name, tool_input) and returns a result dict.
        max_tokens:     Max tokens for each model call.

    Returns:
        (reply_text, tools_used_names)
    """
    provider = get_provider()
    current_messages = list(messages)
    tools_used = []

    while True:
        if provider == 'anthropic':
            result = _chat_anthropic(current_messages, system, tools, max_tokens)
        else:
            result = _chat_openai(current_messages, system, tools, max_tokens)

        if result["stop_reason"] == "tool_use":
            # Execute all tool calls
            tool_results = []
            for call in result["tool_calls"]:
                tools_used.append(call["name"])
                tool_results.append(tool_executor(call["name"], call["input"]))

            # Append assistant message + tool results back into the conversation
            if provider == 'anthropic':
                current_messages = _append_anthropic_assistant_message(current_messages, result)
                current_messages.append(
                    _build_anthropic_tool_result_message(result["tool_calls"], tool_results)
                )
            else:
                current_messages = _append_openai_assistant_message(current_messages, result)
                current_messages.extend(
                    _build_openai_tool_result_message(result["tool_calls"], tool_results)
                )
            # Loop continues
        else:
            return result["text"] or "", list(set(tools_used))


def simple_chat(
    messages: list,
    system: str,
    max_tokens: int = 1024,
) -> str:
    """
    Single-turn chat without tool calling.
    Used by ParseWorkoutView and QuestGenerateView.
    """
    provider = get_provider()
    if provider == 'anthropic':
        result = _chat_anthropic(messages, system, tools=None, max_tokens=max_tokens)
    else:
        result = _chat_openai(messages, system, tools=None, max_tokens=max_tokens)
    return result["text"] or ""
