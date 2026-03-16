<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Toggle } from '$lib/components/ui/toggle';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Shimmer } from '$lib/components/ai-elements/shimmer';
	import {
		Bold,
		Italic,
		Underline,
		Strikethrough,
		Heading1,
		Heading2,
		Heading3,
		List,
		ListOrdered,
		Quote,
		Code,
		Link,
		Image,
		Highlighter,
		FileCode,
		Eye,
		Pencil,
		Sparkles,
		Loader2
	} from 'lucide-svelte';

	// Props interface
	interface Props {
		value?: string;
		placeholder?: string;
		minHeight?: string;
		maxHeight?: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		value = $bindable(''),
		placeholder = 'Write your instructions here...',
		minHeight = '300px',
		maxHeight = '600px',
		disabled = false,
		class: className = ''
	}: Props = $props();

	// State
	let mode = $state<'edit' | 'preview'>('edit');
	let textareaRef = $state<HTMLTextAreaElement | null>(null);
	let linkDialogOpen = $state(false);
	let imageDialogOpen = $state(false);
	let linkUrl = $state('');
	let linkText = $state('');
	let imageUrl = $state('');
	let imageAlt = $state('');
	let isOptimizing = $state(false);

	// Configure marked for highlight support (==text==)
	marked.use({
		extensions: [
			{
				name: 'highlight',
				level: 'inline',
				start(src: string) {
					return src.match(/==/)?.index;
				},
				tokenizer(src: string) {
					const match = /^==([^=]+)==/.exec(src);
					if (match) {
						return {
							type: 'highlight',
							raw: match[0],
							text: match[1]
						};
					}
					return undefined;
				},
				renderer(token) {
					return `<mark>${(token as any).text}</mark>`;
				}
			}
		]
	});

	// Parse and sanitize markdown
	function parseMarkdown(content: string): string {
		const html = marked.parse(content, { async: false }) as string;
		return DOMPurify.sanitize(html);
	}

	// Derived preview HTML
	const previewHtml = $derived(parseMarkdown(value));

	// Text manipulation helpers
	function wrapSelection(before: string, after: string) {
		if (!textareaRef || disabled) return;

		const start = textareaRef.selectionStart;
		const end = textareaRef.selectionEnd;
		const text = textareaRef.value;
		const selected = text.substring(start, end);

		const newText = text.substring(0, start) + before + selected + after + text.substring(end);
		value = newText;

		// Restore cursor position after Svelte updates the DOM
		requestAnimationFrame(() => {
			if (textareaRef) {
				textareaRef.selectionStart = start + before.length;
				textareaRef.selectionEnd = end + before.length;
				textareaRef.focus();
			}
		});
	}

	function insertAtCursor(text: string) {
		if (!textareaRef || disabled) return;

		const start = textareaRef.selectionStart;
		const before = textareaRef.value.substring(0, start);
		const after = textareaRef.value.substring(start);

		value = before + text + after;

		requestAnimationFrame(() => {
			if (textareaRef) {
				textareaRef.selectionStart = textareaRef.selectionEnd = start + text.length;
				textareaRef.focus();
			}
		});
	}

	function insertAtLineStart(prefix: string) {
		if (!textareaRef || disabled) return;

		const start = textareaRef.selectionStart;
		const text = textareaRef.value;

		// Find the start of the current line
		let lineStart = start;
		while (lineStart > 0 && text[lineStart - 1] !== '\n') {
			lineStart--;
		}

		const before = text.substring(0, lineStart);
		const after = text.substring(lineStart);

		value = before + prefix + after;

		requestAnimationFrame(() => {
			if (textareaRef) {
				textareaRef.selectionStart = textareaRef.selectionEnd = start + prefix.length;
				textareaRef.focus();
			}
		});
	}

	// Formatting functions
	function applyBold() {
		wrapSelection('**', '**');
	}

	function applyItalic() {
		wrapSelection('*', '*');
	}

	function applyUnderline() {
		wrapSelection('<u>', '</u>');
	}

	function applyStrikethrough() {
		wrapSelection('~~', '~~');
	}

	function applyHeading(level: 1 | 2 | 3) {
		const prefix = '#'.repeat(level) + ' ';
		insertAtLineStart(prefix);
	}

	function applyBulletList() {
		insertAtLineStart('- ');
	}

	function applyNumberedList() {
		insertAtLineStart('1. ');
	}

	function applyBlockquote() {
		insertAtLineStart('> ');
	}

	function applyInlineCode() {
		wrapSelection('`', '`');
	}

	function applyCodeBlock() {
		wrapSelection('\n```\n', '\n```\n');
	}

	function applyHighlight() {
		wrapSelection('==', '==');
	}

	function openLinkDialog() {
		if (disabled) return;
		if (textareaRef) {
			const start = textareaRef.selectionStart;
			const end = textareaRef.selectionEnd;
			linkText = textareaRef.value.substring(start, end) || '';
		}
		linkUrl = '';
		linkDialogOpen = true;
	}

	function insertLink() {
		const markdown = `[${linkText || 'link'}](${linkUrl})`;
		insertAtCursor(markdown);
		linkDialogOpen = false;
		linkUrl = '';
		linkText = '';
	}

	function openImageDialog() {
		if (disabled) return;
		imageUrl = '';
		imageAlt = '';
		imageDialogOpen = true;
	}

	function insertImage() {
		const markdown = `![${imageAlt || 'image'}](${imageUrl})`;
		insertAtCursor(markdown);
		imageDialogOpen = false;
		imageUrl = '';
		imageAlt = '';
	}

	async function optimizeWithAI() {
		if (!value.trim() || isOptimizing || disabled) return;
		isOptimizing = true;
		try {
			const response = await fetch('/api/ai/optimize-markdown', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: value })
			});
			if (!response.ok) throw new Error(`Request failed: ${response.status}`);
			const data = await response.json();
			value = data.optimizedText;
		} catch (error) {
			console.error('AI optimize error:', error);
		} finally {
			isOptimizing = false;
		}
	}

	// Keyboard shortcut handler
	function handleKeydown(event: KeyboardEvent) {
		if (mode !== 'edit' || disabled) return;

		const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
		const modKey = isMac ? event.metaKey : event.ctrlKey;

		if (modKey) {
			switch (event.key.toLowerCase()) {
				case 'b':
					event.preventDefault();
					applyBold();
					break;
				case 'i':
					event.preventDefault();
					applyItalic();
					break;
				case 'u':
					event.preventDefault();
					applyUnderline();
					break;
				case 'k':
					event.preventDefault();
					openLinkDialog();
					break;
				case 'h':
					event.preventDefault();
					applyHighlight();
					break;
				case '1':
					event.preventDefault();
					applyHeading(1);
					break;
				case '2':
					event.preventDefault();
					applyHeading(2);
					break;
				case '3':
					event.preventDefault();
					applyHeading(3);
					break;
				case '`':
					event.preventDefault();
					applyInlineCode();
					break;
			}

			// Handle Ctrl+Shift combinations
			if (event.shiftKey) {
				switch (event.key.toLowerCase()) {
					case 's':
						event.preventDefault();
						applyStrikethrough();
						break;
					case 'u':
						event.preventDefault();
						applyBulletList();
						break;
					case 'o':
						event.preventDefault();
						applyNumberedList();
						break;
					case 'q':
						event.preventDefault();
						applyBlockquote();
						break;
					case 'c':
						event.preventDefault();
						applyCodeBlock();
						break;
					case 'i':
						event.preventDefault();
						openImageDialog();
						break;
				}
			}
		}
	}

	// Get keyboard shortcut display text
	function getShortcut(shortcut: string): string {
		const isMac =
			typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
		return shortcut.replace('Ctrl', isMac ? '⌘' : 'Ctrl');
	}

	// Toolbar button definitions
	const toolbarButtons = [
		{ action: applyBold, icon: Bold, label: 'Bold', shortcut: 'Ctrl+B' },
		{ action: applyItalic, icon: Italic, label: 'Italic', shortcut: 'Ctrl+I' },
		{ action: applyUnderline, icon: Underline, label: 'Underline', shortcut: 'Ctrl+U' },
		{
			action: applyStrikethrough,
			icon: Strikethrough,
			label: 'Strikethrough',
			shortcut: 'Ctrl+Shift+S'
		},
		{ separator: true },
		{ action: () => applyHeading(1), icon: Heading1, label: 'Heading 1', shortcut: 'Ctrl+1' },
		{ action: () => applyHeading(2), icon: Heading2, label: 'Heading 2', shortcut: 'Ctrl+2' },
		{ action: () => applyHeading(3), icon: Heading3, label: 'Heading 3', shortcut: 'Ctrl+3' },
		{ separator: true },
		{ action: applyBulletList, icon: List, label: 'Bullet List', shortcut: 'Ctrl+Shift+U' },
		{
			action: applyNumberedList,
			icon: ListOrdered,
			label: 'Numbered List',
			shortcut: 'Ctrl+Shift+O'
		},
		{ action: applyBlockquote, icon: Quote, label: 'Blockquote', shortcut: 'Ctrl+Shift+Q' },
		{ separator: true },
		{ action: applyInlineCode, icon: Code, label: 'Inline Code', shortcut: 'Ctrl+`' },
		{ action: applyCodeBlock, icon: FileCode, label: 'Code Block', shortcut: 'Ctrl+Shift+C' },
		{ separator: true },
		{ action: openLinkDialog, icon: Link, label: 'Insert Link', shortcut: 'Ctrl+K' },
		{ action: openImageDialog, icon: Image, label: 'Insert Image', shortcut: 'Ctrl+Shift+I' },
		{ action: applyHighlight, icon: Highlighter, label: 'Highlight', shortcut: 'Ctrl+H' }
	] as const;
