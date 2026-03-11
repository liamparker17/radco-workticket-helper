"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ConfirmModal, StatusBadge, Toast } from "@/components/UI";
import { printPdf } from "@/lib/printPdf";

interface WorkTicket {
  id: number;
  createdAt: string;
  customerOrderNumber: string | null;
  jobDescription: string;
  quantity: number;
  status: string;
  cancelReason: string | null;
  cancelledAt: string | null;
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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    customerOrderNumber: "",
    jobDescription: "",
    quantity: "",
  });

  // Delivery note state
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryQty, setDeliveryQty] = useState("");
  const [deliveryConfirm, setDeliveryConfirm] = useState(false);

  // Cancel state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [error, setError] = useState("");

  const loadTicket = async () => {
    const res = await fetch(`/api/worktickets/${id}`);
    const data = await res.json();
    setTicket(data);
    return data;
  };

  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ─── EDIT HANDLERS ──────────────────────────────────────────────────

  const startEdit = () => {
    if (!ticket) return;
    setEditForm({
      customerOrderNumber: ticket.customerOrderNumber || "",
      jobDescription: ticket.jobDescription,
      quantity: String(ticket.quantity),
    });
    setEditing(true);
    setError("");
  };

  const saveEdit = async () => {
    setError("");
    if (!editForm.jobDescription.trim()) {
      setError("Job description is required");
      return;
    }
    const qty = parseInt(editForm.quantity);
    if (!qty || qty < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    const res = await fetch(`/api/worktickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerOrderNumber: editForm.customerOrderNumber || null,
        jobDescription: editForm.jobDescription,
        quantity: qty,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      return;
    }

    setEditing(false);
    setToast({ message: "Ticket updated", type: "success" });
    loadTicket();
  };

  // ─── CANCEL HANDLER ─────────────────────────────────────────────────

  const cancelTicket = async (reason?: string) => {
    const res = await fetch(`/api/worktickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED", cancelReason: reason }),
    });

    if (!res.ok) {
      const data = await res.json();
      setToast({ message: data.error || "Failed to cancel", type: "error" });
      setShowCancelConfirm(false);
      return;
    }

    setShowCancelConfirm(false);
    setToast({ message: "Ticket cancelled", type: "success" });
    loadTicket();
  };

  // ─── DELIVERY NOTE HANDLER ──────────────────────────────────────────

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!deliveryQty || parseInt(deliveryQty) < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    // Show confirmation before creating
    setDeliveryConfirm(true);
  };

  const confirmDelivery = async () => {
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
      setToast({ message: data.error || "Failed to create delivery note", type: "error" });
      setDeliveryConfirm(false);
      return;
    }

    setDeliveryConfirm(false);
    setShowDeliveryForm(false);
    setDeliveryQty("");
    setToast({ message: `Delivery note created (DN #${parseInt(id) + 144800})`, type: "success" });
    loadTicket();
  };

  // ─── RENDER ──────────────────────────────────────────────────────────

  if (!ticket) {
    return <p className="text-gray-500">Loading...</p>;
  }

  const qtyMismatch =
    deliveryQty &&
    parseInt(deliveryQty) !== ticket.quantity;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Cancel confirmation with required reason */}
      <ConfirmModal
        open={showCancelConfirm}
        title="Cancel Work Ticket"
        message={`This will cancel ticket #${ticket.id}. The ticket will remain on record for accountability. This action cannot be undone.`}
        confirmLabel="Cancel Ticket"
        requireInput="Reason for cancellation *"
        onConfirm={(reason) => cancelTicket(reason)}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {/* Delivery note confirmation */}
      <ConfirmModal
        open={deliveryConfirm}
        title="Confirm Delivery Note"
        message={`This will create delivery note #${parseInt(id) + 144800} for ${deliveryQty} unit(s) and mark the ticket as COMPLETED. This cannot be undone.`}
        confirmLabel="Create Delivery Note"
        confirmClass="btn-success"
        onConfirm={confirmDelivery}
        onCancel={() => setDeliveryConfirm(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <Link href="/worktickets" className="text-sm text-gray-500 hover:underline">
            &larr; Back to tickets
          </Link>
          <h1 className="text-2xl font-bold">
            Work Ticket #{ticket.id}
          </h1>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      {/* Cancelled banner */}
      {ticket.status === "CANCELLED" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">This ticket was cancelled</p>
          {ticket.cancelReason && (
            <p className="text-red-700 text-sm mt-1">Reason: {ticket.cancelReason}</p>
          )}
          {ticket.cancelledAt && (
            <p className="text-red-600 text-sm mt-1">
              On: {new Date(ticket.cancelledAt).toLocaleDateString("en-ZA")}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket details */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Ticket Details</h2>
            {ticket.status === "OPEN" && !editing && (
              <button onClick={startEdit} className="text-blue-600 hover:underline text-sm">
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div>
                <label className="label">Customer Order Number</label>
                <input
                  className="input"
                  value={editForm.customerOrderNumber}
                  onChange={(e) => setEditForm({ ...editForm, customerOrderNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Job Description *</label>
                <input
                  className="input"
                  value={editForm.jobDescription}
                  onChange={(e) => setEditForm({ ...editForm, jobDescription: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} className="btn-primary">Save</button>
                <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          ) : (
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
            </dl>
          )}
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
        <button
          className="btn-primary"
          onClick={async () => {
            const { WorkTicketPDF } = await import("@/components/PDFTemplates");
            await printPdf(<WorkTicketPDF ticket={ticket} />);
          }}
        >
          Print Work Ticket
        </button>

        {ticket.status === "OPEN" && (
          <>
            <button
              onClick={() => setShowDeliveryForm(!showDeliveryForm)}
              className="btn-success"
            >
              Generate Delivery Note
            </button>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="btn-danger"
            >
              Cancel Ticket
            </button>
          </>
        )}
      </div>

      {/* Delivery note form */}
      {showDeliveryForm && ticket.status === "OPEN" && (
        <form onSubmit={handleDeliverySubmit} className="card mt-4 max-w-md">
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
              autoFocus
            />
          </div>

          {/* Warn if quantity doesn't match ticket */}
          {qtyMismatch && (
            <p className="text-yellow-700 bg-yellow-50 rounded p-2 text-sm mb-3">
              Note: Ticket quantity is {ticket.quantity}, but you are delivering {deliveryQty}.
            </p>
          )}

          <p className="text-sm text-gray-500 mb-3">
            Delivery note number will be: <strong>{parseInt(id) + 144800}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-3">
            This will mark the ticket as completed.
          </p>
          <button type="submit" className="btn-success">
            Continue
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
                  <td className="py-2 pr-4 font-medium">{dn.deliveryNoteNumber}</td>
                  <td className="py-2 pr-4">
                    {new Date(dn.createdAt).toLocaleDateString("en-ZA")}
                  </td>
                  <td className="py-2 pr-4">{dn.quantityDelivered}</td>
                  <td className="py-2">
                    <Link
                      href="/deliverynotes"
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
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
