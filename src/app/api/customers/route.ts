import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || "";
  const format = request.nextUrl.searchParams.get("format");
  const showArchived = request.nextUrl.searchParams.get("archived") === "true";

  const where: Record<string, unknown> = {
    archived: showArchived,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // CSV export
  if (format === "csv") {
    const header = "ID,Name,Telephone,Contact Person,Contact Cell,Email,Created\n";
    const rows = customers
      .map(
        (c) =>
          `${c.id},"${c.name}","${c.telephoneNumber || ""}","${c.contactPerson || ""}","${c.contactCell || ""}","${c.email || ""}","${c.createdAt.toISOString()}"`
      )
      .join("\n");
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=customers.csv",
      },
    });
  }

  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, telephoneNumber, contactPerson, contactCell, email } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: { name: name.trim(), telephoneNumber, contactPerson, contactCell, email },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, telephoneNumber, contactPerson, contactCell, email } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { name, telephoneNumber, contactPerson, contactCell, email },
    });

    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

// Archive/unarchive a customer (soft delete)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, archived } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Check if customer has open tickets before archiving
    if (archived) {
      const openTickets = await prisma.workTicket.count({
        where: { customerId: id, status: "OPEN" },
      });
      if (openTickets > 0) {
        return NextResponse.json(
          { error: `Cannot archive: customer has ${openTickets} open ticket(s)` },
          { status: 400 }
        );
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { archived },
    });

    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
