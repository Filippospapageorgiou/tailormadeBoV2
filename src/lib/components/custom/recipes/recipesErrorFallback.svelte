<script lang="ts">
        let { error, reset }: { error?: Error; reset?: () => void } = $props();
  </script>

  <div class="min-h-screen bg-white flex items-center justify-center">
        <div class="container mx-auto px-4 md:px-6">
                <div class="max-w-md mx-auto text-center">
                        <div class="mb-6">
                                <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-16 w-16 mx-auto text-red-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                >
                                        <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77
   1.333.192 3 1.732 3z"
                                        />
                                </svg>
                        </div>
                        <h2 class="text-2xl font-mono tracking-wider text-neutral-800 mb-2">
                                SOMETHING WENT WRONG
                        </h2>
                        <p class="text-sm text-neutral-600 mb-6">
                                {error?.message || 'Failed to load beverages. Please try again.'}
                        </p>
                        {#if reset}
                                <button
                                        onclick={reset}
                                        class="px-6 py-2 bg-[#8B6B4A] text-white rounded-md hover:bg-[#6B4B3A] transition-colors duration-200"
                                >
                                        Try Again
                                </button>
                        {/if}
                </div>
        </div>
  </div>