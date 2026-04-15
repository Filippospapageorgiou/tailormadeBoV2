import { query } from '$app/server';
import { createAdminClient } from '$lib/supabase/server';
import { getUserProfileWithRoleCheck } from '$lib/supabase/queries';
import { z } from 'zod/v4';

const categorySchema = z.object({
	category: z.enum(['beverages', 'blog', 'manual'])
});

type Category = 'beverages' | 'blog' | 'manual';

interface CategoryConfig {
	table: 'beverages_reads' | 'blog_reads' | 'manual_reads';
	contentTable: 'beverages' | 'blogs' | 'manuals';
	contentFk: 'beverage_id' | 'blog_id' | 'manual_id';
	nameField: 'name' | 'title';
	imageField: 'image_url' | 'images' | 'media';
}

const CONFIGS: Record<Category, CategoryConfig> = {
	beverages: {
		table: 'beverages_reads',
		contentTable: 'beverages',
		contentFk: 'beverage_id',
		nameField: 'name',
		imageField: 'image_url'
	},
	blog: {
		table: 'blog_reads',
		contentTable: 'blogs',
		contentFk: 'blog_id',
		nameField: 'title',
		imageField: 'images'
	},
	manual: {
		table: 'manual_reads',
		contentTable: 'manuals',
		contentFk: 'manual_id',
		nameField: 'title',
		imageField: 'media'
	}
};

export interface EmployeeReadStat {
	user_id: string;
	full_name: string;
	image_url: string | null;
	org_id: number | null;
	store_name: string | null;
	count: number;
	last_read: string;
	daily: number[]; // length 7, oldest → newest
}

export interface OrgReadStat {
	org_id: number;
	store_name: string;
	count: number;
	reader_count: number;
}

export interface SilentEmployee {
	user_id: string;
	full_name: string;
	image_url: string | null;
	org_id: number | null;
	store_name: string | null;
}

export interface TopContentItem {
	id: number;
	name: string;
	image_url: string | null;
	count: number;
	unique_readers: number;
}

export interface ReadsAnalyticsPayload {
	success: boolean;
	category: Category;
	total_reads: number;
	active_readers: number;
	total_employees: number;
	by_employee: EmployeeReadStat[];
	by_org: OrgReadStat[];
	silent: SilentEmployee[];
	top_content: TopContentItem[];
}

