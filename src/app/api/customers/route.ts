import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || "";
  const format = request.nextUrl.searchParams.get("format");

  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { contactPerson: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
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
