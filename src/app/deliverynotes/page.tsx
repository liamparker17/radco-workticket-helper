"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { printPdf } from "@/lib/printPdf";

interface DeliveryNote {
  id: number;
  deliveryNoteNumber: number;
  quantityDelivered: number;
  createdAt: string;
  workTicket: {
    id: number;
    jobDescription: string;
    customer: {
      name: string;
    };
  };
}

export default function DeliveryNotesPage() {
  const [notes, setNotes] = useState<DeliveryNote[]>([]);

  useEffect(() => {
    fetch("/api/deliverynotes")
      .then((r) => r.json())
      .then(setNotes);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Delivery Notes</h1>

      <p className="text-sm text-gray-500 mb-2">
        {notes.length} delivery note{notes.length !== 1 ? "s" : ""}
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4">DN #</th>
              <th className="pb-2 pr-4">Ticket #</th>
              <th className="pb-2 pr-4 hidden sm:table-cell">Date</th>
              <th className="pb-2 pr-4">Customer</th>
              <th className="pb-2 pr-4 hidden sm:table-cell">Job</th>
              <th className="pb-2 pr-4">Qty</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {notes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">
                  No delivery notes yet
                </td>
              </tr>
            ) : (
              notes.map((n) => (
                <tr key={n.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{n.deliveryNoteNumber}</td>
                  <td className="py-2 pr-4">
                    <Link
                      href={`/worktickets/${n.workTicket.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {n.workTicket.id}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 hidden sm:table-cell">
                    {new Date(n.createdAt).toLocaleDateString("en-ZA")}
                  </td>
                  <td className="py-2 pr-4">{n.workTicket.customer.name}</td>
                  <td className="py-2 pr-4 hidden sm:table-cell max-w-[200px] truncate">
                    {n.workTicket.jobDescription}
                  </td>
                  <td className="py-2 pr-4">{n.quantityDelivered}</td>
                  <td className="py-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={async () => {
                        const { DeliveryNotePDF } = await import("@/components/PDFTemplates");
                        await printPdf(<DeliveryNotePDF note={n} />);
                      }}
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
