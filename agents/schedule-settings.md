# Schedule Management Feature - Agent Instructions

## 🎯 Project Context

You are working on a **multitenant cafe management application** built with:
- **SvelteKit** (frontend & backend)
- **Supabase** (PostgreSQL database with RLS)
- **TypeScript**

### Key Architecture Principles
- **Multitenant isolation**: Every table has `org_id` for tenant separation
- **Row Level Security (RLS)**: All queries are automatically filtered by `org_id` - you DON'T need to add `.eq('org_id', ...)` manually
- **Role-based access**: Uses `role_id` (1=super_admin, 2=admin, 3=employee)
- **Helper function**: `is_admin()` returns boolean if user has role_id IN (1,2)

---

## 📋 Step 1: Read & Understand the Codebase

Before starting, **read and analyze** these files to understand the project structure:

### 1. Database Schema & Types
```bash
# Read the schedule types
cat src/lib/types/schedule.types.ts

# Understand existing database patterns by checking similar features
# Look for patterns in existing tables and RLS policies
```

### 2. UI Component Patterns
```bash
# Check existing components structure
ls -la src/lib/components/

# Read a similar feature component to match styling/structure
cat src/lib/components/[similar-feature]/[Component].svelte
```


---

## 🔧 Step 2: Database Schema (Already Created)

The following tables exist in Supabase:

### Tables:
1. **weekly_schedules** - Το πρόγραμμα της εβδομάδας
2. **shifts** - Οι βάρδιες
3. **shift_change_requests** - Αιτήματα αλλαγών

### Key Points:
- ✅ RLS is ENABLED on all tables
- ✅ Policies ensure automatic `org_id` filtering
- ✅ Only admins (`role_id IN (1,2)`) can create/edit schedules
- ✅ All employees can view schedules and create change requests

**DO NOT** manually filter by `org_id` in queries - RLS handles this automatically!

---

## 🎯 Step 3: Feature Requirements

### Feature: Weekly Schedule Management

Build a complete schedule management system where admins can:
1. Create weekly schedules (draft mode)
2. Add/edit/delete shifts for employees
3. Publish schedules (makes them visible to all employees)
4. View schedule statistics

### User Stories:

#### Admin Workflows:
- [ ] Admin can create a new weekly schedule for a specific week
- [ ] Admin can see a grid view: 7 days (columns) × N employees (rows)
- [ ] Admin can click a cell to add a shift (opens modal)
- [ ] Admin can mark a day as ΡΕΠΟ (day_off)
- [ ] Admin can edit/delete existing shifts
- [ ] Admin can save as draft (work in progress)
- [ ] Admin can publish schedule (notifies employees)
- [ ] Admin can view validation errors before publishing

#### Employee Workflows:
- [ ] Employee can view published schedules (read-only)
- [ ] Employee can see their own shifts highlighted
- [ ] Employee can request shift changes
- [ ] Employee can swap shifts with colleagues

---

## 📐 Step 4: Implementation Plan

## 📐 Step 4: Implementation Plan

### 🎯 Development Approach

We will build this feature in **phases** with **review checkpoints** after each step:

1. **Backend Logic First** → Review → Approve
2. **Frontend Components** → Review → Approve  
3. **Integration & Testing** → Final Review

**IMPORTANT**: 
- ⚠️ **DO NOT write all code at once**
- ✅ Complete one phase → Stop → Wait for review
- ✅ After approval → Continue to next phase

---

## 🔧 Phase 1: Backend Logic (data.remote.ts)

### File Structure
```
src/lib/server/
└── data.remote.ts          # Add schedule-related functions here
```

### Context: Existing Patterns to Reference

Before writing, **study these files** for patterns:
```bash
# Study existing remote data functions
src/routes/(app)/settings/*/data.remote.ts

# Look for:
# - How functions are structured
# - Error handling patterns
# - Supabase query patterns
# - Return types
# - TypeScript usage
```

### Functions to Implement

Create these backend logic in `data.remote.ts`:

---

### ✅ Phase 1 Checkpoint

**After implementing these functions:**

1. ✋ **STOP and share the code**
2. 📝 I will review:
   - Function signatures
   - Error handling
   - Type safety
   - RLS compliance (no manual org_id filtering)
   - Pattern consistency with existing code
3. ✅ After approval → Continue to Phase 2

---

## 🎨 Phase 2: Frontend Components (Shadcn UI)