</script>

<div class={cn('overflow-hidden rounded-lg border border-border bg-background', className)}>
	<!-- Header with mode toggle -->
	<div class="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
		<span class="text-sm font-medium text-foreground">Instructions Editor</span>
		<ToggleGroup
			type="single"
			value={mode}
			onValueChange={(v) => v && (mode = v as 'edit' | 'preview')}
		>
			<ToggleGroupItem value="edit" aria-label="Edit mode" class="gap-1.5 text-xs">
				<Pencil class="h-3.5 w-3.5" />
				Edit
			</ToggleGroupItem>
			<ToggleGroupItem value="preview" aria-label="Preview mode" class="gap-1.5 text-xs">
				<Eye class="h-3.5 w-3.5" />
				Preview
			</ToggleGroupItem>
		</ToggleGroup>
	</div>

	<!-- Toolbar (only visible in edit mode) -->
	{#if mode === 'edit'}
		<div class="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5">
			{#each toolbarButtons as button}
				{#if 'separator' in button && button.separator}
					<Separator orientation="vertical" class="mx-1 h-6" />
				{:else if 'action' in button}
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Toggle
								aria-label={button.label}
								size="sm"
								class="h-8 w-8 p-0"
								{disabled}
								onclick={() => button.action()}
							>
								<button.icon class="h-4 w-4" />
							</Toggle>
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom" class="flex items-center gap-2">
							<span>{button.label}</span>
							<kbd
								class="pointer-events-none inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground select-none"
							>
								{getShortcut(button.shortcut)}
							</kbd>
						</Tooltip.Content>
					</Tooltip.Root>
				{/if}
			{/each}
			<div class="ml-auto">
				<Separator orientation="vertical" class="mr-2 inline-block h-6" />
				<Button
					variant="outline"
					size="sm"
					class="h-8 gap-1.5 text-xs"
					disabled={disabled || isOptimizing}
					onclick={optimizeWithAI}
				>
					{#if isOptimizing}
						<Loader2 class="h-3.5 w-3.5 animate-spin-clockwise repeat-infinite" />
					{:else}
						<Sparkles class="h-3.5 w-3.5" />
					{/if}
					AI Βελτίωση
				</Button>
			</div>
		</div>
	{/if}

	<!-- Editor / Preview area -->
	<div class="relative" style="min-height: {minHeight}; max-height: {maxHeight};">
		{#if mode === 'edit'}
			<textarea
				bind:this={textareaRef}
				bind:value
				{placeholder}
				disabled={disabled || isOptimizing}
				onkeydown={handleKeydown}
				class={cn(
					'h-full w-full resize-none border-0 bg-background p-4 text-foreground',
					'placeholder:text-muted-foreground focus:ring-0 focus:outline-none',
					'font-mono text-sm leading-relaxed',
					(disabled || isOptimizing) && 'cursor-not-allowed opacity-50'
				)}
				style="min-height: {minHeight}; max-height: {maxHeight};"
				aria-label="Markdown editor"
			></textarea>
			{#if isOptimizing}
				<div
					class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-[2px]"
					aria-label="AI optimizing"
				>
					<Shimmer
						as="span"
						duration={1.5}
						spread={3}
						content_length={20}
						class="text-base font-medium"
					>
						AI Βελτίωση σε εξέλιξη...
					</Shimmer>
					<div class="flex gap-1.5">
						{#each [0, 1, 2] as i}
							<span
								class="h-1.5 w-1.5 animate-bouncing rounded-full bg-muted-foreground/60 repeat-infinite"
								style="animation-delay: {i * 150}ms"
							></span>
						{/each}
					</div>
				</div>
			{/if}
		{:else}
			<div
				class="preview-content overflow-auto p-4"
				style="min-height: {minHeight}; max-height: {maxHeight};"
				role="document"
				aria-label="Markdown preview"
			>
				{#if value.trim()}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html previewHtml}
				{:else}
					<p class="text-muted-foreground italic">Nothing to preview</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Link Dialog -->
<Dialog.Root bind:open={linkDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Insert Link</Dialog.Title>
			<Dialog.Description>Add a hyperlink to your content.</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="link-text">Link Text</Label>
				<Input id="link-text" bind:value={linkText} placeholder="Enter link text" />
			</div>
			<div class="grid gap-2">
				<Label for="link-url">URL</Label>
				<Input id="link-url" bind:value={linkUrl} placeholder="https://example.com" type="url" />
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (linkDialogOpen = false)}>Cancel</Button>
			<Button onclick={insertLink} disabled={!linkUrl}>Insert Link</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Image Dialog -->
<Dialog.Root bind:open={imageDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Insert Image</Dialog.Title>
			<Dialog.Description>Add an image to your content.</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="image-url">Image URL</Label>
				<Input
					id="image-url"
					bind:value={imageUrl}
					placeholder="https://example.com/image.png"
					type="url"
				/>
			</div>
			<div class="grid gap-2">
				<Label for="image-alt">Alt Text</Label>
				<Input id="image-alt" bind:value={imageAlt} placeholder="Describe the image" />
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (imageDialogOpen = false)}>Cancel</Button>
			<Button onclick={insertImage} disabled={!imageUrl}>Insert Image</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* Preview content styling */
	.preview-content :global(h1) {
		font-size: 1.875rem;
		line-height: 2.25rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(h2) {
		font-size: 1.5rem;
		line-height: 2rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(h3) {
		font-size: 1.25rem;
		line-height: 1.75rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(p) {
		margin-bottom: 1rem;
		line-height: 1.625;
		color: hsl(var(--foreground));
	}

	.preview-content :global(ul) {
		list-style-type: disc;
		list-style-position: inside;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(ol) {
		list-style-type: decimal;
		list-style-position: inside;
		margin-bottom: 1rem;
		color: hsl(var(--foreground));
	}

	.preview-content :global(li) {
		margin-bottom: 0.25rem;
	}

	.preview-content :global(blockquote) {
		border-left-width: 4px;
		border-color: hsl(var(--muted-foreground));
		padding-left: 1rem;
		font-style: italic;
		margin-bottom: 1rem;
		color: hsl(var(--muted-foreground));
	}

	.preview-content :global(code) {
		background-color: hsl(var(--muted));
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
		color: hsl(var(--foreground));
	}

	.preview-content :global(pre) {
		background-color: hsl(var(--muted));
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-bottom: 1rem;
	}

	.preview-content :global(pre code) {
		background-color: transparent;
		padding: 0;
		border-radius: 0;
	}

	.preview-content :global(mark) {
		background-color: rgb(254 240 138);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
	}

	:global(.dark) .preview-content :global(mark) {
		background-color: rgb(133 77 14);
		color: rgb(254 243 199);
	}

	.preview-content :global(a) {
		color: hsl(var(--primary));
		text-decoration: underline;
	}

	.preview-content :global(a:hover) {
		opacity: 0.8;
	}

	.preview-content :global(img) {
		max-width: 100%;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.preview-content :global(u) {
		text-decoration: underline;
	}

	.preview-content :global(del),
	.preview-content :global(s) {
		text-decoration: line-through;
	}

	.preview-content :global(hr) {
		border: none;
		border-top: 1px solid hsl(var(--border));
		margin: 1.5rem 0;
	}

	.preview-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
	}

	.preview-content :global(th),
	.preview-content :global(td) {
		border: 1px solid hsl(var(--border));
		padding: 0.5rem;
		text-align: left;
	}

	.preview-content :global(th) {
		background-color: hsl(var(--muted));
		font-weight: 600;
	}
</style>
