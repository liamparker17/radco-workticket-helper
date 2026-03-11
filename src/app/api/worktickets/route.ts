import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const search = request.nextUrl.searchParams.get("search") || "";
  const format = request.nextUrl.searchParams.get("format");

  const where: Record<string, unknown> = {};
  if (status === "OPEN" || status === "COMPLETED") {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { jobDescription: { contains: search, mode: "insensitive" } },
      { customerOrderNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const tickets = await prisma.workTicket.findMany({
    where,
    include: { customer: true, deliveryNotes: true },
    orderBy: { createdAt: "desc" },
  });

  // CSV export
  if (format === "csv") {
    const header =
      "Ticket #,Date,Customer,Order Number,Job Description,Quantity,Status\n";
    const rows = tickets
      .map(
        (t) =>
          `${t.id},"${t.createdAt.toISOString()}","${t.customer.name}","${t.customerOrderNumber || ""}","${t.jobDescription}",${t.quantity},${t.status}`
      )
      .join("\n");
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=worktickets.csv",
      },
    });
  }

  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, customerOrderNumber, jobDescription, quantity } = body;

    if (!customerId || !jobDescription?.trim() || !quantity) {
      return NextResponse.json(
        { error: "Customer, job description, and quantity are required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.workTicket.create({
      data: {
        customerId,
        customerOrderNumber,
        jobDescription: jobDescription.trim(),
        quantity: parseInt(quantity),
      },
      include: { customer: true },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create work ticket" }, { status: 500 });
  }
}
