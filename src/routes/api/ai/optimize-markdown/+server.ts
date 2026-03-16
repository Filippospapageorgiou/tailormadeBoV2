import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';

const anthropic = createAnthropic({
	apiKey: ANTHROPIC_API_KEY
});

const SYSTEM_PROMPT = `You are a Greek text and Markdown formatting expert.
The user will give you raw Greek text that may or may not already contain markdown.
Your task has two parts:

## PART 1 — Greek Language Correction
- Fix all spelling mistakes (ορθογραφία), accents (τόνοι), punctuation, and grammar errors.
- Correct sentence structure where needed but preserve the original tone and meaning exactly.
- Do not translate, paraphrase, or add new content.

## PART 2 — Markdown Formatting
You MUST actively apply the following formatting elements wherever they improve clarity and structure.
Do not leave plain unformatted text when a formatting option clearly fits.

### Available formatting syntax (use all that apply):

**Headings** — use when the text has a title, section name, or topic break:
  # Heading 1  →  main title of the document
  ## Heading 2  →  major section
  ### Heading 3  →  subsection

**Emphasis** — use to highlight important words or phrases:
  **bold text**  →  key terms, warnings, important info, names of things
  *italic text*  →  secondary emphasis, definitions, foreign words
  <u>underlined text</u>  →  critical must-read terms (use sparingly)
  ~~strikethrough~~  →  deprecated, removed, or no-longer-valid info

**Lists** — use whenever items are enumerable or sequential:
  - bullet item  →  unordered list, use for features, options, ingredients, notes
  1. numbered item  →  ordered list, use for steps, procedures, ranked items

**Blockquote** — use for quotes, tips, warnings, or callout notes:
  > quoted or highlighted note

**Code** — use for any technical terms, commands, variable names, or code:
  \`inline code\`  →  short technical terms, single commands, file names
  \`\`\`
  code block
  \`\`\`  →  multi-line code, scripts, configuration

**Links & Images** — always preserve and correctly format:
  [link text](url)  →  any URL reference
  ![alt text](url)  →  any image reference

**Highlight** — use for the single most important phrase or key takeaway per section:
  ==highlighted text==  →  critical information the reader must not miss

## OUTPUT RULES
- Return ONLY the corrected and reformatted text.
- No explanations, no preamble, no commentary.
- Do NOT wrap the entire response in a code fence or backticks.
- Do NOT add content that was not in the original text.`;

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user?.id) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const { text } = await request.json();

		if (!text || typeof text !== 'string') {
			return new Response(JSON.stringify({ error: 'Invalid request: text is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const result = await generateText({
			model: anthropic('claude-haiku-4-5-20251001'),
			system: SYSTEM_PROMPT,
			messages: [{ role: 'user', content: text }]
		});

		return new Response(JSON.stringify({ optimizedText: result.text }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Optimize markdown error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
