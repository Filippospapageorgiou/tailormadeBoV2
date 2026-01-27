<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import LoaderIcon from "./LoaderIcon.svelte";

	export type LoaderProps = HTMLAttributes<HTMLDivElement> & {
		size?: number;
	};

	let { size = 16, class: _class, ...rest }: LoaderProps = $props();
</script>

<div class={["inline-flex animate-spin-clockwise text-muted-foreground repeat-infinite items-center justify-center", _class]} {...rest}>
	<LoaderIcon {size} />
</div>
