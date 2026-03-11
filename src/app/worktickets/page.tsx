"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

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

  const loadTickets = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/worktickets?${params}`);
    setTickets(await res.json());
  }, [statusFilter, search]);

  useEffect(() => {
    loadTickets();
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

    const res = await fetch("/api/worktickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        customerId: parseInt(form.customerId),
        quantity: parseInt(form.quantity),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    setForm({ customerId: "", customerOrderNumber: "", jobDescription: "", quantity: "" });
    setShowForm(false);
    loadTickets();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
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
        </select>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">New Work Ticket</h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Customer *</label>
              <select
                className="input"
                value={form.customerId}
                onChange={(e) =>
                  setForm({ ...form, customerId: e.target.value })
                }
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
                onChange={(e) =>
                  setForm({ ...form, customerOrderNumber: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Job Description *</label>
              <input
                className="input"
                value={form.jobDescription}
                onChange={(e) =>
                  setForm({ ...form, jobDescription: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input
                type="number"
                min="1"
                className="input"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
              />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-4">
            Create Ticket
          </button>
        </form>
      )}

      {/* Ticket list */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4">Ticket #</th>
              <th className="pb-2 pr-4">Date</th>
              <th className="pb-2 pr-4">Customer</th>
              <th className="pb-2 pr-4">Job</th>
              <th className="pb-2 pr-4">Qty</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">
                  No tickets found
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{t.id}</td>
                  <td className="py-2 pr-4">
                    {new Date(t.createdAt).toLocaleDateString("en-ZA")}
                  </td>
                  <td className="py-2 pr-4">{t.customer.name}</td>
                  <td className="py-2 pr-4">{t.jobDescription}</td>
                  <td className="py-2 pr-4">{t.quantity}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        t.status === "OPEN"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {t.status}
                    </span>
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
