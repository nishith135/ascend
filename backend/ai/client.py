"""
ai/client.py

Gemini-only AI client built on Google's official `google-genai` SDK.

Configuration via Django settings (read from env vars / backend/.env):
  GEMINI_API_KEY  — required
  AI_MODEL        — optional model override (default: DEFAULT_MODEL below)

Public API (used by ai/views.py):
  simple_chat(messages, system, max_tokens)                     -> str
  run_agentic_loop(messages, system, tools, tool_executor, ...) -> (reply, tools_used)
"""

from django.conf import settings
from google import genai
from google.genai import types


DEFAULT_MODEL = 'gemini-flash-lite-latest'
REQUEST_TIMEOUT_MS = 30_000   # fail fast instead of hanging forever
MAX_TOOL_ROUNDS = 5           # safety cap on model <-> tool back-and-forth
# Gemini "thinking" tokens count against the output limit, so give headroom
# or the visible answer can come back empty.
OUTPUT_TOKEN_HEADROOM = 4


def get_model() -> str:
    return (getattr(settings, 'AI_MODEL', '') or '').strip() or DEFAULT_MODEL


def _get_client() -> genai.Client:
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set. Add it to backend/.env.")
    return genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(timeout=REQUEST_TIMEOUT_MS),
    )


# ─── Format Conversion ────────────────────────────────────────────────────────

def _to_gemini_schema(schema: dict) -> types.Schema:
    """Convert a JSON-schema fragment (as used in ai/tools.py) to a Gemini Schema."""
    kwargs = {'type': schema.get('type', 'string').upper()}
    if 'description' in schema:
        kwargs['description'] = schema['description']
    if 'properties' in schema:
        kwargs['properties'] = {
            name: _to_gemini_schema(prop) for name, prop in schema['properties'].items()
        }
    if schema.get('required'):
        kwargs['required'] = schema['required']
    return types.Schema(**kwargs)


def _to_gemini_tools(tools: list) -> list:
    """Convert tool definitions ({name, description, input_schema}) to Gemini tools."""
    declarations = []
    for tool in tools:
        input_schema = tool.get('input_schema', {})
        declaration = {
            'name': tool['name'],
            'description': tool.get('description', ''),
        }
        # Gemini rejects an OBJECT schema with no properties, so omit it entirely.
        if input_schema.get('properties'):
            declaration['parameters'] = _to_gemini_schema(input_schema)
        declarations.append(types.FunctionDeclaration(**declaration))
    return [types.Tool(function_declarations=declarations)]


def _to_gemini_contents(messages: list) -> list:
    """Convert [{'role': 'user'|'assistant', 'content': str}] to Gemini Content objects."""
    contents = []
    for msg in messages:
        role = 'model' if msg['role'] == 'assistant' else 'user'
        contents.append(types.Content(role=role, parts=[types.Part(text=msg['content'])]))
    return contents


def _generate(contents: list, system: str, tools: list, max_tokens: int):
    config = types.GenerateContentConfig(
        system_instruction=system,
        max_output_tokens=max_tokens * OUTPUT_TOKEN_HEADROOM,
        tools=_to_gemini_tools(tools) if tools else None,
        # We run the tool loop ourselves so tool calls hit our Django handlers.
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    )
    client = _get_client()  # keep a reference: a temporary is closed on garbage collection
    return client.models.generate_content(
        model=get_model(), contents=contents, config=config,
    )


# ─── Public API ───────────────────────────────────────────────────────────────

def simple_chat(messages: list, system: str, max_tokens: int = 1024) -> str:
    """Single-turn chat without tool calling."""
    response = _generate(_to_gemini_contents(messages), system, None, max_tokens)
    return response.text or ""


def run_agentic_loop(
    messages: list,
    system: str,
    tools: list,
    tool_executor,           # callable(name: str, input: dict) -> dict
    max_tokens: int = 1024,
) -> tuple[str, list]:
    """
    Run the model until it stops calling tools.

    Returns:
        (reply_text, tools_used_names)
    """
    contents = _to_gemini_contents(messages)
    tools_used = []

    for _ in range(MAX_TOOL_ROUNDS):
        response = _generate(contents, system, tools, max_tokens)
        calls = response.function_calls or []
        if not calls:
            return response.text or "", list(set(tools_used))

        # Keep the model's own turn verbatim (it carries Gemini's thought signatures).
        contents.append(response.candidates[0].content)

        result_parts = []
        for call in calls:
            tools_used.append(call.name)
            result = tool_executor(call.name, dict(call.args or {}))
            result_parts.append(
                types.Part.from_function_response(name=call.name, response={'result': result})
            )
        contents.append(types.Content(role='user', parts=result_parts))

    raise RuntimeError(f"Model kept calling tools after {MAX_TOOL_ROUNDS} rounds.")
