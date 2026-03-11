import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticketId = parseInt(id);

  if (isNaN(ticketId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const ticket = await prisma.workTicket.findUnique({
    where: { id: ticketId },
    include: { customer: true, deliveryNotes: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json(ticket);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticketId = parseInt(id);
  const body = await request.json();

  const ticket = await prisma.workTicket.update({
    where: { id: ticketId },
    data: body,
    include: { customer: true, deliveryNotes: true },
  });

  return NextResponse.json(ticket);
}
