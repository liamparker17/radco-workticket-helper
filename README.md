# Work Ticket System

A minimal work ticket and delivery note management system for small workshops. Built with Next.js, Prisma, PostgreSQL, and TailwindCSS.

## Project Structure

```
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with navigation
│   │   ├── page.tsx            # Dashboard
│   │   ├── globals.css         # Tailwind + custom styles
│   │   ├── customers/
│   │   │   └── page.tsx        # Customer management
│   │   ├── worktickets/
│   │   │   ├── page.tsx        # Work ticket list
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Work ticket detail + PDF
│   │   ├── deliverynotes/
│   │   │   └── page.tsx        # Delivery notes list + PDF
│   │   └── api/
│   │       ├── customers/
│   │       │   └── route.ts    # GET, POST, PUT
│   │       ├── worktickets/
│   │       │   ├── route.ts    # GET, POST
│   │       │   └── [id]/
│   │       │       └── route.ts # GET, PATCH
│   │       └── deliverynotes/
│   │           └── route.ts    # GET, POST
│   ├── lib/
│   │   └── prisma.ts           # Prisma client singleton
│   └── components/
│       ├── Nav.tsx              # Navigation bar
│       ├── WorkTicketPDF.tsx    # Work ticket PDF template
│       └── DeliveryNotePDF.tsx  # Delivery note PDF (2 copies)
├── .env.example
├── package.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
└── tsconfig.json
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up PostgreSQL

Create a PostgreSQL database. You can use:
- **Local**: Install PostgreSQL and create a database
- **Neon** (recommended for Vercel): https://neon.tech
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database connection string:

```
DATABASE_URL="postgresql://user:password@host:5432/worktickets"
```

### 4. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 5. Start development server

```bash
npm run dev
```

Open http://localhost:3000

## Deploying to Vercel

### 1. Create a PostgreSQL database

Use **Neon** (free tier available) or **Supabase**:

1. Create an account at https://neon.tech
2. Create a new project
3. Copy the connection string

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to https://vercel.com
2. Import your GitHub repository
3. Add environment variable:
   - `DATABASE_URL` = your PostgreSQL connection string
4. Deploy

### 4. Run migrations on production database

```bash
DATABASE_URL="your-production-connection-string" npx prisma migrate deploy
```

Or use `npx prisma db push` for initial setup.

## Features

- **Customer Management**: Create, edit, search customers with CSV export
- **Work Tickets**: Create tickets linked to customers, filter by status, CSV export
- **Delivery Notes**: Auto-generated delivery note numbers (ticket ID + 144800)
- **PDF Generation**: Print work tickets and delivery notes (2 copies per page with signature lines)
- **Search**: Search across customers and tickets
- **Mobile Friendly**: Responsive design

## Delivery Note Number Formula

```
delivery_note_number = work_ticket_id + 144800
```

| Work Ticket | Delivery Note |
|-------------|---------------|
| 1           | 144801        |
| 2           | 144802        |
| 100         | 144900        |

## API Endpoints

| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| GET    | /api/customers        | List/search customers |
| POST   | /api/customers        | Create customer       |
| PUT    | /api/customers        | Update customer       |
| GET    | /api/worktickets      | List/filter tickets   |
| POST   | /api/worktickets      | Create ticket         |
| GET    | /api/worktickets/[id] | Get ticket details    |
| PATCH  | /api/worktickets/[id] | Update ticket         |
| GET    | /api/deliverynotes    | List delivery notes   |
| POST   | /api/deliverynotes    | Create delivery note  |

### CSV Export

- `GET /api/customers?format=csv`
- `GET /api/worktickets?format=csv`
