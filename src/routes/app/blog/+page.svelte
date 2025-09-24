<script lang="ts">
	import type { Blog } from '$lib/models/database.types.js';



    let { data } = $props();
    let blogs = $derived(data.blogs as Blog[]);

    

</script>