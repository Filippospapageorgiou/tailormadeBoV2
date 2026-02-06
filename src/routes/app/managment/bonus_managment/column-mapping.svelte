<script lang="ts">
    import * as Select from '$lib/components/ui/select/index.js';
    import { CheckCircle2, FileSpreadsheet, LayoutList } from 'lucide-svelte';
    import { REQUIRED_FIELDS, type ColumnMapping, type RawExcelData, type FieldKey } from './types';
    import { ScrollArea } from '$lib/components/ui/scroll-area/index.js'; // Ensure you have this

    let {
        rawData,
        mapping = $bindable<ColumnMapping>({
            org_id: null,
            store_name: null,
            current_kilos: null,
            previous_kilos: null
        }),
        onMappingComplete
    }: {
        rawData: RawExcelData;
        mapping: ColumnMapping;
        onMappingComplete?: (isComplete: boolean) => void;
    } = $props();

    const MAX_VISIBLE_COLUMNS = 8;
    const MAX_PREVIEW_ROWS = 8;

    let visibleHeaders = $derived(rawData.headers.slice(0, MAX_VISIBLE_COLUMNS));
    let hasMoreColumns = $derived(rawData.headers.length > MAX_VISIBLE_COLUMNS);

    // Logic
    let allFieldsMapped = $derived(
        mapping.org_id !== null &&
            mapping.store_name !== null &&
            mapping.current_kilos !== null &&
            mapping.previous_kilos !== null
    );

    // Calculate Progress Percentage
    let progress = $derived(
        (Object.values(mapping).filter((v) => v !== null).length / REQUIRED_FIELDS.length) * 100
    );

    let mappedFields = $derived(
        REQUIRED_FIELDS.map((field) => ({
            ...field,
            isMapped: mapping[field.key as FieldKey] !== null,
            mappedTo: mapping[field.key as FieldKey]
        }))
    );

    $effect(() => {
        onMappingComplete?.(allFieldsMapped);
    });

    const mappingOptions = [
        { value: '__ignore__', label: 'Αγνόηση (Skip)', color: 'text-muted-foreground' },
        { value: 'org_id', label: 'Organization ID', color: 'text-muted-foreground' },
        { value: 'store_name', label: 'Όνομα Καταστήματος', color: 'text-muted-foreground' },
        { value: 'current_kilos', label: 'Τρέχοντα Κιλά', color: 'text-muted-foreground' },
        { value: 'previous_kilos', label: 'Προηγούμενα Κιλά', color: 'text-muted-foreground' }
    ];

    function getColumnMapping(header: string): string {
        for (const field of REQUIRED_FIELDS) {
            if (mapping[field.key as FieldKey] === header) return field.key;
        }
        return '__ignore__';
    }

    function getColumnMappingLabel(header: string): string {
        const currentMapping = getColumnMapping(header);
        const option = mappingOptions.find((o) => o.value === currentMapping);
        return option?.label ?? 'Αγνόηση';
    }

    function handleColumnMappingChange(header: string, value: string) {
        for (const field of REQUIRED_FIELDS) {
            if (mapping[field.key as FieldKey] === header) mapping[field.key as FieldKey] = null;
        }
        if (value !== '__ignore__') {
            const previousHeader = mapping[value as FieldKey];
            mapping[value as FieldKey] = header;
        }
    }

    // UX: Highlight the entire column if mapped
    function getColumnStateClass(header: string): string {
        const currentMapping = getColumnMapping(header);
        switch (currentMapping) {
            case 'org_id': return 'bg-blue-500/5 text-blue-700 dark:text-blue-300 font-medium';
            case 'store_name': return 'bg-purple-500/5 text-purple-700 dark:text-purple-300 font-medium';
            case 'current_kilos': return 'bg-green-500/5 text-green-700 dark:text-green-300 font-medium';
            case 'previous_kilos': return 'bg-orange-500/5 text-orange-700 dark:text-orange-300 font-medium';
            default: return 'text-muted-foreground/60 opacity-60'; // Dim ignored columns
        }
    }

    function formatCellValue(value: any): string {
        if (value === null || value === undefined) return '—';
        if (typeof value === 'number') return value.toLocaleString('el-GR', { maximumFractionDigits: 2 });
        const strValue = String(value);
        return strValue.length > 20 ? strValue.substring(0, 20) + '...' : strValue;
    }
</script>

