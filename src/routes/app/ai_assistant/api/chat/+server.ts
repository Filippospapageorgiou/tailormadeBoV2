// src/routes/api/ai-assistant/+server.ts
import { z } from 'zod';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { ANTHROPIC_API_KEY, SUPABASE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SYSTEM_PROMPT } from '$lib/components/ai/Systemprompt';
import type { RequestHandler } from '@sveltejs/kit';

const anthropic = createAnthropic({
	apiKey: ANTHROPIC_API_KEY
});

// Helper: Log chat message to database
async function logChatMessage(
	userId: string,
	orgId: number | null,
	sessionId: string,
	role: 'user' | 'assistant',
	content: string,
	model: string = 'claude-sonnet-4-20250514'
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
		// Don't throw - logging shouldn't break the chat
	}
}

// SQL validation
function validateSQL(sql: string): { valid: boolean; error?: string } {
	const normalizedSQL = sql.trim().toLowerCase();

	const forbiddenStarts = [
		'insert',
		'update',
		'delete',
		'drop',
		'truncate',
		'alter',
		'create',
		'grant',
		'revoke'
	];
	for (const keyword of forbiddenStarts) {
		if (normalizedSQL.startsWith(keyword)) {
			return {
				valid: false,
				error: `${keyword.toUpperCase()} statements are not allowed`
			};
		}
	}

	const forbiddenAnywhere = [
		'insert into',
		'update ',
		'delete from',
		'drop ',
		'truncate ',
		'alter ',
		'create ',
		'; drop',
		'; delete',
		'; update',
		'; insert'
	];
	for (const keyword of forbiddenAnywhere) {
		if (normalizedSQL.includes(keyword)) {
			return { valid: false, error: `Query contains forbidden operation: ${keyword}` };
		}
	}

	if (!normalizedSQL.startsWith('select') && !normalizedSQL.startsWith('with')) {
		return { valid: false, error: 'Only SELECT queries are allowed' };
	}

	return { valid: true };
}

// Tool execution function
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

		if (data && typeof data === 'object' && data.error === true) {
			return {
				success: false,
				error: data.message || 'Query execution failed',
				explanation
			};
		}

		return {
			success: true,
			data,
			rowCount: Array.isArray(data) ? data.length : 0,
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

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { messages, sessionId } = await request.json();

		// Get user info from locals (assumes you have auth middleware)
		const userId = locals.user?.id;
		const orgId = locals.user?.user_metadata.org_id;

		const chatSessionId = sessionId || crypto.randomUUID();

		// Get the last user message
		const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();

		// Extract text from parts array (Vercel AI SDK format)
		const userMessageText =
			lastUserMessage?.parts?.find((p: any) => p.type === 'text')?.text ||
			lastUserMessage?.content ||
			'';

		// Log user message
		if (userId && userMessageText) {
			await logChatMessage(userId, orgId, chatSessionId, 'user', userMessageText);
		}

		const result = streamText({
			model: anthropic('claude-sonnet-4-20250514'),
			system: SYSTEM_PROMPT,
			messages: await convertToModelMessages(messages),
			stopWhen: stepCountIs(5),
			headers: {
				'anthropic-beta': 'prompt-caching-2024-07-31'
			},
			tools: {
				queryDatabase: tool({
					description: `Execute a read-only SQL query against the TailorMade database. Only SELECT statements are allowed.`,
					inputSchema: z.object({
						sql: z.string().describe('The SQL SELECT query to execute'),
						explanation: z.string().describe('Brief explanation of what this query does and why')
					}),
					execute: async ({ sql, explanation }) => executeQuery(sql, explanation)
				})
			},
			// Callback when stream finishes - log assistant response
			onFinish: async ({ text }) => {
				if (userId && text) {
					await logChatMessage(userId, orgId, chatSessionId, 'assistant', text);
				}
			}
		});

		// Return response with session ID for client to track
		return result.toUIMessageStreamResponse();
	} catch (error) {
		console.error('AI Assistant error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
