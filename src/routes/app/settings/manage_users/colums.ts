import type { ColumnDef } from "@tanstack/table-core";
import type { Profile } from "$lib/models/database.types";
import { createRawSnippet } from "svelte";
import { renderSnippet } from "$lib/components/ui/data-table/index.js";
import DataTableActions from "./data-table-actions.svelte";
import { renderComponent } from "$lib/components/ui/data-table/index.js";
import DataTableEmailButton from "./data-table-email-button.svelte";


export const columns: ColumnDef<Profile>[] = [
    {
        accessorKey: "id",
        header: () => null,
        // This hides the column from display
        enableHiding: true,
        // Set default hidden state
        meta: {
        hidden: true,
        },
        // Or you can use this to prevent it from showing at all
        cell: () => null,
    },
    {
    accessorKey: "image_url",
    header: "Image",
    cell: ({ row }) => {
      const avatarSnippet = createRawSnippet<[{ imageUrl: string }]>(
        (getImageUrl) => {
          const { imageUrl } = getImageUrl();
          return {
            render: () => `<img src="${imageUrl}" alt="Avatar" class="w-12 h-12 rounded-full object-cover" />`,
          };
        }
      );
      return renderSnippet(avatarSnippet, {
        imageUrl: row.original.image_url,
      });
    },
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "email",
    header: ({ column }) =>
      renderComponent(DataTableEmailButton, {
        onclick: column.getToggleSortingHandler(),
      }),
  },
  {
    accessorKey: "org_id",
    header: "OrgId",
  },
  {
  accessorKey: "role_name",
  header: "Role",
  cell: ({ row }) => {
    const badgeSnippet = createRawSnippet<[{ roleName: string; badgeColor: string }]>(
      (getData) => {
        const { roleName, badgeColor } = getData();

        return {
          render: () => `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent text-white hover:opacity-90" style="background-color: ${badgeColor};">${roleName}</span>`,
        };
      }
    );
    return renderSnippet(badgeSnippet, {
      roleName: row.original.role_name,
      badgeColor: row.original.badge_color || '#3b82f6',
    });
  },
  // ADD THIS filterFn
  filterFn: (row, id, value) => {
    return value.includes(row.getValue(id));
  },
},
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const dateSnippet = createRawSnippet<[{ createdAt: string }]>(
        (getCreatedAt) => {
          const { createdAt } = getCreatedAt();
          const formatted = new Date(createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          return {
            render: () => `<div>${formatted}</div>`,
          };
        }
      );
      return renderSnippet(dateSnippet, {
        createdAt: row.original.created_at,
      });
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      // Pass any data you need to the component
      return renderComponent(DataTableActions, {
        id: row.original.id,
        username: row.original.username,
        role_id: row.original.role_id,
        role_name: row.original.role_name,
        badge_color: row.original.badge_color,
        can_close_register: row.original.can_close_register
      });
    },
  },
];