<script lang="ts">
	import { goto } from '$app/navigation';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Calendar, User } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';


	let { blog } = $props();

	function formatDate(dateString: string | null | undefined) {
		if (!dateString) return '';
		try {
			return new Date(dateString).toLocaleDateString('el-GR', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} catch (error) {
			return '';
		}
	}

	function truncateText(text: string | null | undefined, maxLength: number = 120) {
		if (!text || typeof text !== 'string') return '';
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
	}
</script>

<div
	role="button"
	tabindex="0"
	onclick={() => goto(`/app/blog/${blog.id}`)}
	onkeydown={(e) => e.key === 'Enter' && goto(`/app/blog/${blog.id}`)}
	class="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer
		   bg-card/50 backdrop-blur-sm
		   border border-border/50 dark:border-white/10
		   shadow-sm hover:shadow-xl dark:shadow-black/20
		   transition-all duration-300 ease-out
		   hover:-translate-y-1"
>
	<!-- Subtle gradient overlay for glass effect -->
	<div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 -z-10"></div>
	
	<!-- Image container with overlay -->
	<div class="relative aspect-video w-full overflow-hidden">
		<img
			src={blog.images?.[0]}
			alt={blog.title}
			class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
		/>
		<!-- Dark overlay on hover for better contrast -->
		<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 
					opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
		
		<!-- Tags positioned on image -->
		{#if blog.tags && blog.tags.length}
			<div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
				{#each blog.tags.slice(0, 2) as tag}
					<Badge 
						variant="secondary" 
						class="bg-white/90 dark:bg-black/70 text-foreground backdrop-blur-sm 
							   text-xs font-medium border-0 shadow-sm"
					>
						#{tag}
					</Badge>
				{/each}
				{#if blog.tags.length > 2}
					<Badge 
						variant="secondary"
						class="bg-white/90 dark:bg-black/70 text-muted-foreground backdrop-blur-sm 
							   text-xs border-0 shadow-sm"
					>
						+{blog.tags.length - 2}
					</Badge>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Content area -->
	<div class="p-5 flex flex-col flex-grow bg-gradient-to-b from-transparent to-muted/20 dark:to-muted/10">
		<!-- Title -->
		<h2 class="text-lg font-semibold tracking-tight mb-2 
				   text-foreground group-hover:text-primary 
				   transition-colors duration-200 line-clamp-2">
			{blog.title}
		</h2>

		<!-- Excerpt -->
		{#if blog.content}
			<p class="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
				{truncateText(blog.content, 100)}
			</p>
		{/if}

		<!-- Footer with author info -->
		<div class="mt-auto pt-4">
			<div class="flex items-center justify-between">
				<!-- Author -->
				<div class="flex items-center gap-3">
					<div class="relative">
						<img
							src={blog.profile.image_url}
							alt={blog.profile.username}
							class="w-9 h-9 rounded-full object-cover ring-2 ring-background shadow-sm"
						/>
					</div>
					<div class="flex flex-col">
						<span class="text-sm font-medium text-foreground">
							{blog.profile.username}
						</span>
						<span class="text-xs text-muted-foreground flex items-center gap-1">
							<Calendar class="w-3 h-3" />
							{formatDate(blog.created_at)}
						</span>
					</div>
				</div>

				<!-- Read more indicator -->
				<div class="flex items-center gap-1 text-xs font-medium text-primary 
							opacity-0 group-hover:opacity-100 transition-opacity duration-200">
					<span>Διαβάστε</span>
					<svg 
						class="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" 
						fill="none" 
						viewBox="0 0 24 24" 
						stroke="currentColor"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</div>
		</div>
	</div>

	<!-- Hover glow effect -->
	<div class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
				transition-opacity duration-300 pointer-events-none
				shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]
				dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"></div>
</div>