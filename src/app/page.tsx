"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/UI";

interface Ticket {
  id: number;
  createdAt: string;
  jobDescription: string;
  quantity: number;
  status: string;
  customer: { name: string };
}

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);

  useEffect(() => {
    fetch("/api/worktickets")
      .then((r) => r.json())
      .then(setTickets);
  }, []);

  const openCount = tickets?.filter((t) => t.status === "OPEN").length ?? 0;
  const completedCount = tickets?.filter((t) => t.status === "COMPLETED").length ?? 0;
  const cancelledCount = tickets?.filter((t) => t.status === "CANCELLED").length ?? 0;
  const totalCount = tickets?.length ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Quick action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/customers" className="btn-primary text-center py-4 text-base">
          Manage Customers
        </Link>
        <Link href="/worktickets" className="btn-success text-center py-4 text-base">
          Work Tickets
        </Link>
        <Link href="/deliverynotes" className="btn-secondary text-center py-4 text-base">
          Delivery Notes
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Open</p>
          <p className="text-3xl font-bold text-yellow-600">
            {tickets ? openCount : "..."}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-green-600">
            {tickets ? completedCount : "..."}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-3xl font-bold text-red-600">
            {tickets ? cancelledCount : "..."}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-3xl font-bold text-gray-800">
            {tickets ? totalCount : "..."}
          </p>
        </div>
      </div>

      {/* Recent tickets */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Tickets</h2>
        {!tickets ? (
          <p className="text-gray-500">Loading...</p>
        ) : tickets.length === 0 ? (
          <p className="text-gray-500">No tickets yet. Create your first work ticket.</p>
        ) : (
          <div className="overflow-x-auto">
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
                {tickets.slice(0, 10).map((t) => (
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
