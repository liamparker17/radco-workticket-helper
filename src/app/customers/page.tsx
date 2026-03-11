"use client";

import { useEffect, useState, useCallback } from "react";
import { ConfirmModal, Toast } from "@/components/UI";

interface Customer {
  id: number;
  name: string;
  telephoneNumber: string | null;
  contactPerson: string | null;
  contactCell: string | null;
  email: string | null;
  archived: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: "",
    telephoneNumber: "",
    contactPerson: "",
    contactCell: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<Customer | null>(null);

  const loadCustomers = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (showArchived) params.set("archived", "true");
    const res = await fetch(`/api/customers?${params}`);
    setCustomers(await res.json());
  }, [search, showArchived]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const resetForm = () => {
    setForm({ name: "", telephoneNumber: "", contactPerson: "", contactCell: "", email: "" });
    setEditing(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...form, id: editing.id } : form;

    const res = await fetch("/api/customers", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    setToast({ message: editing ? "Customer updated" : "Customer created", type: "success" });
    resetForm();
    loadCustomers();
  };

  const handleArchive = async (customer: Customer, archive: boolean) => {
    const res = await fetch("/api/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: customer.id, archived: archive }),
    });

    if (!res.ok) {
      const data = await res.json();
      setToast({ message: data.error || "Failed to update customer", type: "error" });
      return;
    }

    setToast({
      message: archive ? `${customer.name} archived` : `${customer.name} restored`,
      type: "success",
    });
    setArchiveConfirm(null);
    loadCustomers();
  };

  const startEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      telephoneNumber: c.telephoneNumber || "",
      contactPerson: c.contactPerson || "",
      contactCell: c.contactCell || "",
      email: c.email || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmModal
        open={!!archiveConfirm}
        title="Archive Customer"
        message={`Are you sure you want to archive "${archiveConfirm?.name}"? They will be hidden from the customer list and cannot be used for new tickets. You can restore them later.`}
        confirmLabel="Archive"
        onConfirm={() => archiveConfirm && handleArchive(archiveConfirm, true)}
        onCancel={() => setArchiveConfirm(null)}
      />

      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <a href={`/api/customers?format=csv${showArchived ? "&archived=true" : ""}`} className="btn-secondary text-sm">
            Export CSV
          </a>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="btn-primary"
          >
            {showForm ? "Cancel" : "Add Customer"}
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search customers..."
          className="input max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded"
          />
          Show archived
        </label>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editing ? "Edit Customer" : "New Customer"}
          </h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Telephone</label>
              <input
                className="input"
                value={form.telephoneNumber}
                onChange={(e) => setForm({ ...form, telephoneNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Contact Person</label>
              <input
                className="input"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Contact Cell</label>
              <input
                className="input"
                value={form.contactCell}
                onChange={(e) => setForm({ ...form, contactCell: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary">
              {editing ? "Update" : "Create"}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {/* Customer list */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4 hidden sm:table-cell">Telephone</th>
              <th className="pb-2 pr-4">Contact</th>
              <th className="pb-2 pr-4 hidden sm:table-cell">Cell</th>
              <th className="pb-2 pr-4 hidden md:table-cell">Email</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  {showArchived ? "No archived customers" : "No customers found"}
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className={`border-b last:border-0 ${c.archived ? "opacity-60" : ""}`}>
                  <td className="py-2 pr-4 font-medium">{c.name}</td>
                  <td className="py-2 pr-4 hidden sm:table-cell">{c.telephoneNumber || "-"}</td>
                  <td className="py-2 pr-4">{c.contactPerson || "-"}</td>
                  <td className="py-2 pr-4 hidden sm:table-cell">{c.contactCell || "-"}</td>
                  <td className="py-2 pr-4 hidden md:table-cell">{c.email || "-"}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    {c.archived ? (
                      <button
                        onClick={() => handleArchive(c, false)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Restore
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(c)}
                          className="text-blue-600 hover:underline text-sm mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setArchiveConfirm(c)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Archive
                        </button>
                      </>
                    )}
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
