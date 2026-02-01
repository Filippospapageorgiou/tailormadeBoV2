<script lang="ts">
	import { authenticatedAccess } from '$lib/api/ai/data.remote';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import { Chat } from '@ai-sdk/svelte';
	import { DefaultChatTransport } from 'ai';
	import { toast } from 'svelte-sonner';
	import type { UIMessage } from 'ai';
	import Loader from '$lib/components/ai-elements/loader/Loader.svelte';
	import { Shimmer } from '$lib/components/ai-elements/shimmer/index.js';

	import {
		Message,
		MessageContent,
		MessageResponse,
		MessageToolbar,
		MessageActions,
		MessageAction
	} from '$lib/components/ai-elements/new-message';

	import {
		PromptInput,
		PromptInputBody,
		PromptInputToolbar,
		PromptInputTextarea,
		PromptInputSubmit
	} from '$lib/components/ai-elements/prompt-input';
	import {
		Tool,
		ToolHeader,
		ToolContent,
		ToolInput,
		ToolOutput
	} from '$lib/components/ai-elements/tool';

	import { Suggestion } from '$lib/components/ai-elements/suggestion/index.js';

	import Copy from 'lucide-svelte/icons/copy';
	import RefreshCcw from 'lucide-svelte/icons/refresh-ccw';
	import ThumbsUp from 'lucide-svelte/icons/thumbs-up';
	import ThumbsDown from 'lucide-svelte/icons/thumbs-down';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Users from 'lucide-svelte/icons/users';
	import Calendar from 'lucide-svelte/icons/calendar';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import ArrowUp from 'lucide-svelte/icons/arrow-up';
	import { getProfileContext } from '$lib/stores/profile.svelte';
	import { BotIcon } from 'lucide-svelte';

	interface TextPart {
		type: 'text';
		text: string;
	}

	function isTextPart(part: unknown): part is TextPart {
		return (
			typeof part === 'object' &&
			part !== null &&
			'type' in part &&
			(part as { type: string }).type === 'text' &&
			'text' in part
		);
	}

	let auth = authenticatedAccess();

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});

	let profile = getProfileContext();
	let input = $state('');

	const chat = new Chat({
		transport: new DefaultChatTransport({
			api: './ai_assistant/api/chat'
		})
	});

	const suggestions = [
		{
			icon: TrendingUp,
			text: 'Πωλήσεις εβδομάδας',
			query: 'Ποιες είναι οι συνολικές πωλήσεις σε όλα τα καταστήματα αυτή την εβδομάδα;'
		},
		{
			icon: Users,
			text: 'Λίστα προσωπικού',
			query: 'Δείξε μου μια λίστα με όλο το προσωπικό, τους ρόλους και τους οργανισμούς τους'
		},
		{
			icon: BarChart3,
			text: 'Κορυφαία καταστήματα',
			query: 'Ποια καταστήματα έχουν τις υψηλότερες πωλήσεις αυτόν τον μήνα;'
		},
		{
			icon: Calendar,
			text: 'Πρόγραμμα σήμερα',
			query: 'Δείξε μου τα σημερινά προγράμματα προσωπικού σε όλους τους οργανισμούς'
		},
		{
			icon: DollarSign,
			text: 'Πρόσφατα έξοδα',
			query: 'Ποια είναι τα πρόσφατα έξοδα που έχουν καταγραφεί στο σύστημα;'
		}
	];

	function handleSubmit(data: { text: string }) {
		if (!data.text.trim()) return;
		chat.sendMessage({ text: data.text });
		input = '';
	}

	function handleSuggestionClick(query: string) {
		chat.sendMessage({ text: query });
	}

	function handleCopy(content: string) {
		navigator.clipboard.writeText(content);
		toast.success('Αντιγράφηκε στο πρόχειρο');
	}

	function handleRegenerate() {
		chat.regenerate();
		toast.info('Επαναδημιουργία απάντησης...');
	}

	function handleFeedback(type: 'up' | 'down', messageId: string) {
		toast.success(`Η αξιολόγηση καταγράφηκε: ${type === 'up' ? '👍' : '👎'}`);
	}

	function getToolState(part: any) {
		if (part.result) return 'output-available';
		if (part.state === 'result') return 'output-available';
		if (part.state === 'partial-call') return 'input-streaming';
		return 'input-available';
	}

	function getMessageText(message: UIMessage): string {
		return (message.parts as unknown[])
			.filter((p): p is TextPart => isTextPart(p))
			.map((p) => p.text)
			.join('\n');
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function asSqlTool(part: any) {
		return {
			input: part.input as { sql: string; explanation: string },
			output: part.output as { success: boolean; error?: string; rowCount: number } | undefined,
			state: getToolState(part)
		};
	}

	let isLoading = $derived(chat.status === 'streaming' || chat.status === 'submitted');
	let isStreaming = $derived(chat.status === 'streaming');
	let firstName = $derived(profile?.username?.split(' ')[0] ?? '');
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="flex h-full flex-col bg-background">
		{#if chat.messages.length === 0}
			<!-- Empty state - Claude style with your colors -->
			<div class="flex flex-1 flex-col items-center justify-center px-4">
				<!-- Greeting with Shimmer -->
				<div class="mb-10 flex flex-col items-center gap-4 text-center">
					<!-- Animated Icon -->
					<div class="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
						<Sparkles class="size-8 text-primary" />
					</div>

					<div class="space-y-2">
						<h1 class="text-3xl font-medium text-muted-foreground">
							Καλησπέρα{firstName ? `, ${firstName}` : ''}
						</h1>

						<Shimmer content_length={20}>
							{#snippet children()}
								<span class="text-lg"
									>Είμαι ο <span class="font-bold tracking-wide text-primary">MAX</span></span
								>
							{/snippet}
						</Shimmer>

						<Shimmer content_length={50}>
							{#snippet children()}
								AI βοηθός της TailorMade
							{/snippet}
						</Shimmer>

						<Shimmer content_length={70}>
							{#snippet children()}
								Μπορώ να αναλύσω πωλήσεις, προσωπικό, προγράμματα και έξοδα
							{/snippet}
						</Shimmer>
					</div>
				</div>

				<!-- Centered Input -->
				<div class="w-full max-w-2xl">
					<PromptInput
						onSubmit={(data) => handleSubmit({ text: data.text! })}
						class="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg"
					>
						<PromptInputBody>
							<PromptInputTextarea
								bind:value={input}
								placeholder="Γράψε / για εντολές"
								class="min-h-[52px] resize-none border-0 bg-transparent px-4 py-4 text-foreground placeholder:text-muted-foreground focus:ring-0"
							/>
						</PromptInputBody>
						<PromptInputToolbar class="flex items-center justify-between px-3 pb-3">
							<div class="flex w-full items-center justify-between">
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<img
										src="/anthropic.svg"
										class="h-4 w-4 dark:box-content dark:rounded-sm dark:bg-white dark:p-0.5"
										alt=""
									/>
									<span>claude-sonnet-4</span>
								</div>
								<PromptInputSubmit
									disabled={!input.trim()}
									class="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 "
								>
									<ArrowUp class="size-4" />
								</PromptInputSubmit>
							</div>
						</PromptInputToolbar>
					</PromptInput>

					<!-- Suggestions below input -->
					<div class="mt-4 flex flex-wrap justify-center gap-2">
						{#each suggestions as suggestion}
							<Suggestion
								suggestion={suggestion.query}
								onclick={() => handleSuggestionClick(suggestion.query)}
								class="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted hover:text-foreground"
							>
								<suggestion.icon class="size-4" />
								{suggestion.text}
							</Suggestion>
						{/each}
					</div>
				</div>
			</div>
		{:else}
			<!-- Chat view -->
			<div class="flex-1 overflow-y-auto">
				<div class="mx-auto max-w-3xl px-4 py-8">
					<div class="space-y-6">
						{#each chat.messages as message (message.id)}
							<div class="flex gap-3 {message.role === 'user' ? 'flex-row-reverse' : ''}">
								<!-- Avatar -->
								<div class="flex-shrink-0 pt-0.5">
									{#if message.role === 'user'}
										{#if profile?.imageUrl}
											<img
												src={profile.imageUrl}
												alt={profile.username}
												class="size-8 rounded-full object-cover ring-2 ring-background"
											/>
										{:else}
											<div
												class="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
											>
												{profile ? getInitials(profile.username) : 'U'}
											</div>
										{/if}
									{:else}
										<div class="flex size-8 items-center justify-center rounded-full bg-primary/10">
											<BotIcon class="size-4 text-primary" />
										</div>
									{/if}
								</div>

								<!-- Content -->
								<div
									class="max-w-[85%] min-w-0 {message.role === 'user'
										? 'flex flex-col items-end'
										: ''}"
								>
									{#if message.role === 'user'}
										<div
											class="rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm text-primary-foreground"
										>
											{getMessageText(message)}
										</div>
									{:else}
										<Message from="assistant">
											<MessageContent>
												{#each message.parts as part, partIndex (partIndex)}
													{#if isTextPart(part)}
														<MessageResponse content={part.text} />
														<!-- Replace the tool display section (around line 230-250) with this: -->
													{:else if part.type === 'tool-queryDatabase' || part.type === 'tool-invocation'}
														{@const tool = asSqlTool(part)}
														{#if tool.input}
															<div
																class="my-4 w-full max-w-[340px] overflow-hidden sm:max-w-[500px] md:max-w-[700px]"
															>
																<Tool
																	class="overflow-hidden rounded-xl border border-border/50 bg-muted/50 backdrop-blur-sm"
																>
																	<ToolHeader
																		type={`${tool.input?.explanation?.slice(0, 30) ?? 'ανάλυση δεδομένων'}...`}
																		state={tool.output ? 'output-available' : getToolState(part)}
																	/>
																	<ToolContent>
																		<ToolInput input={tool.input} />
																	</ToolContent>
																</Tool>
															</div>

															<!-- Thinking indicator BELOW the tool -->
															{#if !tool.output}
																<div class="flex items-center gap-3 py-3">
																	<Loader class="size-4 text-primary" />
																	<Shimmer content_length={30}>
																		{#snippet children()}
																			Αναλύω τα δεδομένα και ετοιμάζω την απάντηση...
																		{/snippet}
																	</Shimmer>
																</div>
															{/if}
														{/if}
													{/if}
												{/each}
											</MessageContent>

											<MessageToolbar>
												<MessageActions class="mt-2 flex gap-0.5">
													<MessageAction
														tooltip="Αντιγραφή"
														onclick={() => handleCopy(getMessageText(message))}
														class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
													>
														<Copy class="size-3.5" />
													</MessageAction>
													<MessageAction
														tooltip="Επαναδημιουργία"
														onclick={handleRegenerate}
														class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
													>
														<RefreshCcw class="size-3.5" />
													</MessageAction>
													<MessageAction
														tooltip="Καλή απάντηση"
														onclick={() => handleFeedback('up', message.id)}
														class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
													>
														<ThumbsUp class="size-3.5" />
													</MessageAction>
													<MessageAction
														tooltip="Κακή απάντηση"
														onclick={() => handleFeedback('down', message.id)}
														class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
													>
														<ThumbsDown class="size-3.5" />
													</MessageAction>
												</MessageActions>
											</MessageToolbar>
										</Message>
									{/if}
								</div>
							</div>
						{/each}

						<!-- Loading state -->
						{#if isLoading && !isStreaming}
							<div class="flex gap-3">
								<div class="flex size-8 items-center justify-center rounded-full bg-primary/10">
									<BotIcon class="size-4 text-primary" />
								</div>
								<div
									class="flex items-center gap-2 rounded-2xl rounded-tl-md border border-border/50 bg-card px-4 py-2.5 shadow-sm"
								>
									<Loader class="size-4 text-primary" />
									<Shimmer content_length={15}>
										{#snippet children()}
											Σκέφτομαι...
										{/snippet}
									</Shimmer>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Bottom input when in chat -->
			<div class="sticky bottom-0 border-t border-border/50 bg-background">
				<div class="mx-auto max-w-3xl px-4 py-4">
					<PromptInput
						onSubmit={(data) => handleSubmit({ text: data.text! })}
						class="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm"
					>
						<PromptInputBody>
							<PromptInputTextarea
								bind:value={input}
								placeholder="Γράψτε ένα μήνυμα..."
								class="min-h-[48px] resize-none border-0 bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-0"
							/>
						</PromptInputBody>
						<PromptInputToolbar class="flex items-center justify-between px-3 pb-3">
							<div class="flex w-full items-center justify-between">
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<img
										src="/anthropic.svg"
										class="h-4 w-4 dark:box-content dark:rounded-sm dark:bg-white dark:p-0.5"
										alt=""
									/>
									<span>claude-sonnet-4</span>
								</div>
								<PromptInputSubmit
									disabled={!input.trim()}
									class="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 "
								>
									<ArrowUp class="size-4" />
								</PromptInputSubmit>
							</div>
						</PromptInputToolbar>
					</PromptInput>
				</div>
			</div>
		{/if}
	</div>
{/if}
