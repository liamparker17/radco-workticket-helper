# CLAUDE.md - Work Ticket System

## Project Overview

A production work ticket and delivery note management app for a small workshop (Radco). Replaces a paper-based ticket book. Users create customers, issue work tickets, generate delivery notes, and print PDFs.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS 3 with custom utility classes in `globals.css`
- **Database**: PostgreSQL via Prisma 6 ORM
- **PDF Generation**: @react-pdf/renderer (client-side, dynamically imported with `ssr: false`)
- **Deployment target**: Vercel

## Commands

- `npm run dev` — start dev server
- `npm run build` — generate Prisma client + Next.js production build
- `npx prisma migrate dev --name <name>` — create and apply a migration
- `npx prisma db push` — push schema changes without migration (dev only)
- `npx prisma studio` — open Prisma database GUI

## Project Structure

```
prisma/schema.prisma              # Database schema (3 models: Customer, WorkTicket, DeliveryNote)
src/
  lib/prisma.ts                   # Prisma client singleton (prevents hot-reload duplication)
  components/
    PDFTemplates.tsx              # Both PDF templates: WorkTicketPDF + DeliveryNotePDF (named exports)
  app/
    layout.tsx                    # Root layout — client component with inline nav bar
    globals.css                   # Tailwind directives + reusable .btn, .input, .label, .card classes
    page.tsx                      # Dashboard — open ticket count, recent tickets, quick nav
    customers/page.tsx            # Customer CRUD — create, edit, search, list, CSV export
    worktickets/page.tsx          # Work ticket list — create, filter by status, search, CSV export
    worktickets/[id]/page.tsx     # Ticket detail — view, print PDF, generate delivery note
    deliverynotes/page.tsx        # Delivery note list — view all, print PDF
    api/
      customers/route.ts         # GET (list/search/CSV), POST (create), PUT (update)
      worktickets/route.ts        # GET (list/filter/search/CSV), POST (create)
      worktickets/[id]/route.ts   # GET (detail), PATCH (update status/fields)
      deliverynotes/route.ts      # GET (list), POST (create — auto-calculates DN number)
```

## Database Schema

Three tables with snake_case column names, mapped to camelCase in Prisma:

- **customers** — id, name, telephone_number, contact_person, contact_cell, email, created_at
- **work_tickets** — id, created_at, customer_id (FK→customers), customer_order_number, job_description, quantity, status (OPEN|COMPLETED)
- **delivery_notes** — id, delivery_note_number, work_ticket_id (FK→work_tickets), quantity_delivered, created_at

### Relationships
- Customer → many WorkTickets
- WorkTicket → many DeliveryNotes

## Critical Business Rules

### Delivery Note Number
The delivery note number is auto-calculated by the backend:
```
delivery_note_number = work_ticket_id + 144800
```
This offset (144800) matches the client's existing paper numbering system. It is hardcoded in `src/app/api/deliverynotes/route.ts` as `DELIVERY_NOTE_OFFSET`. Do NOT change this without confirming with the user.

### Delivery Note Creation
When a delivery note is created, the associated work ticket is automatically marked as `COMPLETED`. This happens in a Prisma `$transaction` in the POST handler of `api/deliverynotes/route.ts`.

### PDF Layout
- **Work Ticket PDF**: Single copy per page, A4 format
- **Delivery Note PDF**: TWO copies on a single A4 page (office copy + customer copy), each with signature lines. This is intentional for the user to cut and have both parties sign.

## Important Implementation Details

### @react-pdf/renderer in Next.js
This library is ESM-only and requires special config:
1. `next.config.js` sets `experimental.esmExternals: "loose"` — without this the build fails
2. `next.config.js` sets `webpack.resolve.alias.canvas = false` — prevents Node canvas dependency errors
3. PDF components are in `src/components/PDFTemplates.tsx` as named exports. They must be dynamically imported with `ssr: false`:
   ```ts
   const WorkTicketPDF = dynamic(
     () => import("@/components/PDFTemplates").then((m) => m.WorkTicketPDF),
     { ssr: false }
   );
   ```
4. `PDFDownloadLink` from `@react-pdf/renderer` must also be dynamically imported with `ssr: false`

### Layout is a Client Component
`layout.tsx` uses `"use client"` because it contains the navigation bar which uses `usePathname()` for active link highlighting. This means the `metadata` export cannot be used — instead, `<title>` and `<meta>` are set directly in `<head>`.

### API Route Patterns
- All API routes use Next.js App Router `route.ts` convention
- Dynamic route params use `params: Promise<{ id: string }>` pattern (Next.js 15 async params)
- CSV export is triggered by `?format=csv` query parameter on GET endpoints
- Search is triggered by `?search=` query parameter
- Work ticket filtering by `?status=OPEN` or `?status=COMPLETED`

### Custom CSS Classes
Defined in `globals.css` using `@layer components`:
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger` — button styles
- `.input` — form input styling
- `.label` — form label styling
- `.card` — white card container with shadow and border

### Date Formatting
All dates use `en-ZA` locale (South African format: YYYY/MM/DD) via `toLocaleDateString("en-ZA")`.

## Environment Variables

Only one required:
- `DATABASE_URL` — PostgreSQL connection string (see `.env.example`)

## Common Maintenance Tasks

### Adding a new field to a table
1. Add the field to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_field_name`
3. Update the relevant API route to accept/return the field
4. Update the page component to display/edit the field
5. If the field appears on a PDF, update the relevant export in `src/components/PDFTemplates.tsx`

### Changing the delivery note offset
Edit `DELIVERY_NOTE_OFFSET` in `src/app/api/deliverynotes/route.ts`. Also update the preview text in `src/app/worktickets/[id]/page.tsx` which shows the calculated number before creation.

### Adding a new page
1. Create `src/app/<route>/page.tsx` as a `"use client"` component
2. Add the route to the `navLinks` array in `src/app/layout.tsx`

### Adding a new API endpoint
Create `src/app/api/<name>/route.ts` exporting async functions named `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`.

### Adding a new PDF template
Add a new named export to `src/components/PDFTemplates.tsx` and dynamically import it with `ssr: false` in the consuming page.

## Gotchas

- The Prisma client singleton in `src/lib/prisma.ts` stores the client on `globalThis` to survive Next.js hot reloads. Do not create additional `new PrismaClient()` instances elsewhere.
- PDF components cannot be server-rendered. Always use `dynamic(() => import("@/components/PDFTemplates").then(m => m.ComponentName), { ssr: false })`.
- The `next.config.js` uses CommonJS (`module.exports`) not ESM — this is intentional for compatibility.
- All pages are client components (`"use client"`) because they fetch data client-side and manage form state.
- Layout is also a client component due to `usePathname()` — do not add `export const metadata` to it.
