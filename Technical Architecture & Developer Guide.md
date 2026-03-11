Work Ticket System Dev Guide

## Project Overview

A production work ticket and delivery note management app. Replaces a paper-based ticket book. Users create customers, issue work tickets, generate delivery notes, and print PDFs.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS 3 with custom utility classes in `globals.css`
- **Database**: PostgreSQL via Prisma 6 ORM (hosted on Neon)
- **PDF Generation**: @react-pdf/renderer (client-side, dynamically imported with `ssr: false`)
- **Deployment**: Vercel — https://work-ticket-system.vercel.app

## Commands

- `npm run dev` — start dev server
- `npm run build` — generate Prisma client + Next.js production build
- `npx prisma migrate dev --name <name>` — create and apply a migration
- `npx prisma db push` — push schema changes without migration (dev only)
- `npx prisma studio` — open Prisma database GUI
- `vercel --prod` — deploy to production

## Project Structure

```
prisma/schema.prisma              # Database schema (3 models: Customer, WorkTicket, DeliveryNote)
src/
  lib/prisma.ts                   # Prisma client singleton (prevents hot-reload duplication)
  components/
    PDFTemplates.tsx              # Both PDF templates: WorkTicketPDF + DeliveryNotePDF (named exports)
    UI.tsx                        # Shared UI: ConfirmModal, Toast, StatusBadge
  app/
    layout.tsx                    # Root layout — client component with inline nav bar
    globals.css                   # Tailwind directives + reusable .btn, .input, .label, .card classes
    page.tsx                      # Dashboard — stats (open/completed/cancelled/total), recent tickets
    customers/page.tsx            # Customer CRUD — create, edit, search, archive/restore, CSV export
    worktickets/page.tsx          # Work ticket list — create, filter by status, search, CSV export
    worktickets/[id]/page.tsx     # Ticket detail — view, edit, cancel, print PDF, generate delivery note
    deliverynotes/page.tsx        # Delivery note list — view all, print PDF
    api/
      customers/route.ts         # GET (list/search/CSV), POST (create), PUT (update), PATCH (archive/restore)
      worktickets/route.ts        # GET (list/filter/search/CSV), POST (create)
      worktickets/[id]/route.ts   # GET (detail), PATCH (edit/cancel)
      deliverynotes/route.ts      # GET (list), POST (create — auto-calculates DN number)
```

## Database Schema

Three tables with snake_case column names, mapped to camelCase in Prisma:

- **customers** — id, name, telephone_number, contact_person, contact_cell, email, archived (bool), created_at
- **work_tickets** — id, created_at, customer_id (FK), customer_order_number, job_description, quantity, status (OPEN|COMPLETED|CANCELLED), cancel_reason, cancelled_at
- **delivery_notes** — id, delivery_note_number, work_ticket_id (FK), quantity_delivered, created_at

### Relationships
- Customer → many WorkTickets
- WorkTicket → many DeliveryNotes

## Critical Business Rules

### Soft Delete / Accountability
- **Customers** are archived, not deleted. Archived customers are hidden from dropdowns and lists by default, but can be viewed and restored. Cannot archive a customer with open tickets.
- **Work tickets** are cancelled with a mandatory reason, not deleted. Cancelled tickets remain visible with a red banner showing the reason and date. Cannot cancel completed tickets.
- **Delivery notes** cannot be deleted or cancelled.

### Delivery Note Number
Auto-calculated by the backend:
```
delivery_note_number = work_ticket_id + 144800
```
Hardcoded in `src/app/api/deliverynotes/route.ts` as `DELIVERY_NOTE_OFFSET`. Do NOT change without confirming with user.

### Delivery Note Creation
When a delivery note is created, the work ticket is automatically marked as `COMPLETED` in a Prisma `$transaction`. Only open tickets can have delivery notes created. A confirmation dialog is shown before creation.

### Editing Work Tickets
Only OPEN tickets can be edited. Editable fields: customer order number, job description, quantity. Customer cannot be changed after creation.

### PDF Layout
- **Work Ticket PDF**: Single copy per page, A4 format
- **Delivery Note PDF**: TWO copies on a single A4 page (office copy + customer copy) with signature lines

## Important Implementation Details

### UI Components (`src/components/UI.tsx`)
- **ConfirmModal** — used before cancel, archive, and delivery note creation. Supports an optional required text input (e.g. cancel reason).
- **Toast** — success/error notification, auto-dismisses after 3 seconds.
- **StatusBadge** — colored badge for OPEN (yellow), COMPLETED (green), CANCELLED (red).

### @react-pdf/renderer in Next.js
ESM-only library requiring special config:
1. `next.config.js` sets `experimental.esmExternals: "loose"`
2. `next.config.js` sets `webpack.resolve.alias.canvas = false`
3. PDF components dynamically imported with `ssr: false`:
   ```ts
   const WorkTicketPDF = dynamic(
     () => import("@/components/PDFTemplates").then((m) => m.WorkTicketPDF),
     { ssr: false }
   );
   ```

### Layout is a Client Component
Uses `usePathname()` for nav highlighting. Cannot use `export const metadata` — uses manual `<title>` in `<head>`.

### API Route Patterns
- Dynamic params: `params: Promise<{ id: string }>` (Next.js 15 async params)
- CSV export: `?format=csv` on GET endpoints
- Search: `?search=` query parameter
- Ticket filtering: `?status=OPEN|COMPLETED|CANCELLED`
- Customer filtering: `?archived=true` to show archived

### Mobile Responsiveness
- Non-essential table columns hidden on small screens with `hidden sm:table-cell`
- Forms use responsive grid (`grid-cols-1 sm:grid-cols-2`)
- Job description columns use `max-w-[200px] truncate` on mobile

### Date Formatting
All dates use `en-ZA` locale (YYYY/MM/DD) via `toLocaleDateString("en-ZA")`.

## Environment Variables

Only one required:
- `DATABASE_URL` — PostgreSQL connection string (see `.env.example`)

## Common Maintenance Tasks

### Adding a new field to a table
1. Add the field to `prisma/schema.prisma`
2. Run `npx prisma db push` (or `prisma migrate dev`)
3. Update the relevant API route
4. Update the page component
5. If on PDF, update `src/components/PDFTemplates.tsx`
6. Deploy: `vercel --prod`

### Changing the delivery note offset
Edit `DELIVERY_NOTE_OFFSET` in `src/app/api/deliverynotes/route.ts`. Also update the preview in `src/app/worktickets/[id]/page.tsx`.

### Adding a new page
1. Create `src/app/<route>/page.tsx` as `"use client"` component
2. Add to `navLinks` array in `src/app/layout.tsx`

### Adding a new API endpoint
Create `src/app/api/<name>/route.ts` exporting `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`.

## Gotchas

- Prisma singleton in `src/lib/prisma.ts` — do not create additional `new PrismaClient()` instances.
- PDF components cannot be server-rendered — always dynamic import with `ssr: false`.
- `next.config.js` uses CommonJS (`module.exports`) — intentional for compatibility.
- All pages are client components (`"use client"`).
- Layout is a client component — do not add `export const metadata`.
- Cancelling a ticket requires a reason (enforced by both UI modal and API).
- Archiving a customer is blocked if they have open tickets (enforced by API).
