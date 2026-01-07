<script lang="ts">
    import AuthBlock from "$lib/components/custom/AuthBlock/authBlock.svelte";
    import { authenticatedAccess, getAllOrganizations } from "./data.remote";
    import { toast } from "svelte-sonner";
    import * as Tooltip from '$lib/components/ui/tooltip';
    import Button from "$lib/components/ui/button/button.svelte";
	import { TextWrapIcon } from "lucide-svelte";


    let auth = authenticatedAccess();
    let query = getAllOrganizations();

    let organizations = $derived(query.current?.organizations);

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});



</script>

{#await auth}
    <AuthBlock />
{:then} 
    <div class="min-h-screen">
        <main class="container mx-auto px-4 pt-4 py-4 md:px-6">
            <!-- Header Section -->
			<div class="mb-8 space-y-4">
				<div class="flex flex-col gap-2">
					<h1 class="font-mono text-3xl tracking-wider md:text-4xl">
						Organization Management
					</h1>
					<p class="text-xs text-muted-foreground md:text-sm">
						Manage your organizations 
					</p>
					<div class="flex items-center gap-2">
						<p class="text-xs text-muted-foreground md:text-sm">
							Showing: <span class="font-semibold">{organizations?.length}</span>
							users
						</p>
					</div>
				</div>

				<!-- Filters & Actions Section -->
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
						<!-- Role Filter -->
					</div>

					<div class="relative flex items-center gap-2">
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button
										variant="default"
										size="sm"
										class="h-8 cursor-pointer gap-2 px-3"
										
									>
										<TextWrapIcon class="h-4 w-4" />
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
        </main>
    </div>
{/await}


