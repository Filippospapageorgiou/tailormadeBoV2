<script lang="ts">
	import { FileDropZone, MEGABYTE } from '$lib/components/ui/file-drop-zone';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import {
		FileSpreadsheet,
		Upload,
		Send,
		RotateCcw,
		ChevronRight,
		ChevronLeft,
		FileCheck,
		Table,
		Columns,
		CheckCircle,
		Import,
		Award
	} from 'lucide-svelte';
	import { toast, Toaster } from 'svelte-sonner';
	import ExcelJS from 'exceljs';
	import ColumnMapping from './column-mapping.svelte';
	import ExcelPreviewTable from './excel-preview-table.svelte';
	import {
		importBonusData,
		authenticatedAccess,
		getAllBonusPeriods
	} from '$lib/api/bonus_managment/data.remote';
	import {
		ACCEPT_EXCEL,
		type RawExcelData,
		type ColumnMapping as ColumnMappingType,
		type ParsedExcelRow,
		type Quarter
	} from './types';
	import AuthBlock from '$lib/components/custom/AuthBlock/authBlock.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { hideProgress, showProgress } from '$lib/stores/progress.svelte';
	import { createColumns } from '$lib/components/bonus_table/bonus-periods-columns';
	import BonusPeriodsTable from '$lib/components/bonus_table/BonusPeriodsTable.svelte';

	// ============================================
	// STATE
	// ============================================
	let auth = authenticatedAccess();

	$effect(() => {
		if (auth.current?.success) {
			toast.success('Επιτυχής πρόσβαση');
		}
	});
	// Step management (1: Upload, 2: Configure, 3: Mapping, 4: Preview)
	let currentStep = $state(1);

	// Period selection
	let selectedQuarter = $state<string>('1');
	let selectedYear = $state<string>(new Date().getFullYear().toString());
	let previousYear = $derived<string>((Number(selectedYear) - 1).toString());
	// Excel file state
	let workbook = $state<ExcelJS.Workbook | null>(null);
	let sheetNames = $state<string[]>([]);
	let selectedSheet = $state<string>('');
	let headerRowOptions = $state<number[]>([]);
	let selectedHeaderRow = $state<string>('1');

	// Raw data from Excel
	let rawData = $state<RawExcelData | null>(null);

	// Column mapping
	let columnMapping = $state<ColumnMappingType>({
		org_id: null,
		store_name: null,
		current_kilos: null,
		previous_kilos: null
	});
	let isMappingComplete = $state(false);

	// Final parsed data
	let parsedData = $state<ParsedExcelRow[]>([]);
	let parseErrors = $state<string[]>([]);
	let parseWarnings = $state<string[]>([]);

	// Loading states
	let isParsing = $state(false);
	let isSubmitting = $state(false);

	// ============================================
	// DERIVED
	// ============================================

	let canProceedToStep3 = $derived(selectedSheet !== '' && selectedHeaderRow !== '');
	let canProceedToStep4 = $derived(isMappingComplete);
	let canSubmit = $derived(parsedData.length > 0 && parseErrors.length === 0);

	// Quarter options
	const quarters = [
		{ value: '1', label: 'Q1 (Ιαν - Μαρ)' },
		{ value: '2', label: 'Q2 (Απρ - Ιουν)' },
		{ value: '3', label: 'Q3 (Ιουλ - Σεπ)' },
		{ value: '4', label: 'Q4 (Οκτ - Δεκ)' }
	];

	// Year options
	const currentYear = new Date().getFullYear();
	const years = [
		{ value: String(currentYear), label: String(currentYear) },
		{ value: String(currentYear - 1), label: String(currentYear - 1) },
		{ value: String(currentYear - 2), label: String(currentYear - 2) }
	];

	let selectedQuarterLabel = $derived(
		quarters.find((q) => q.value === selectedQuarter)?.label ?? 'Select Quarter'
	);
	let selectedYearLabel = $derived(
		years.find((y) => y.value === selectedYear)?.label ?? 'Select Year'
	);
	let selectedSheetLabel = $derived(selectedSheet || 'Επιλέξτε φύλλο...');
	let selectedHeaderRowLabel = $derived(
		selectedHeaderRow ? `Γραμμή ${selectedHeaderRow}` : 'Επιλέξτε γραμμή...'
	);

	// ============================================
	// STEP 1: FILE UPLOAD
	// ============================================

	async function handleUpload(files: File[]) {
		if (files.length === 0) return;

		const file = files[0];
		isParsing = true;

		try {
			const arrayBuffer = await file.arrayBuffer();
			const wb = new ExcelJS.Workbook();
			await wb.xlsx.load(arrayBuffer);

			workbook = wb;
			sheetNames = wb.worksheets.map((ws) => ws.name);

			// Auto-select first sheet
			if (sheetNames.length > 0) {
				selectedSheet = sheetNames[0];
			}

			// Create header row options (1-10)
			headerRowOptions = Array.from({ length: 10 }, (_, i) => i + 1);
			selectedHeaderRow = '1';

			toast.success(`Αρχείο "${file.name}" φορτώθηκε επιτυχώς`);
			currentStep = 2;
		} catch (err) {
			console.error('Excel load error:', err);
			toast.error('Σφάλμα κατά τη φόρτωση του αρχείου');
		} finally {
			isParsing = false;
		}
	}

	function handleFileRejected({ file, reason }: { file: File; reason: string }) {
		toast.error(`${file.name}: ${reason}`);
	}

	// ============================================
	// STEP 2: CONFIGURE (Sheet & Header Row)
	// ============================================

	function proceedToStep3() {
		if (!workbook || !selectedSheet) return;

		const worksheet = workbook.getWorksheet(selectedSheet);
		if (!worksheet) {
			toast.error('Δεν βρέθηκε το επιλεγμένο φύλλο');
			return;
		}

		const headerRowIndex = parseInt(selectedHeaderRow);
		const headerRow = worksheet.getRow(headerRowIndex);
		const headers: string[] = [];

		headerRow.eachCell((cell, colNumber) => {
			const value = String(cell.value || '').trim();
			if (value) {
				headers.push(value);
			}
		});

		if (headers.length === 0) {
			toast.error('Δεν βρέθηκαν headers στην επιλεγμένη γραμμή');
			return;
		}

		// Read all data rows
		const rows: Record<string, any>[] = [];
		worksheet.eachRow((row, rowNumber) => {
			if (rowNumber <= headerRowIndex) return; // Skip header and above

			const rowData: Record<string, any> = {};
			let hasData = false;

			row.eachCell((cell, colNumber) => {
				const headerIndex = colNumber - 1;
				if (headerIndex < headers.length) {
					const header = headers[headerIndex];
					if (header) {
						rowData[header] = cell.value;
						if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
							hasData = true;
						}
					}
				}
			});

			// Only add rows that have some data
			if (hasData) {
				rows.push(rowData);
			}
		});

		rawData = {
			sheetNames,
			selectedSheet,
			headers,
			rows,
			headerRowIndex
		};

		// Reset mapping
		columnMapping = {
			org_id: null,
			store_name: null,
			current_kilos: null,
			previous_kilos: null
		};

		toast.success(`Βρέθηκαν ${headers.length} στήλες και ${rows.length} γραμμές δεδομένων`);
		currentStep = 3;
	}

	// ============================================
	// STEP 3: COLUMN MAPPING
	// ============================================

	function handleMappingComplete(isComplete: boolean) {
		isMappingComplete = isComplete;
	}

	function proceedToStep4() {
		if (!rawData || !isMappingComplete) return;

		const errors: string[] = [];
		const warnings: string[] = [];
		const validRows: ParsedExcelRow[] = [];

		rawData.rows.forEach((row, index) => {
			const rowNum = index + rawData!.headerRowIndex + 1;

			// Get values using mapping
			const orgIdRaw = row[columnMapping.org_id!];
			const storeName = String(row[columnMapping.store_name!] || '').trim();
			const currentKilosRaw = row[columnMapping.current_kilos!];
			const previousKilosRaw = row[columnMapping.previous_kilos!];

			// Parse org_id
			const orgId = Number(orgIdRaw);
			if (isNaN(orgId) || orgId <= 0) {
				warnings.push(`Γραμμή ${rowNum}: Μη έγκυρο org_id "${orgIdRaw}"`);
				return;
			}

			// Parse kilos
			const parseKilos = (value: any): number => {
				if (typeof value === 'number') return value;
				if (typeof value === 'string') {
					const cleaned = value.replace(/\./g, '').replace(',', '.');
					return parseFloat(cleaned) || 0;
				}
				return 0;
			};

			const currentKilos = parseKilos(currentKilosRaw);
			const previousKilos = parseKilos(previousKilosRaw);

			// Calculate
			const kiloDifference = currentKilos - previousKilos;
			const percentageChange = previousKilos > 0 ? (kiloDifference / previousKilos) * 100 : 0;

			validRows.push({
				org_id: orgId,
				store_name: storeName,
				current_kilos: currentKilos,
				previous_kilos: previousKilos,
				kilo_difference: kiloDifference,
				percentage_change: percentageChange
			});
		});

		if (validRows.length === 0) {
			errors.push('Δεν βρέθηκαν έγκυρα δεδομένα');
		}

		parsedData = validRows;
		parseErrors = errors;
		parseWarnings = warnings;

		if (errors.length === 0) {
			toast.success(`Επικύρωση επιτυχής: ${validRows.length} έγκυρες εγγραφές`);
		}

		currentStep = 4;
	}

	// ============================================
	// STEP 4: SUBMIT
	// ============================================

	async function handleSubmit() {
		if (!canSubmit) return;
		showProgress('Τα δεδομένα υποβάλλονται σε επεξεργασία. Παρακαλώ μην κλείσετε την εφαρμογή.');
		isSubmitting = true;

		try {
			const result = await importBonusData({
				quarter: parseInt(selectedQuarter) as Quarter,
				year: parseInt(selectedYear),
				previousYear: parseInt(previousYear),
				data: parsedData
			});

			if (result.success) {
				toast.success(result.message);
			} else {
				toast.error(result.message || 'Αποτυχία αποστολής');
			}
		} catch (err) {
			console.error('Submit error:', err);
			toast.error('Απρόσμενο σφάλμα κατά την αποστολή');
		} finally {
			isSubmitting = false;
			hideProgress();
			refreshBonusPeriods();
			handleReset();
		}
	}

	// ============================================
	// NAVIGATION
	// ============================================

	function goBack() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	function handleReset() {
		currentStep = 1;
		workbook = null;
		sheetNames = [];
		selectedSheet = '';
		rawData = null;
		columnMapping = {
			org_id: null,
			store_name: null,
			current_kilos: null,
			previous_kilos: null
		};
		parsedData = [];
		parseErrors = [];
		parseWarnings = [];
	}

	let query = getAllBonusPeriods();
	let allBonusPeriods = $derived(query.current?.periods);
	// Create refresh function
	async function refreshBonusPeriods() {
		await query.refresh();
	}

	// Create columns with the refresh callback
	const columns = createColumns(refreshBonusPeriods);
