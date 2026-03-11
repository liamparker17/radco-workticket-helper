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
  try {
    const { id } = await params;
    const ticketId = parseInt(id);
    const body = await request.json();

    // Fetch current ticket to check status
    const current = await prisma.workTicket.findUnique({
      where: { id: ticketId },
    });

    if (!current) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Cancel a ticket — requires a reason
    if (body.status === "CANCELLED") {
      if (current.status === "COMPLETED") {
        return NextResponse.json(
          { error: "Cannot cancel a completed ticket" },
          { status: 400 }
        );
      }
      if (!body.cancelReason?.trim()) {
        return NextResponse.json(
          { error: "A reason is required to cancel a ticket" },
          { status: 400 }
        );
      }

      const ticket = await prisma.workTicket.update({
        where: { id: ticketId },
        data: {
          status: "CANCELLED",
          cancelReason: body.cancelReason.trim(),
          cancelledAt: new Date(),
        },
        include: { customer: true, deliveryNotes: true },
      });
      return NextResponse.json(ticket);
    }

    // Edit ticket — only allowed if still OPEN
    if (current.status !== "OPEN") {
      return NextResponse.json(
        { error: "Only open tickets can be edited" },
        { status: 400 }
      );
    }

    // Only allow safe fields to be updated
    const updateData: Record<string, unknown> = {};
    if (body.customerOrderNumber !== undefined) updateData.customerOrderNumber = body.customerOrderNumber;
    if (body.jobDescription !== undefined) updateData.jobDescription = body.jobDescription.trim();
    if (body.quantity !== undefined) {
      const qty = parseInt(body.quantity);
      if (qty < 1) {
        return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
      }
      updateData.quantity = qty;
    }

    const ticket = await prisma.workTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: { customer: true, deliveryNotes: true },
    });

    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
