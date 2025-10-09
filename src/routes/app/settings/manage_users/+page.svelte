<script lang="ts">
	import type { Profile } from '$lib/models/database.types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Select from '$lib/components/ui/select';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { X, RefreshCcw, Plus, Search, UserPlus, Mail } from 'lucide-svelte';
	import { Badge } from "$lib/components/ui/badge/index.js";
    import DataTable from "./data-table.svelte";
    import { columns } from './colums';
    import { getAllUserFromOrg } from './data.remote';

    let query = getAllUserFromOrg();
    let profiles = $derived(query.current?.flattenedUsers);
    let roleTypes = $derived(query.current?.roleTypes);
	
</script>

<div class="min-h-screen">
	<main class="container mx-auto px-4 pt-4 pb-10 md:px-6">
		<!-- Header Section -->
		<div class="mb-8 space-y-4">
			<div class="flex flex-col gap-2">
				<h1 class="font-mono text-3xl tracking-wider text-neutral-800 md:text-4xl">
					User Management
				</h1>
				<p class="text-xs text-[#8B6B4A] md:text-sm">
					Manage your organization members, roles, and permissions
				</p>
				<div class="flex items-center gap-2">
					<p class="text-xs text-[#8B6B4A] md:text-sm">
						Showing: <span class="font-semibold">{profiles?.length}</span>
						users
					</p>
				</div>
			</div>

			<!-- Filters & Actions Section -->
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
					<!-- Role Filter -->
					
				</div>

				<!-- Search Input & Actions -->
				<div class="relative flex items-center gap-2">
					<!-- Invite User Button -->
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant="default"
									size="sm"
									class="h-8 cursor-pointer gap-2 px-3"
									onclick={() => {
										// Will open invite dialog later
										console.log('Invite user');
									}}
								>
									<UserPlus class="h-4 w-4" />
									<span class="hidden sm:inline">Invite User</span>
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Invite New User</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>

					<!-- Refresh Button -->
					

					<!-- Search Input -->
					
				</div>
			</div>
		</div>
		<DataTable data={query.current?.flattenedUsers ?? []} {columns} />
	</main>
</div>
