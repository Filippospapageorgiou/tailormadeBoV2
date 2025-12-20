<script lang="ts">
    import { CardBodyImg, CardImg1 } from '$lib/components/custom/cardBodyImgs/index.js';
    import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
    import { Calendar } from '$lib/components/ui/calendar/index.js';
    import type { Blog } from '$lib/models/database.types';
    import Hero from '$lib/components/custom/hero/hero.svelte';
    import * as Empty from '$lib/components/ui/empty/index.js';
    import { Search } from 'lucide-svelte';
    import { enhance } from '$app/forms';
    import Spinner from '$lib/components/ui/spinner/spinner.svelte';
    import * as Dialog from '$lib/components/ui/dialog/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Label } from '$lib/components/ui/label/index.js';
    import { Button } from '$lib/components/ui/button/index.js';
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import { format } from 'date-fns';
    import { el } from 'date-fns/locale';

    let { data, form } = $props();
    let blog = $derived(data.blog as Blog);
    let tosFlag = $derived(data?.tos ?? false); // Μετατροπή σε boolean για το Dialog
	
    function getFirstImage(images: any) {
        if (images && Array.isArray(images) && images.length > 0) {
            const firstImage = images[0];
            if (typeof firstImage === 'string') return firstImage;
            if (typeof firstImage === 'object' && firstImage.url) return firstImage.url;
        }
    }

    function truncateText(text: string | null | undefined, maxLength: number = 120) {
        if (!text || typeof text !== 'string') return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function formatDate(dateString: string | null | undefined) {
        if (!dateString) return '';
        return format(new Date(dateString), 'dd MMMM yyyy', { locale: el });
    }

    let value: DateValue[] | undefined = $state([today(getLocalTimeZone())]);
    let loading = $state(false);
    let termsAccepted = $state(false); // Για το checkbox
</script>

<div class="flex flex-1 flex-col gap-4 p-4 pt-2">
    <div class="grid auto-rows-min gap-4 pt-0 md:grid-cols-3 md:pt-1">
        <Hero />

        <a href="/app/recipes/" class="aspect-video rounded-2xl bg-muted/50">
            <CardImg1>
                <CardBodyImg
                    class="absolute inset-x-0 bottom-2 flex size-full flex-col justify-end px-4 pb-0.5 md:pb-10"
                />
            </CardImg1>
        </a>

        <a href="/app/schedule/" class="group relative flex aspect-video cursor-pointer flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-t from-slate-500 to-orange-50">
            <Calendar
                type="multiple"
                bind:value
                class="absolute top-4 right-0 origin-top rounded-md [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] transition-all duration-300 ease-out group-hover:scale-105"
            />
            <div class="relative z-10 px-3 py-3 pt-10 text-left text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
                <h3 class="mb-3 text-lg font-bold tracking-tighter sm:text-xl lg:text-2xl">
                    Το Πρόγραμμά μου
                </h3>
                <div class="flex flex-col gap-1">
                    <p class="text-sm sm:text-base opacity-90">Δες τις βάρδιές σου για αυτή την εβδομάδα</p>
                    <p class="text-sm sm:text-base opacity-90">Ενημερώσου για άδειες και συντονίσου με τον υπεύθυνο</p>
                </div>
            </div>
        </a>

        {#if blog}
            <a href="/app/blog/{blog.id}" class="group relative aspect-video overflow-hidden rounded-2xl">
                <div class="absolute inset-0">
                    <img src={getFirstImage(blog.images)} alt={blog.title} class="h-full w-full object-cover transition-all duration-500 group-hover:scale-110" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                </div>
                <div class="relative z-10 flex h-full flex-col justify-end p-4 text-white">
                    <span class="mb-2 text-xs font-light text-gray-300">{formatDate(blog.created_at)}</span>
                    <h3 class="mb-2 line-clamp-2 text-lg font-bold sm:text-xl">{blog.title}</h3>
                    <p class="line-clamp-2 text-sm text-gray-200 opacity-90">{truncateText(blog.content)}</p>
                </div>
            </a>
        {:else}
            <Empty.Root class="h-full bg-muted/20">
                <Empty.Header>
                    <Empty.Media variant="icon"><Search /></Empty.Media>
                    <Empty.Title>Δεν υπάρχουν νέα</Empty.Title>
                    <Empty.Description>Μείνετε συντονισμένοι για μελλοντικές αναρτήσεις.</Empty.Description>
                </Empty.Header>
            </Empty.Root>
        {/if}
    </div>
</div>

<Dialog.Root open={tosFlag}>
    <Dialog.Content class="max-w-[500px] p-0 overflow-hidden">
        <Dialog.Header class="px-6 py-4">
            <Dialog.Title class="text-xl">Όροι και Προϋποθέσεις</Dialog.Title>
        </Dialog.Header>
        
        <div class="p-6 space-y-4 max-h-[400px] overflow-y-auto bg-slate-50/50">
            <div class="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <div class="flex gap-2">
                    <span class="font-bold text-primary">1.</span>
                    <p>Η εφαρμογή προορίζεται αποκλειστικά για εργαζομένους του καταστήματος.</p>
                </div>
                <div class="flex gap-2">
                    <span class="font-bold text-primary">2.</span>
                    <p>Τα προσωπικά δεδομένα (όνομα, βάρδιες κ.λπ.) χρησιμοποιούνται μόνο για εσωτερική οργάνωση και δεν κοινοποιούνται εκτός εταιρείας.</p>
                </div>
                <div class="flex gap-2">
                    <span class="font-bold text-primary">3.</span>
                    <p>Απαγορεύεται αυστηρά η κοινοποίηση πληροφοριών της εφαρμογής σε τρίτους χωρίς έγκριση της διοίκησης.</p>
                </div>
                <div class="flex gap-2">
                    <span class="font-bold text-primary">4.</span>
                    <p>Η χρήση συνεπάγεται την τήρηση εμπιστευτικότητας εσωτερικού περιεχομένου (εκπαιδευτικά άρθρα, προγράμματα).</p>
                </div>
                <div class="flex gap-2">
                    <span class="font-bold text-primary">5.</span>
                    <p>Με την είσοδό σας αποδέχεστε την αποθήκευση βασικών στοιχείων για σκοπούς διαχείρισης και βελτίωσης.</p>
                </div>
            </div>

            <div class="flex items-start gap-3 p-4">
                <Checkbox id="terms" bind:checked={termsAccepted} />
                <div class="grid gap-1.5 leading-none">
                    <Label for="terms" class="text-sm font-semibold">Αποδοχή όρων και προϋποθέσεων</Label>
                    <p class="text-xs text-muted-foreground italic">
                        Επιλέγοντας αυτό το πλαίσιο, δηλώνετε ότι συμφωνείτε με τους παραπάνω όρους.
                    </p>
                </div>
            </div>
        </div>

        <Dialog.Footer class="px-6 py-4 bg-slate-50 flex items-center justify-between sm:justify-between">
            <a href="/app/legal" class="text-xs text-sky-600 hover:underline">Αναλυτικοί Όροι</a>
            
            <form
                method="POST"
                action="?/acceptTerms"
                use:enhance={() => {
                    loading = true;
                    return async ({ update }) => {
                        await update();
                        loading = false;
                    };
                }}
            >
                <input type="hidden" name="accept" value="accept" />
                <Button type="submit" disabled={!termsAccepted || loading} class="min-w-[100px]">
                    {#if loading}
                        <Spinner class="mr-2 h-4 w-4" />
                        Φόρτωση...
                    {:else}
                        Αποδοχή
                    {/if}
                </Button>
            </form>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>