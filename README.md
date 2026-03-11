# Work Ticket System

A minimal work ticket and delivery note management system built for Radco's workshop. Replaces a manual paper-based ticket book.

**Live URL:** https://work-ticket-system.vercel.app

---

## What It Does

1. **Store customers** — name, telephone, contact person, cell, email
2. **Create work tickets** — linked to a customer, with job description, quantity, and order number
3. **Print work tickets** — generates a PDF for each ticket
4. **Generate delivery notes** — created from a work ticket, auto-numbers using formula `ticket_id + 144800`
5. **Print delivery notes** — PDF with two copies on one page (office + customer) with signature lines

---

## Tech Stack

| Layer      | Technology                   |
|------------|------------------------------|
| Framework  | Next.js 15 (App Router)      |
| Language   | TypeScript                   |
| Styling    | TailwindCSS 3                |
| Database   | PostgreSQL (hosted on Neon)   |
| ORM        | Prisma 6                     |
| PDF        | @react-pdf/renderer          |
| Hosting    | Vercel                       |

---

## Project Structure

```
prisma/schema.prisma              # Database schema (3 tables)
src/
  lib/prisma.ts                   # Prisma client singleton
  components/
    PDFTemplates.tsx              # Work ticket + delivery note PDF templates
  app/
    layout.tsx                    # Root layout with inline navigation bar
    globals.css                   # Tailwind + custom button/input/card classes
    page.tsx                      # Dashboard
    customers/page.tsx            # Customer list, create, edit, search
    worktickets/page.tsx          # Work ticket list, create, filter, search
    worktickets/[id]/page.tsx     # Ticket detail, print PDF, generate delivery note
    deliverynotes/page.tsx        # Delivery note list, print PDF
    api/
      customers/route.ts         # GET, POST, PUT
      worktickets/route.ts        # GET, POST
      worktickets/[id]/route.ts   # GET, PATCH
      deliverynotes/route.ts      # GET, POST
```

---

## Database

### Hosted on Neon

- **Provider:** Neon (neon.tech)
- **Region:** US East 1
- **Database name:** neondb
- **Manage at:** https://console.neon.tech

### Tables

**customers**
| Column           | Type     | Notes          |
|------------------|----------|----------------|
| id               | int (PK) | Auto-increment |
| name             | text     | Required       |
| telephone_number | text     | Optional       |
| contact_person   | text     | Optional       |
| contact_cell     | text     | Optional       |
| email            | text     | Optional       |
| created_at       | datetime | Auto-set       |

**work_tickets**
| Column                | Type     | Notes                    |
|-----------------------|----------|--------------------------|
| id                    | int (PK) | Auto-increment           |
| customer_id           | int (FK) | References customers.id  |
| customer_order_number | text     | Optional                 |
| job_description       | text     | Required                 |
| quantity              | int      | Required                 |
| status                | enum     | OPEN or COMPLETED        |
| created_at            | datetime | Auto-set                 |

**delivery_notes**
| Column               | Type     | Notes                       |
|----------------------|----------|-----------------------------|
| id                   | int (PK) | Auto-increment              |
| delivery_note_number | int      | Auto: work_ticket_id+144800 |
| work_ticket_id       | int (FK) | References work_tickets.id  |
| quantity_delivered    | int      | Required                    |
| created_at           | datetime | Auto-set                    |

---

## Business Rules

### Delivery Note Numbering
```
delivery_note_number = work_ticket_id + 144800
```
This matches Radco's existing paper numbering system. The offset is defined as `DELIVERY_NOTE_OFFSET` in `src/app/api/deliverynotes/route.ts`.

### Auto-Complete Tickets
When a delivery note is created, the linked work ticket is automatically marked as `COMPLETED`.

### Delivery Note PDF
Prints **two copies on one A4 page** — an office copy and a customer copy, each with signature lines. This is by design so the page can be cut and both parties sign.

---

## API Endpoints

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | /api/customers        | List customers (?search=, ?format=csv) |
| POST   | /api/customers        | Create customer                      |
| PUT    | /api/customers        | Update customer                      |
| GET    | /api/worktickets      | List tickets (?status=, ?search=, ?format=csv) |
| POST   | /api/worktickets      | Create ticket                        |
| GET    | /api/worktickets/[id] | Get ticket with customer + delivery notes |
| PATCH  | /api/worktickets/[id] | Update ticket fields                 |
| GET    | /api/deliverynotes    | List all delivery notes              |
| POST   | /api/deliverynotes    | Create delivery note (auto-numbers, auto-completes ticket) |

---

## Hosting & Deployment

### Current Setup

| Service  | Dashboard                                           |
|----------|-----------------------------------------------------|
| Vercel   | https://vercel.com/liamparker17s-projects/work-ticket-system |
| Neon DB  | https://console.neon.tech                           |

### Environment Variables (Vercel)

Only one:
- `DATABASE_URL` — PostgreSQL connection string (set in Vercel project settings)

### Redeploying

Any push to the linked repo will auto-deploy on Vercel. Or manually:

```bash
cd "Radco Workticket helper"
vercel --prod
```

### Database Changes

If you change `prisma/schema.prisma`:

```bash
# Apply to Neon database
npx prisma db push

# Then redeploy
vercel --prod
```

---

## Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env with your database URL
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Push schema to database
npx prisma db push

# 4. Start dev server
npm run dev
# Open http://localhost:3000
```

### Useful Commands

| Command                              | What it does                     |
|--------------------------------------|----------------------------------|
| `npm run dev`                        | Start local dev server           |
| `npm run build`                      | Production build                 |
| `npx prisma studio`                 | Open database GUI in browser     |
| `npx prisma db push`                | Push schema changes to database  |
| `npx prisma migrate dev --name x`   | Create a versioned migration     |
| `vercel --prod`                      | Deploy to production             |
| `vercel env ls`                      | List Vercel environment vars     |

---

## CSV Exports

- **Customers:** `GET /api/customers?format=csv` or click "Export CSV" on the Customers page
- **Work Tickets:** `GET /api/worktickets?format=csv` or click "Export CSV" on the Work Tickets page

---

## Troubleshooting

| Problem                          | Fix                                                |
|----------------------------------|----------------------------------------------------|
| Build fails with ESM error       | Ensure `esmExternals: "loose"` is in next.config.js |
| PDF download not working         | PDF components must be dynamically imported with `ssr: false` |
| Database connection error        | Check DATABASE_URL in .env or Vercel env vars       |
| Prisma client error after schema change | Run `npx prisma generate` then rebuild       |
| Vercel deploy fails              | Check build logs: `vercel inspect <url> --logs`     |

---

## For Developers / AI Assistants

See **CLAUDE.md** for detailed technical reference including:
- Implementation gotchas
- How to add fields, pages, API routes, and PDF templates
- Custom CSS class reference
- Architecture decisions and constraints
