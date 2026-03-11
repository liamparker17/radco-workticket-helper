import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Delivery note number = work_ticket_id + 144800
const DELIVERY_NOTE_OFFSET = 144800;

export async function GET() {
  const notes = await prisma.deliveryNote.findMany({
    include: {
      workTicket: { include: { customer: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workTicketId, quantityDelivered } = body;

    if (!workTicketId || !quantityDelivered) {
      return NextResponse.json(
        { error: "Work ticket ID and quantity delivered are required" },
        { status: 400 }
      );
    }

    // Verify the work ticket exists
    const ticket = await prisma.workTicket.findUnique({
      where: { id: workTicketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Work ticket not found" }, { status: 404 });
    }

    // Auto-calculate delivery note number
    const deliveryNoteNumber = workTicketId + DELIVERY_NOTE_OFFSET;

    // Create delivery note and mark ticket as COMPLETED in a transaction
    const [note] = await prisma.$transaction([
      prisma.deliveryNote.create({
        data: {
          deliveryNoteNumber,
          workTicketId,
          quantityDelivered: parseInt(quantityDelivered),
        },
        include: { workTicket: { include: { customer: true } } },
      }),
      prisma.workTicket.update({
        where: { id: workTicketId },
        data: { status: "COMPLETED" },
      }),
    ]);

    return NextResponse.json(note, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create delivery note" },
      { status: 500 }
    );
  }
}
