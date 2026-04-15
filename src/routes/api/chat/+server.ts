import { streamText, type UIMessage, convertToModelMessages, createGateway } from 'ai';

import { AI_GATEWAY_API_KEY } from '$env/static/private';

const gateway = createGateway({
	apiKey: AI_GATEWAY_API_KEY
});

export async function POST({ request }) {
	const { messages }: { messages: UIMessage[] } = await request.json();

	const result = streamText({
		model: gateway('anthropic/claude-haiku-4-5'),
		messages: await convertToModelMessages(messages)
	});

	return result.toUIMessageStreamResponse();
}