### Design Principles

- ✅ **Use existing Shadcn components** - DO NOT create new components
- ✅ **Reuse patterns** from existing routes (check `/settings/*` routes)
- ✅ **Badge colors** - Each employee has `badge_color` in profile, use it!
- ✅ **Responsive** - Mobile-first approach

### UI Layout (Target Design)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚙️ SCHEDULE MANAGEMENT                                                       │
│                                                                              │
│ [← Back to Schedule]  Week of Oct 20-26  [◀] [▶]                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 🛠️ QUICK ACTIONS                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ [+ Add Shift] [📋 Copy Last Week] [🔄 Apply Template] [📤 Export]          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 👥 SELECT EMPLOYEE                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Search employees...]                              📊 Hours: 0/40        │
│                                                                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│ │✓ 👤 Αλέξανδρος│ │ 👤 Δημήτρης   │ │ 👤 Γιάννης    │ │ 👤 Σταυρία    │       │
│ │  40h/week    │ │  38h/week    │ │  35h/week    │ │  32h/week    │       │
│ │  🟣 Admin    │ │  🔵 H.Barista│ │  🟢 Employee │ │  🟡 Employee │       │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📆 ΑΛΕΞΑΝΔΡΟΣ ΠΑΠΑΓΕΩΡΓΙΟΥ - WEEKLY SCHEDULE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    Mon 20         Tue 21         Wed 22         Thu 23                     │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐                 │
│ │ ✅ 7:30-15:30│ ➕ Add Shift │ ✅ 7:30-15:30│ ➕ Add Shift │                 │
│ │ [Edit] [×]  │             │ [Edit] [×]  │             │                 │
│ │             │             │             │             │                 │
│ │    8h       │             │    8h       │             │                 │
│ └─────────────┴─────────────┴─────────────┴─────────────┘                 │
│                                                                              │
│    Fri 24         Sat 25         Sun 26                Total: 40h          │
│ ┌─────────────┬─────────────┬─────────────┐                                │
│ │ ✅ 7:30-15:30│ ✅ 8:00-16:00│ 🔴 Day Off  │                                │
│ │ [Edit] [×]  │ [Edit] [×]  │ [Edit] [×]  │                                │
│ │             │             │             │                                │
│ │    8h       │    8h       │    0h       │                                │
│ └─────────────┴─────────────┴─────────────┘                                │
│                                                                              │
│ [💾 Save All Changes]  [🗑️ Clear Week]  [📋 Copy to Next Week]             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

**DO NOT implement yet - this is the plan:**

#### 1. **ScheduleHeader.svelte**
- Week navigation (◀ ▶ buttons)
- Back button
- Week display (Oct 20-26)

**Shadcn Components to use:**
- `Button` (from shadcn)
- `Card` (header wrapper)

---

#### 2. **QuickActions.svelte**
- Action buttons toolbar

**Shadcn Components to use:**
- `Button` variants
- `Tooltip` (for button hints)

---

#### 3. **EmployeeSelector.svelte**
- Searchable employee cards
- Badge color indicator (from `profile.badge_color`)
- Hours display per employee

**Shadcn Components to use:**
- `Input` (search)
- `Card` (employee cards)
- `Badge` (with dynamic color from DB)
- `ScrollArea` (if many employees)

**Key Feature:**
```svelte
<!-- Use badge_color from database -->
<Badge style="background-color: {employee.badge_color}">
  {employee.role_name}
</Badge>
```

---

#### 4. **WeeklyGrid.svelte**
- 7-day grid for selected employee
- Each day shows: existing shift OR "Add Shift" button
- Edit/Delete buttons per shift
- Total hours calculation

**Shadcn Components to use:**
- `Card` (day containers)
- `Button` (Edit, Delete, Add)
- `Badge` (shift status)

---

#### 5. **ShiftModal.svelte** (Dialog)
- Form to add/edit shift
- Fields: date, start_time, end_time, break_duration, shift_type, notes
- Validation

**Shadcn Components to use:**
- `Dialog` (modal wrapper)
- `Form` (shadcn form)
- `Input`, `Select` (form fields)
- `TimePicker` (if available) or `Input type="time"`
- `Textarea` (notes)
- `Button` (Save, Cancel)
-- And more if you want
---