export const getReadsAnalytics = query(categorySchema, async ({ category }) => {
	await getUserProfileWithRoleCheck([1]);
	const supabase = createAdminClient();
	const config = CONFIGS[category as Category];

	const now = new Date();
	const today = new Date(now);
	today.setHours(0, 0, 0, 0);
	const sevenDaysAgo = new Date(today);
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30);

	// 1. Raw reads in window
	const { data: reads } = await supabase
		.from(config.table)
		.select(`read_at, user_id, ${config.contentFk}`)
		.gte('read_at', sevenDaysAgo.toISOString())
		.order('read_at', { ascending: false });

	const readRows = (reads ?? []) as Array<{
		read_at: string;
		user_id: string;
		[key: string]: any;
	}>;

	// 2. Distinct user_ids and content_ids from reads
	const userIds = Array.from(new Set(readRows.map((r) => r.user_id)));
	const contentIds = Array.from(new Set(readRows.map((r) => r[config.contentFk]))).filter(
		(v) => v != null
	);

	// 3. Fetch profile + org info for active readers
	const { data: readerProfiles } = userIds.length
		? await supabase
				.from('profiles')
				.select('id, full_name, image_url, org_id, core_organizations(id, store_name)')
				.in('id', userIds)
		: { data: [] as any[] };

	const profileMap = new Map<string, any>();
	(readerProfiles ?? []).forEach((p: any) => profileMap.set(p.id, p));

	// 4. Fetch content info for top content
	let contentMap = new Map<number, { id: number; name: string; image_url: string | null }>();
	if (contentIds.length) {
		const selectFields = `id, ${config.nameField}, ${config.imageField}`;
		const { data: contentRows } = await supabase
			.from(config.contentTable)
			.select(selectFields)
			.in('id', contentIds as number[]);

		(contentRows ?? []).forEach((row: any) => {
			let image: string | null = null;
			const raw = row[config.imageField];
			if (typeof raw === 'string') image = raw;
			else if (Array.isArray(raw) && raw.length > 0) {
				const first = raw[0];
				if (typeof first === 'string') image = first;
				else if (first && typeof first === 'object' && typeof first.url === 'string')
					image = first.url;
			}
			contentMap.set(row.id, {
				id: row.id,
				name: row[config.nameField] ?? '—',
				image_url: image
			});
		});
	}

	// 5. Aggregate per-employee
	const dayKey = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

	// Precompute last 7 day keys (oldest → newest)
	const dayKeys: string[] = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		dayKeys.push(dayKey(d));
	}
	const dayIndex = new Map(dayKeys.map((k, i) => [k, i]));

	const employeeAgg = new Map<string, EmployeeReadStat>();
	const contentAgg = new Map<number, { count: number; readers: Set<string> }>();
	const orgAgg = new Map<number, { count: number; readers: Set<string>; store_name: string }>();

	for (const r of readRows) {
		const profile = profileMap.get(r.user_id);
		const orgRel = profile?.core_organizations;
		const org = Array.isArray(orgRel) ? orgRel[0] : orgRel;

		// Employee aggregation
		const existing = employeeAgg.get(r.user_id);
		const readDate = new Date(r.read_at);
		const key = isNaN(readDate.getTime()) ? null : dayKey(readDate);
		const idx = key != null ? dayIndex.get(key) : undefined;

		if (existing) {
			existing.count += 1;
			if (idx !== undefined) existing.daily[idx] += 1;
			if (r.read_at > existing.last_read) existing.last_read = r.read_at;
		} else {
			const daily = new Array(7).fill(0);
			if (idx !== undefined) daily[idx] = 1;
			employeeAgg.set(r.user_id, {
				user_id: r.user_id,
				full_name: profile?.full_name ?? '—',
				image_url: profile?.image_url ?? null,
				org_id: profile?.org_id ?? null,
				store_name: org?.store_name ?? null,
				count: 1,
				last_read: r.read_at,
				daily
			});
		}

		// Content aggregation
		const contentId = r[config.contentFk];
		if (contentId != null) {
			const c = contentAgg.get(contentId) ?? { count: 0, readers: new Set<string>() };
			c.count += 1;
			c.readers.add(r.user_id);
			contentAgg.set(contentId, c);
		}

		// Org aggregation
		if (org?.id != null) {
			const o = orgAgg.get(org.id) ?? {
				count: 0,
				readers: new Set<string>(),
				store_name: org.store_name ?? '—'
			};
			o.count += 1;
			o.readers.add(r.user_id);
			orgAgg.set(org.id, o);
		}
	}

	// 6. Silent employees — readable employees (role_id 1, 2, 4, 5) with 0 reads
	const { data: allEmployees } = await supabase
		.from('profiles')
		.select('id, full_name, image_url, org_id, role_id, core_organizations(id, store_name)')
		.neq('role_id', 3); // Exclude role_id 3 (unreadable);

	const silent: SilentEmployee[] = [];
	(allEmployees ?? []).forEach((p: any) => {
		if (!employeeAgg.has(p.id)) {
			const orgRel = p.core_organizations;
			const org = Array.isArray(orgRel) ? orgRel[0] : orgRel;
			silent.push({
				user_id: p.id,
				full_name: p.full_name ?? '—',
				image_url: p.image_url ?? null,
				org_id: p.org_id ?? null,
				store_name: org?.store_name ?? null
			});
		}
	});

	// 7. Shape outputs
	const by_employee = Array.from(employeeAgg.values()).sort((a, b) => b.count - a.count);

	const by_org: OrgReadStat[] = Array.from(orgAgg.entries())
		.map(([org_id, v]) => ({
			org_id,
			store_name: v.store_name,
			count: v.count,
			reader_count: v.readers.size
		}))
		.sort((a, b) => b.count - a.count);

	const top_content: TopContentItem[] = Array.from(contentAgg.entries())
		.map(([id, v]) => {
			const c = contentMap.get(id);
			return {
				id,
				name: c?.name ?? '—',
				image_url: c?.image_url ?? null,
				count: v.count,
				unique_readers: v.readers.size
			};
		})
		.sort((a, b) => b.count - a.count)
		.slice(0, 8);

	const payload: ReadsAnalyticsPayload = {
		success: true,
		category: category as Category,
		total_reads: readRows.length,
		active_readers: employeeAgg.size,
		total_employees: (allEmployees ?? []).length,
		by_employee,
		by_org,
		silent,
		top_content
	};

	return payload;
});
