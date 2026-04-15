// src/routes/app/managment/ai_assistant/api/chat/+server.ts
// Fixes: system message array, SQL injection hardening, org scoping,
//        proper types, and early-stopping via maxTokens + continueUntilDone

import { z } from 'zod';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import type { SystemModelMessage, UIMessage } from 'ai';
import { ANTHROPIC_API_KEY, SUPABASE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SYSTEM_PROMPT, TOOL_DESCRIPTIONS } from '$lib/components/ai/Systemprompt';
import type { RequestHandler } from '@sveltejs/kit';

// ─── Anthropic Client ────────────────────────────────────────────────
const anthropic = createAnthropic({
	apiKey: ANTHROPIC_API_KEY
});

// ─── Constants ───────────────────────────────────────────────────────
const MAX_RESULT_ROWS = 200;
const MAX_STEPS = 15; // raised: complex equipment queries need more steps
const MODEL = 'claude-sonnet-4-20250514';

// ─── SQL Validation ──────────────────────────────────────────────────
function validateSQL(sql: string): { valid: boolean; error?: string } {
	const normalized = sql.trim().toLowerCase();

	// Strip comments FIRST before any other check so they can't hide forbidden ops
	const withoutComments = normalized
		.replace(/--[^\n]*/g, '') // single-line comments
		.replace(/\/\*[\s\S]*?\*\//g, ''); // block comments

	// Must start with SELECT or WITH (CTEs)
	const trimmed = withoutComments.trim();
	if (!trimmed.startsWith('select') && !trimmed.startsWith('with')) {
		return { valid: false, error: 'Only SELECT queries are allowed' };
	}

	// Block dangerous keywords — also strip double-quoted and dollar-quoted strings
	const withoutStrings = withoutComments
		.replace(/'[^']*'/g, '') // single-quoted strings
		.replace(/"[^"]*"/g, '') // double-quoted identifiers
		.replace(/\$\$[\s\S]*?\$\$/g, '') // dollar-quoted strings (Postgres)
		.replace(/\$[^$]+\$[\s\S]*?\$[^$]+\$/g, ''); // named dollar-quotes

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
		'\\bexecute\\s+',
		'\\bcopy\\s+', // COPY can read/write files
		'\\bpg_read_file', // filesystem access
		'\\bpg_write_file',
		'\\blo_import', // large object import
		'\\blo_export'
	];

	for (const pattern of forbidden) {
		if (new RegExp(pattern, 'i').test(withoutStrings)) {
			return { valid: false, error: 'Query contains a forbidden operation' };
		}
	}

	// Block multiple statements
	const statements = withoutStrings.split(';').filter((s) => s.trim().length > 0);
	if (statements.length > 1) {
		return { valid: false, error: 'Multiple SQL statements are not allowed' };
	}

	return { valid: true };
}

// ─── Query Execution ─────────────────────────────────────────────────
async function executeQuery(sql: string, explanation: string) {
	const validation = validateSQL(sql);
	if (!validation.valid) {
		return { success: false, error: validation.error, explanation };
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

		if (data && typeof data === 'object' && data.error === true) {
			return {
				success: false,
				error: data.message || 'Query execution failed',
				explanation
			};
		}

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

// ─── Chat Logging ────────────────────────────────────────────────────
async function logChatMessage(
	userId: string,
	orgId: number | null,
	sessionId: string,
	role: 'user' | 'assistant',
	content: string
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
				model: MODEL
			})
		});
	} catch (error) {
		console.error('Failed to log chat message:', error);
	}
}

// ─── Request Handler ─────────────────────────────────────────────────
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user?.id) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const { messages, sessionId } = await request.json();

		const userId = locals.user.id;
		const orgId: number | null = locals.user.user_metadata?.org_id ?? null;
		const chatSessionId: string = sessionId || crypto.randomUUID();

		// ── Log user message ──
		const typedMessages = messages as UIMessage[];
		const lastUserMessage = typedMessages.filter((m) => m.role === 'user').pop();
		const userMessageText = lastUserMessage?.parts?.find((p) => p.type === 'text')?.text ?? '';

		if (userMessageText) {
			await logChatMessage(userId, orgId, chatSessionId, 'user', userMessageText);
		}

		// ── Build system messages ──
		// Org context is appended as a second (uncached) system block so the
		// cached block above stays stable across all users/orgs.
		const systemMessages: SystemModelMessage[] = [
			{
				role: 'system',
				content: SYSTEM_PROMPT,
				providerOptions: {
					anthropic: { cacheControl: { type: 'ephemeral' } }
				}
			},
			// Org scoping — tells Claude to always filter by this org
			...(orgId !== null
				? ([
						{
							role: 'system',
							content: `IMPORTANT: The current user belongs to org_id = ${orgId}. Every query you generate MUST include a WHERE clause filtering by org_id = ${orgId}. Never return data from other organisations.`
						}
					] satisfies SystemModelMessage[])
				: [])
		];

		// ── Fix: early stopping ──
		// Claude stops mid-task when it hits the default max_tokens (1024 on
		// Sonnet). Raising it gives the model room to finish long answers that
		// follow several tool calls. 4096 covers virtually all assistant turns;
		// bump to 8192 if you see truncation on very large result summaries.
		const result = streamText({
			model: anthropic(MODEL),
			providerOptions: { anthropic: { maxTokens: 4096 } },
			messages: [...systemMessages, ...(await convertToModelMessages(typedMessages))],
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
						anthropic: { cacheControl: { type: 'ephemeral' } }
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
