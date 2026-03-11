"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { StatusBadge, Toast } from "@/components/UI";

interface Customer {
  id: number;
  name: string;
}

interface WorkTicket {
  id: number;
  createdAt: string;
  customerOrderNumber: string | null;
  jobDescription: string;
  quantity: number;
  status: string;
  customer: Customer;
}

export default function WorkTicketsPage() {
  const [tickets, setTickets] = useState<WorkTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    customerOrderNumber: "",
    jobDescription: "",
    quantity: "",
  });
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadTickets = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/worktickets?${params}`);
    setTickets(await res.json());
  }, [statusFilter, search]);

  useEffect(() => {
    loadTickets();
    // Only load active customers for the dropdown
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers);
  }, [loadTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.customerId || !form.jobDescription.trim() || !form.quantity) {
      setError("Customer, job description, and quantity are required");
      return;
    }

    const qty = parseInt(form.quantity);
    if (qty < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    const res = await fetch("/api/worktickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: parseInt(form.customerId),
        customerOrderNumber: form.customerOrderNumber || null,
        jobDescription: form.jobDescription,
        quantity: qty,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    const ticket = await res.json();
    setToast({ message: `Work ticket #${ticket.id} created`, type: "success" });
    setForm({ customerId: "", customerOrderNumber: "", jobDescription: "", quantity: "" });
    setShowForm(false);
    loadTickets();
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Work Tickets</h1>
        <div className="flex gap-2">
          <a
            href={`/api/worktickets?format=csv${statusFilter ? `&status=${statusFilter}` : ""}`}
            className="btn-secondary text-sm"
          >
            Export CSV
          </a>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? "Cancel" : "New Ticket"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search tickets..."
          className="input max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input max-w-[160px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">New Work Ticket</h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          {customers.length === 0 && (
            <p className="text-yellow-700 bg-yellow-50 rounded p-3 text-sm mb-4">
              No customers found.{" "}
              <Link href="/customers" className="underline font-medium">
                Create a customer first.
              </Link>
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Customer *</label>
              <select
                className="input"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Customer Order Number</label>
              <input
                className="input"
                value={form.customerOrderNumber}
                onChange={(e) => setForm({ ...form, customerOrderNumber: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Job Description *</label>
              <input
                className="input"
                value={form.jobDescription}
                onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input
                type="number"
                min="1"
                className="input"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-4">
            Create Ticket
          </button>
        </form>
      )}

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-2">
        {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} found
      </p>

      {/* Ticket list */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4">#</th>
              <th className="pb-2 pr-4">Customer</th>
              <th className="pb-2 pr-4 hidden sm:table-cell">Job</th>
              <th className="pb-2 pr-4">Qty</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  No tickets found
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{t.id}</td>
                  <td className="py-2 pr-4">{t.customer.name}</td>
                  <td className="py-2 pr-4 hidden sm:table-cell max-w-[200px] truncate">
                    {t.jobDescription}
                  </td>
                  <td className="py-2 pr-4">{t.quantity}</td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-2">
                    <Link
                      href={`/worktickets/${t.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
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