</script>

{#if auth.loading}
	<AuthBlock />
{:else}
	<div class="min-h-screen animate-fade-in-down bg-background">
		<main class="container mx-auto px-4 pt-6 pb-10 md:px-6 lg:px-8">
			<!-- Header Section -->
			<div class="mb-6 space-y-2">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-primary/10 p-2">
						<FileSpreadsheet class="h-6 w-6 text-primary" />
					</div>
					<div>
						<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">Bonus Management</h1>
						<p class="text-sm text-muted-foreground">
							Εισαγωγή δεδομένων πωλήσεων και υπολογισμός bonus
						</p>
					</div>
				</div>
			</div>

			<!-- Tabs Section - Horizontal like User Management -->
			<Tabs.Root value="periods" class="w-full">
				<Tabs.List class="flex h-auto w-auto justify-start bg-transparent">
					<Tabs.Trigger
						value="import"
						class="cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-3 text-base font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
					>
						<Import class="mr-2 h-4 w-4" />
						<span class="hover:underline">Import Excel</span>
					</Tabs.Trigger>
					<Tabs.Trigger
						value="periods"
						class="cursor-pointer justify-start rounded-md border-0 bg-transparent px-4 py-3 text-base font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
					>
						<Award class="mr-2 h-4 w-4" />
						<span class="hover:underline">Περίοδοι Bonus</span>
					</Tabs.Trigger>
				</Tabs.List>

				<!-- Import Tab Content -->
				<Tabs.Content value="import" class="mt-6 animate-fade-in-left space-y-6">
					<!-- Progress Steps -->
					<div class="mb-8">
						<div class="flex items-center justify-between">
							{#each [{ step: 1, label: 'Upload', icon: Upload }, { step: 2, label: 'Ρυθμίσεις', icon: Table }, { step: 3, label: 'Αντιστοίχιση', icon: Columns }, { step: 4, label: 'Προεπισκόπηση', icon: CheckCircle }] as item}
								<div class="flex flex-1 items-center">
									<div
										class="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors
										{currentStep === item.step
											? 'bg-primary text-primary-foreground'
											: currentStep > item.step
												? 'bg-green-500/20 text-green-700 dark:text-green-400'
												: 'bg-muted text-muted-foreground'}"
									>
										<item.icon class="h-4 w-4" />
										<span class="hidden sm:inline">{item.label}</span>
										<span class="sm:hidden">{item.step}</span>
									</div>
									{#if item.step < 4}
										<div
											class="mx-2 h-0.5 flex-1 rounded
											{currentStep > item.step ? 'bg-green-500' : 'bg-muted'}"
										></div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- Period Selection (always visible) -->
					<Card.Root class="rounded-2xl border border-border/50 bg-background">
						<Card.Header class="pb-3">
							<Card.Title class="text-lg">Περίοδος Αξιολόγησης</Card.Title>
						</Card.Header>
						<Card.Content>
							<div class="flex flex-col gap-4 sm:flex-row sm:items-end">
								<div class="space-y-2">
									<Label>Τρίμηνο</Label>
									<Select.Root type="single" bind:value={selectedQuarter}>
										<Select.Trigger class="w-[180px]">
											{selectedQuarterLabel}
										</Select.Trigger>
										<Select.Content>
											{#each quarters as quarter}
												<Select.Item value={quarter.value} label={quarter.label}>
													{quarter.label}
												</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>

								<div class="space-y-2">
									<Label>Έτος</Label>
									<Select.Root type="single" bind:value={selectedYear}>
										<Select.Trigger class="w-[120px]">
											{selectedYearLabel}
										</Select.Trigger>
										<Select.Content>
											{#each years as year}
												<Select.Item value={year.value} label={year.label}>
													{year.label}
												</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>

								<Badge variant="secondary" class="h-fit">
									Q{selectedQuarter}
									{selectedYear} - {previousYear}
								</Badge>
							</div>
						</Card.Content>
					</Card.Root>

					<!-- STEP 1: File Upload -->
					{#if currentStep === 1}
						<Card.Root
							class="animate-fade-in-left rounded-2xl border border-border/50 bg-background"
						>
							<Card.Header>
								<Card.Title class="flex items-center gap-2 text-lg">
									<Upload class="h-5 w-5" />
									Βήμα 1: Ανέβασμα Excel
								</Card.Title>
								<Card.Description>
									Επιλέξτε το αρχείο Excel με τα δεδομένα πωλήσεων καφέ
								</Card.Description>
							</Card.Header>
							<Card.Content>
								{#if isParsing}
									<div
										class="flex h-48 items-center justify-center rounded-lg border-2 border-dashed"
									>
										<div class="flex flex-col items-center gap-2">
											<Spinner class="h-8 w-8" />
											<p class="text-sm text-muted-foreground">Φόρτωση αρχείου...</p>
										</div>
									</div>
								{:else}
									<FileDropZone
										accept={ACCEPT_EXCEL}
										maxFiles={1}
										maxFileSize={10 * MEGABYTE}
										onUpload={handleUpload}
										onFileRejected={handleFileRejected}
									>
										<div class="flex flex-col items-center justify-center gap-2">
											<div
												class="flex size-14 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground"
											>
												<Upload class="size-7" />
											</div>
											<div class="flex flex-col gap-0.5 text-center">
												<span class="font-medium text-muted-foreground">
													Σύρετε το Excel εδώ ή κάντε κλικ για επιλογή
												</span>
												<span class="text-sm text-muted-foreground/75">
													Αποδεκτά: .xlsx, .xls (μέχρι 10MB)
												</span>
											</div>
										</div>
									</FileDropZone>
								{/if}
							</Card.Content>
						</Card.Root>
					{/if}

					<!-- STEP 2: Configure Sheet & Header Row -->
					{#if currentStep === 2}
						<Card.Root
							class="animate-fade-in-left rounded-2xl border border-border/50 bg-background"
						>
							<Card.Header>
								<Card.Title class="flex items-center gap-2 text-lg">
									<Table class="h-5 w-5" />
									Βήμα 2: Ρυθμίσεις Excel
								</Card.Title>
								<Card.Description>Επιλέξτε το φύλλο και τη γραμμή με τα headers</Card.Description>
							</Card.Header>
							<Card.Content class="space-y-4">
								<div class="grid gap-4 sm:grid-cols-2">
									<!-- Sheet Selection -->
									<div class="space-y-2">
										<Label>Φύλλο Εργασίας (Sheet)</Label>
										<Select.Root type="single" bind:value={selectedSheet}>
											<Select.Trigger class="w-full">
												{selectedSheetLabel}
											</Select.Trigger>
											<Select.Content>
												{#each sheetNames as sheet}
													<Select.Item value={sheet} label={sheet}>
														{sheet}
													</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>

									<!-- Header Row Selection -->
									<div class="space-y-2">
										<Label>Γραμμή Headers</Label>
										<Select.Root type="single" bind:value={selectedHeaderRow}>
											<Select.Trigger class="w-full">
												{selectedHeaderRowLabel}
											</Select.Trigger>
											<Select.Content>
												{#each headerRowOptions as rowNum}
													<Select.Item value={String(rowNum)} label={`Γραμμή ${rowNum}`}>
														Γραμμή {rowNum}
													</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
										<p class="text-xs text-muted-foreground">
											Η γραμμή που περιέχει τα ονόματα των στηλών
										</p>
									</div>
								</div>
							</Card.Content>
							<Card.Footer class="flex justify-between border-t pt-6">
								<Button variant="outline" onclick={goBack}>
									<ChevronLeft class="mr-2 h-4 w-4" />
									Πίσω
								</Button>
								<Button onclick={proceedToStep3} disabled={!canProceedToStep3}>
									Συνέχεια
									<ChevronRight class="ml-2 h-4 w-4" />
								</Button>
							</Card.Footer>
						</Card.Root>
					{/if}

					<!-- STEP 3: Column Mapping -->
					{#if currentStep === 3 && rawData}
						<ColumnMapping
							{rawData}
							bind:mapping={columnMapping}
							onMappingComplete={handleMappingComplete}
						/>

						<div class="mt-6 flex justify-between">
							<Button variant="outline" onclick={goBack}>
								<ChevronLeft class="mr-2 h-4 w-4" />
								Πίσω
							</Button>
							<Button onclick={proceedToStep4} disabled={!canProceedToStep4}>
								Επικύρωση & Συνέχεια
								<ChevronRight class="ml-2 h-4 w-4" />
							</Button>
						</div>
					{/if}

					<!-- STEP 4: Final Preview & Submit -->
					{#if currentStep === 4}
						<!-- Errors -->
						{#if parseErrors.length > 0}
							<Card.Root class="border-red-500/50 bg-red-500/5">
								<Card.Header>
									<Card.Title class="text-lg text-red-700 dark:text-red-400">Σφάλματα</Card.Title>
								</Card.Header>
								<Card.Content>
									<ul class="list-inside list-disc space-y-1">
										{#each parseErrors as error}
											<li class="text-sm text-red-700 dark:text-red-400">{error}</li>
										{/each}
									</ul>
								</Card.Content>
							</Card.Root>
						{/if}

						<!-- Warnings -->
						{#if parseWarnings.length > 0}
							<Card.Root class="border-amber-500/50 bg-amber-500/5">
								<Card.Header>
									<Card.Title class="text-lg text-amber-700 dark:text-amber-400">
										Προειδοποιήσεις ({parseWarnings.length})
									</Card.Title>
								</Card.Header>
								<Card.Content>
									<ul class="list-inside list-disc space-y-1">
										{#each parseWarnings.slice(0, 10) as warning}
											<li class="text-sm text-amber-700 dark:text-amber-400">{warning}</li>
										{/each}
										{#if parseWarnings.length > 10}
											<li class="text-sm text-amber-700 dark:text-amber-400">
												...και {parseWarnings.length - 10} ακόμη
											</li>
										{/if}
									</ul>
								</Card.Content>
							</Card.Root>
						{/if}

						<!-- Final Preview Table -->
						{#if parsedData.length > 0}
							<Card.Root
								class="animate-fade-in-left rounded-2xl border border-border/50 bg-background"
							>
								<Card.Header>
									<div class="flex items-center justify-between">
										<div>
											<Card.Title class="flex items-center gap-2 text-lg">
												<FileCheck class="h-5 w-5 text-green-600" />
												Τελική Προεπισκόπηση
											</Card.Title>
											<Card.Description>
												Q{selectedQuarter}
												{selectedYear} - {parsedData.length} καταστήματα
											</Card.Description>
										</div>
										<Button variant="outline" size="sm" onclick={handleReset}>
											<RotateCcw class="mr-2 h-4 w-4" />
											Νέο Αρχείο
										</Button>
									</div>
								</Card.Header>
								<Card.Content>
									<ExcelPreviewTable data={parsedData} />
								</Card.Content>
								<Card.Footer class="flex justify-between border-t pt-6">
									<Button variant="outline" onclick={goBack}>
										<ChevronLeft class="mr-2 h-4 w-4" />
										Πίσω
									</Button>
									<Button onclick={handleSubmit} disabled={!canSubmit || isSubmitting}>
										{#if isSubmitting}
											<Spinner class="mr-2 h-4 w-4" />
											Αποστολή...
										{:else}
											<Send class="mr-2 h-4 w-4" />
											Υποβολή Δεδομένων
										{/if}
									</Button>
								</Card.Footer>
							</Card.Root>
						{/if}
					{/if}
				</Tabs.Content>

				<!-- Periods Tab Content -->
				<Tabs.Content value="periods" class="mt-6 animate-fade-in-left">
					<BonusPeriodsTable data={allBonusPeriods ?? []} {columns} />
				</Tabs.Content>
			</Tabs.Root>
		</main>
	</div>
{/if}
