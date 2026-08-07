import 'dotenv/config';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';

export function claudeEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Thin wrapper over the Messages API. Returns the concatenated text blocks.
 * Note: no temperature is sent. Newer models reject it as a deprecated
 * parameter, and the default sampling is fine for everything here.
 */
export async function askClaude({ system, messages, maxTokens = 700 }) {
  if (!claudeEnabled()) throw new Error('ANTHROPIC_API_KEY is not set');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Claude API ${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = await response.json();
  return payload.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

/** Ask Claude for JSON and parse it, tolerating stray code fences. */
export async function askClaudeForJson(options) {
  const raw = await askClaude(options);
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (start === -1 || end === -1) throw new Error('Claude did not return JSON');
  return JSON.parse(cleaned.slice(start, end + 1));
}