### File Structure
```
src/routes/(app)/schedules/
├── +page.svelte                    # List of all schedules
├── data.remote.ts                 # Load schedules list
├── [id]/
│   ├── +page.svelte                # Main schedule editor (uses all components)
│   ├── data.remote.ts             # Load schedule data                # Client-side logic (optional)
└── components/
    ├── ScheduleHeader.svelte
    ├── QuickActions.svelte
    ├── EmployeeSelector.svelte
    ├── WeeklyGrid.svelte
    └── ShiftModal.svelte
```

---

### ✅ Phase 2 Checkpoint

**Implementation Steps:**

1. Start with **ScheduleHeader.svelte** → STOP → Review
2. Then **EmployeeSelector.svelte** → STOP → Review
3. Then **WeeklyGrid.svelte** → STOP → Review
4. Then **ShiftModal.svelte** → STOP → Review
5. Finally integrate in **+page.svelte** → STOP → Review

**Each component should:**
- ✅ Use Shadcn components only
- ✅ Follow existing patterns from `/settings` routes
- ✅ Be fully typed (TypeScript)
- ✅ Handle loading/error states

---

## 🔗 Phase 3: Integration & API Endpoints

**After Phase 1 & 2 are approved:**

Create API endpoints in `src/routes/api/schedules/` following existing patterns.

---

## 📋 Summary: Review Workflow
```
┌─────────────────┐
│ Phase 1: Backend│ → STOP → Review → ✅ Approved
└─────────────────┘
         ↓
┌─────────────────┐
│Phase 2: Frontend│ → Component 1 → Review → ✅
│  (One component │ → Component 2 → Review → ✅
│   at a time)    │ → Component 3 → Review → ✅
└─────────────────┘
         ↓
┌─────────────────┐
│ Phase 3: API &  │ → STOP → Review → ✅ Approved
│   Integration   │
└─────────────────┘
         ↓
    🎉 DONE!
```

**Key Rules:**
- ⛔ NO "write everything at once"
- ✅ Small increments → Review → Continue
- ✅ Use existing components/patterns
- ✅ Badge colors from DB
- ✅ Follow UI mockup exactly

---

## 🚀 Let's Start!

### Current Task (Phase 1):

> **Implement the backend functions in `data.remote.ts`**
> 
> Study existing `data.remote.ts` files in `/settings` routes first.
> Then implement functions 1-10 as specified above.
> 
> **STOP after completing and wait for review.**

---





## 🚀 Step 10: Implementation Order

Implement features in this order:

1. ✅ **Types** (already done)
2. **API Endpoints** (backend first)
   - Create schedule
   - Get schedule
   - Add/edit/delete shifts
   - Validate schedule
3. **Schedule List Page** (`/schedules`)
4. **Schedule Detail/Grid** (`/schedules/[id]`)
5. **Shift Modal** (add/edit UI)
6. **Validation Logic**
7. **Publish Flow**
8. **Employee View** (read-only)
9. **Polish & Testing**

---

## 💡 Tips for Success

- **Read before you write**: Always check if similar functionality exists
- **Match patterns**: Use same structure as existing features
- **Test incrementally**: Test each endpoint before moving to UI
- **Use types**: Let TypeScript catch errors early
- **Ask questions**: If something is unclear about the codebase structure, ask!

---



## ✅ Definition of Done

Feature is complete when:
- [ ] All API endpoints work and return proper responses
- [ ] Admin can create, edit, and publish schedules
- [ ] Grid view displays all shifts correctly
- [ ] Validation prevents publishing invalid schedules
- [ ] Employees can view published schedules
- [ ] Code follows existing patterns and style
- [ ] No TypeScript errors
- [ ] RLS security is working (tested with different users)
- [ ] Mobile responsive (if required)

---

## 🎯 Current Task

[I WILL ADD THE SPECIFIC TASK/INSTRUCTIONS HERE WHEN I'M READY]

Example:
> "Start by implementing the API endpoints in `/api/schedules/`. Create all CRUD operations following the patterns from existing API routes. Make sure to handle RLS properly and return consistent JSON responses."

---

## 📞 Questions to Ask Before Starting

If you're Claude Code and you've read this file, please confirm:

1. Do you understand the multitenant architecture and RLS behavior?
2. Have you identified similar features in the codebase to reference?
3. Do you understand the role-based permissions (admin vs employee)?
4. Are there any UI components or utilities already built that you should reuse?
5. What's unclear or needs more context before you start?

---

**Last Updated**: [Date]
**Feature Status**: 🚧 In Progress