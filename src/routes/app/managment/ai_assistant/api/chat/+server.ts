// src/routes/app/managment/ai_assistant/api/chat/+server.ts
// Original system prompt + prompt caching (system + tool) + security fixes + anti-cutoff

import { z } from 'zod';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import type { SystemModelMessage } from 'ai';
import { ANTHROPIC_API_KEY, SUPABASE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SYSTEM_PROMPT, TOOL_DESCRIPTIONS } from '$lib/components/ai/Systemprompt';
import type { RequestHandler } from '@sveltejs/kit';

// ─── Anthropic Client ───────────────────────────────────────────────
const anthropic = createAnthropic({
	apiKey: ANTHROPIC_API_KEY
});

// ─── Constants ──────────────────────────────────────────────────────
const MAX_RESULT_ROWS = 200;
const MAX_STEPS = 4;
const MODEL = 'claude-sonnet-4-20250514';

// ─── Cached System Prompt ───────────────────────────────────────────
// Built once, reused on every request. The providerOptions tells the
// Anthropic provider to set a cache_control breakpoint on this block.
// First call pays 25% extra to write the cache; subsequent calls within
// 5 minutes pay only 10% of the base cost to read it.
const CACHED_SYSTEM: SystemModelMessage[] = [
	{
		role: 'system',
		content: SYSTEM_PROMPT,
		providerOptions: {
			anthropic: {
				cacheControl: { type: 'ephemeral' }
			}
		}
	}
];

// ─── Chat Logging ───────────────────────────────────────────────────
async function logChatMessage(
	userId: string,
	orgId: number | null,
	sessionId: string,
	role: 'user' | 'assistant',
	content: string,
	model: string = MODEL
) {
	try {
		await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/ai_chat_logs`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				apikey: SUPABASE_SECRET_KEY,
				Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
				Prefer: 'return=minimal'
			},
			body: JSON.stringify({
				user_id: userId,
				org_id: orgId,
				session_id: sessionId,
				role,
				content,
				model
			})
		});
	} catch (error) {
		console.error('Failed to log chat message:', error);
	}
}

// ─── SQL Validation (regex-based) ───────────────────────────────────
function validateSQL(sql: string): { valid: boolean; error?: string } {
	const normalized = sql.trim().toLowerCase();

	// Must start with SELECT or WITH (CTEs)
	if (!normalized.startsWith('select') && !normalized.startsWith('with')) {
		return { valid: false, error: 'Only SELECT queries are allowed' };
	}

	// Block dangerous keywords with regex
	const forbidden = [
		'insert\\s+into',
		'\\bupdate\\s+\\w',
		'delete\\s+from',
		'\\bdrop\\s+',
		'\\btruncate\\s+',
		'\\balter\\s+',
		'\\bcreate\\s+',
		'\\bgrant\\s+',
		'\\brevoke\\s+',
		'\\bexec\\s*\\(',
		'\\bexecute\\s+'
	];

	for (const pattern of forbidden) {
		if (new RegExp(pattern, 'i').test(normalized)) {
			return { valid: false, error: 'Query contains a forbidden operation' };
		}
	}

	// Block multiple statements (strip string literals first)
	const withoutStrings = normalized.replace(/'[^']*'/g, '');
	const statements = withoutStrings.split(';').filter((s) => s.trim().length > 0);
	if (statements.length > 1) {
		return { valid: false, error: 'Multiple SQL statements are not allowed' };
	}

	return { valid: true };
}

// ─── Query Execution ────────────────────────────────────────────────
async function executeQuery(sql: string, explanation: string) {
	const validation = validateSQL(sql);
	if (!validation.valid) {
		return {
			success: false,
			error: validation.error,
			explanation
		};
	}

	try {
		const response = await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/rpc/execute_readonly_query`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				apikey: SUPABASE_SECRET_KEY,
				Authorization: `Bearer ${SUPABASE_SECRET_KEY}`
			},
			body: JSON.stringify({ query_text: sql })
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Query failed: ${errorText}`);
		}

		const data = await response.json();

		// Handle RPC-level errors
		if (data && typeof data === 'object' && data.error === true) {
			return {
				success: false,
				error: data.message || 'Query execution failed',
				explanation
			};
		}

		// Truncate large result sets
		let resultData = data;
		let truncated = false;

		if (Array.isArray(resultData) && resultData.length > MAX_RESULT_ROWS) {
			resultData = resultData.slice(0, MAX_RESULT_ROWS);
			truncated = true;
		}

		return {
			success: true,
			data: resultData,
			rowCount: Array.isArray(data) ? data.length : 0,
			returnedRows: Array.isArray(resultData) ? resultData.length : 0,
			truncated,
			...(truncated && {
				note: `Results truncated to ${MAX_RESULT_ROWS} rows. Original had ${data.length} rows. Add filters or use aggregations.`
			}),
			explanation
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Query execution failed',
			explanation
		};
	}
}

// ─── Request Handler ────────────────────────────────────────────────
export const POST: RequestHandler = async ({ request, locals }) => {
	// ── Auth enforcement ──
	if (!locals.user?.id) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const { messages, sessionId } = await request.json();

		const userId = locals.user.id;
		const orgId = locals.user.user_metadata?.org_id ?? null;
		const chatSessionId = sessionId || crypto.randomUUID();

		// Extract last user message for logging
		const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
		const userMessageText =
			lastUserMessage?.parts?.find((p: any) => p.type === 'text')?.text ||
			lastUserMessage?.content ||
			'';

		// Log user message
		if (userMessageText) {
			await logChatMessage(userId, orgId, chatSessionId, 'user', userMessageText);
		}

		const result = streamText({
			model: anthropic(MODEL),
			system: CACHED_SYSTEM,
			messages: await convertToModelMessages(messages),
			stopWhen: stepCountIs(MAX_STEPS),
			tools: {
				queryDatabase: tool({
					description: TOOL_DESCRIPTIONS.queryDatabase,
					inputSchema: z.object({
						sql: z.string().describe('The SQL SELECT query to execute'),
						explanation: z.string().describe('Brief explanation of what this query does and why')
					}),
					execute: async ({ sql, explanation }) => executeQuery(sql, explanation),
					providerOptions: {
						anthropic: {
							cacheControl: { type: 'ephemeral' }
						}
					}
				})
			},
			onFinish: async ({ text }) => {
				if (text) {
					await logChatMessage(userId, orgId, chatSessionId, 'assistant', text);
				}
			}
		});

		return result.toUIMessageStreamResponse();
	} catch (error) {
		console.error('AI Assistant error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};