<div class="space-y-6 animate-fade-in-left">
    
    <div class="glass-card relative overflow-hidden rounded-2xl p-6 border border-border/50">
        <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
                <h3 class="flex items-center gap-2 text-lg font-semibold">
                    <LayoutList class="h-5 w-5 text-primary" />
                    Αντιστοίχιση Δεδομένων
                </h3>
                <p class="text-sm text-muted-foreground">
                    Συνδέστε τις στήλες του Excel με τα πεδία του συστήματος.
                </p>
            </div>

            <div class="flex items-center gap-4 rounded-xl border border-border/50 bg-background/50 p-3 backdrop-blur-sm">
                <div class="space-y-1">
                    <div class="flex items-center justify-between gap-8 text-xs font-medium">
                        <span class={progress === 100 ? "text-green-600" : "text-muted-foreground"}>
                            {progress === 100 ? 'Ολοκληρώθηκε' : 'Πρόοδος'}
                        </span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div class="h-2 w-32 overflow-hidden rounded-full bg-muted">
                        <div 
                            class="h-full bg-primary transition-all duration-500 ease-out"
                            class:bg-green-500={progress === 100} 
                            style="width: {progress}%"
                        ></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-2 border-t border-border/10 pt-4">
            {#each mappedFields as field}
                <div 
                    class="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-300
                    {field.isMapped 
                        ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400' 
                        : 'border-dashed border-muted-foreground/30 bg-muted/10 text-muted-foreground opacity-70'}"
                >
                    {#if field.isMapped}
                        <CheckCircle2 class="h-3.5 w-3.5" />
                    {:else}
                        <div class="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                    {/if}
                    {field.label}
                </div>
            {/each}
        </div>
    </div>

    <div class="relative overflow-hidden rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
        <div class="absolute inset-0 -z-10 bg-gradient-to-br from-card/40 via-card/80 to-muted/20"></div>

        <ScrollArea class="w-full pb-2">
            <div class="w-full min-w-[800px]"> <table class="w-full border-collapse text-sm">
                    <thead>
                        <tr class="border-b border-border/10 bg-muted/20">
                            {#each visibleHeaders as header}
                                <th class="p-3 text-left align-top">
                                    <div class="flex flex-col gap-2">
                                        <div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <FileSpreadsheet class="h-3 w-3" />
                                            <span class="truncate max-w-[120px]" title={header}>{header}</span>
                                        </div>
                                        
                                        <Select.Root
                                            type="single"
                                            value={getColumnMapping(header)}
                                            onValueChange={(val) => val && handleColumnMappingChange(header, val)}
                                        >
                                            <Select.Trigger 
                                                class="h-9 w-full justify-between border-transparent bg-background/50 text-xs shadow-sm hover:bg-background/80 focus:ring-1 focus:ring-primary/20
                                                {getColumnMapping(header) !== '__ignore__' ? 'border-primary/50 bg-primary/5 font-medium text-foreground' : 'text-muted-foreground'}"
                                            >
                                                <div class="truncate">
                                                    {getColumnMappingLabel(header)}
                                                </div>
                                            </Select.Trigger>
                                            <Select.Content class="max-h-[300px]">
                                                {#each mappingOptions as option}
                                                    {@const isUsed = option.value !== '__ignore__' && mapping[option.value as FieldKey] !== null && mapping[option.value as FieldKey] !== header}
                                                    <Select.Item 
                                                        value={option.value} 
                                                        label={option.label}
                                                        disabled={isUsed}
                                                        class="text-xs"
                                                    >
                                                        <span class="flex items-center gap-2 {option.color}">
                                                            {option.label}
                                                            {#if isUsed}<span class="text-[10px] text-muted-foreground">(Used)</span>{/if}
                                                        </span>
                                                    </Select.Item>
                                                {/each}
                                            </Select.Content>
                                        </Select.Root>
                                    </div>
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    
                    <tbody class="divide-y divide-border/5">
                        {#each rawData.rows.slice(0, MAX_PREVIEW_ROWS) as row, i}
                            <tr class="transition-colors hover:bg-white/5">
                                {#each visibleHeaders as header}
                                    <td class="p-3 {getColumnStateClass(header)}">
                                        <div class="truncate max-w-[150px]" title={String(row[header] ?? '')}>
                                            {formatCellValue(row[header])}
                                        </div>
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </ScrollArea>
        
        <div class="border-t border-white/5 bg-white/5 p-2 text-center text-xs text-muted-foreground">
             Προεπισκόπηση {Math.min(MAX_PREVIEW_ROWS, rawData.rows.length)} από {rawData.rows.length} γραμμές
        </div>
    </div>

    {#if allFieldsMapped}
        <div class="flex animate-fade-in-up items-center justify-between rounded-xl border border-green-500/30 bg-green-500/10 p-4 shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)]">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                    <CheckCircle2 class="h-5 w-5" />
                </div>
                <div>
                    <p class="font-semibold text-green-900 dark:text-green-100">Έτοιμο για εισαγωγή</p>
                    <p class="text-xs text-green-700 dark:text-green-300">Όλα τα πεδία αντιστοιχήθηκαν επιτυχώς.</p>
                </div>
            </div>
            </div>
    {/if}
</div>