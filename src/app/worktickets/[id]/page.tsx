"use client";

import { useEffect, useState, use } from "react";
import dynamic from "next/dynamic";

// Dynamically import PDF components (they use browser APIs)
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span>Loading PDF...</span> }
);

const WorkTicketPDF = dynamic(
  () => import("@/components/PDFTemplates").then((m) => m.WorkTicketPDF),
  { ssr: false }
);

interface WorkTicket {
  id: number;
  createdAt: string;
  customerOrderNumber: string | null;
  jobDescription: string;
  quantity: number;
  status: string;
  customer: {
    id: number;
    name: string;
    telephoneNumber: string | null;
    contactPerson: string | null;
    contactCell: string | null;
    email: string | null;
  };
  deliveryNotes: Array<{
    id: number;
    deliveryNoteNumber: number;
    quantityDelivered: number;
    createdAt: string;
  }>;
}

export default function WorkTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<WorkTicket | null>(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryQty, setDeliveryQty] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/worktickets/${id}`)
      .then((r) => r.json())
      .then(setTicket);
  }, [id]);

  const generateDeliveryNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!deliveryQty) {
      setError("Quantity is required");
      return;
    }

    const res = await fetch("/api/deliverynotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workTicketId: parseInt(id),
        quantityDelivered: parseInt(deliveryQty),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    setShowDeliveryForm(false);
    setDeliveryQty("");
    // Reload ticket to show updated status and delivery notes
    const updated = await fetch(`/api/worktickets/${id}`);
    setTicket(await updated.json());
  };

  if (!ticket) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Work Ticket #{ticket.id}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket details */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Ticket Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Ticket #:</dt>
              <dd>{ticket.id}</dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Date:</dt>
              <dd>{new Date(ticket.createdAt).toLocaleDateString("en-ZA")}</dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Order Number:</dt>
              <dd>{ticket.customerOrderNumber || "-"}</dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Job Description:</dt>
              <dd>{ticket.jobDescription}</dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Quantity:</dt>
              <dd>{ticket.quantity}</dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Status:</dt>
              <dd>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    ticket.status === "OPEN"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {ticket.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Customer details */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Name:</dt>
              <dd>{ticket.customer.name}</dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Telephone:</dt>
              <dd>{ticket.customer.telephoneNumber || "-"}</dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Contact Person:</dt>
              <dd>{ticket.customer.contactPerson || "-"}</dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Contact Cell:</dt>
              <dd>{ticket.customer.contactCell || "-"}</dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Email:</dt>
              <dd>{ticket.customer.email || "-"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 flex-wrap">
        <PDFDownloadLink
          document={<WorkTicketPDF ticket={ticket} />}
          fileName={`work-ticket-${ticket.id}.pdf`}
          className="btn-primary"
        >
          {({ loading }) => (loading ? "Preparing PDF..." : "Print Work Ticket")}
        </PDFDownloadLink>

        {ticket.status === "OPEN" && (
          <button
            onClick={() => setShowDeliveryForm(!showDeliveryForm)}
            className="btn-success"
          >
            Generate Delivery Note
          </button>
        )}
      </div>

      {/* Delivery note form */}
      {showDeliveryForm && (
        <form onSubmit={generateDeliveryNote} className="card mt-4 max-w-md">
          <h3 className="font-semibold mb-3">Create Delivery Note</h3>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="mb-3">
            <label className="label">Quantity Delivered *</label>
            <input
              type="number"
              min="1"
              className="input"
              value={deliveryQty}
              onChange={(e) => setDeliveryQty(e.target.value)}
            />
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Delivery note number will be: {parseInt(id) + 144800}
          </p>
          <button type="submit" className="btn-success">
            Create
          </button>
        </form>
      )}

      {/* Delivery notes */}
      {ticket.deliveryNotes.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold mb-4">Delivery Notes</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">DN #</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Qty Delivered</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {ticket.deliveryNotes.map((dn) => (
                <tr key={dn.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">
                    {dn.deliveryNoteNumber}
                  </td>
                  <td className="py-2 pr-4">
                    {new Date(dn.createdAt).toLocaleDateString("en-ZA")}
                  </td>
                  <td className="py-2 pr-4">{dn.quantityDelivered}</td>
                  <td className="py-2">
                    <a
                      href={`/deliverynotes?highlight=${dn.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
