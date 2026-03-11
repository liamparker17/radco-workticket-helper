"use client";

import { useEffect, useState, useCallback } from "react";

interface Customer {
  id: number;
  name: string;
  telephoneNumber: string | null;
  contactPerson: string | null;
  contactCell: string | null;
  email: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
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

  const loadCustomers = useCallback(async () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/customers${params}`);
    setCustomers(await res.json());
  }, [search]);

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

    resetForm();
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
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <a href="/api/customers?format=csv" className="btn-secondary text-sm">
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

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search customers..."
          className="input max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editing ? "Edit Customer" : "New Customer"}
          </h2>
          {error && (
            <p className="text-red-600 text-sm mb-3">{error}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Telephone</label>
              <input
                className="input"
                value={form.telephoneNumber}
                onChange={(e) =>
                  setForm({ ...form, telephoneNumber: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Contact Person</label>
              <input
                className="input"
                value={form.contactPerson}
                onChange={(e) =>
                  setForm({ ...form, contactPerson: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Contact Cell</label>
              <input
                className="input"
                value={form.contactCell}
                onChange={(e) =>
                  setForm({ ...form, contactCell: e.target.value })
                }
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
          <button type="submit" className="btn-primary mt-4">
            {editing ? "Update" : "Create"}
          </button>
        </form>
      )}

      {/* Customer list */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4">ID</th>
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Telephone</th>
              <th className="pb-2 pr-4">Contact</th>
              <th className="pb-2 pr-4">Cell</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{c.id}</td>
                  <td className="py-2 pr-4 font-medium">{c.name}</td>
                  <td className="py-2 pr-4">{c.telephoneNumber || "-"}</td>
                  <td className="py-2 pr-4">{c.contactPerson || "-"}</td>
                  <td className="py-2 pr-4">{c.contactCell || "-"}</td>
                  <td className="py-2 pr-4">{c.email || "-"}</td>
                  <td className="py-2">
                    <button
                      onClick={() => startEdit(c)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Edit
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
