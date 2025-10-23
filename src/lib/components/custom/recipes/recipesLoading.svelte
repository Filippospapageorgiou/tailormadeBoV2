 <script lang="ts">
        import Skeleton from "$lib/components/ui/skeleton/skeleton.svelte";

        let { count = 10 }: { count?: number } = $props();
  </script>

  <div class="min-h-screen bg-white">
        <main class="container mx-auto px-4 md:px-6 pt-8 pb-20">
                <div class="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-8">
                        <div class="flex flex-col gap-1">
                                <Skeleton class="h-10 w-64" />
                                <Skeleton class="h-4 w-40 mt-2" />
                        </div>
                        <div class="w-full md:w-auto flex flex-col items-end">
                                <Skeleton class="w-full md:w-72 h-9" />
                        </div>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {#each { length: count } as _, i (i)}
                                <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                                        <Skeleton class="aspect-square w-full rounded-none" />
                                        <div class="p-3">
                                                <Skeleton class="h-3 w-12 mb-2" />
                                                <Skeleton class="h-4 w-full mb-2" />
                                                <Skeleton class="h-3 w-3/4" />
                                        </div>
                                </div>
                        {/each}
                </div>
        </main>
  </div>