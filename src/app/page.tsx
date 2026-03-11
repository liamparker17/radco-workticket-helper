"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
  openCount: number;
  recentTickets: Array<{
    id: number;
    createdAt: string;
    jobDescription: string;
    status: string;
    customer: { name: string };
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/worktickets")
      .then((r) => r.json())
      .then((tickets) => {
        setData({
          openCount: tickets.filter(
            (t: { status: string }) => t.status === "OPEN"
          ).length,
          recentTickets: tickets.slice(0, 5),
        });
      });
  }, []);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Open Tickets</p>
          <p className="text-3xl font-bold text-blue-600">
            {data?.openCount ?? "..."}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Tickets</p>
          <p className="text-3xl font-bold text-gray-800">
            {data?.recentTickets !== undefined
              ? data.openCount +
                (data.recentTickets.length - data.openCount >= 0
                  ? 0
                  : 0)
              : "..."}
          </p>
        </div>
      </div>

      {/* Recent tickets */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Tickets</h2>
        {!data ? (
          <p className="text-gray-500">Loading...</p>
        ) : data.recentTickets.length === 0 ? (
          <p className="text-gray-500">No tickets yet. Create your first work ticket.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">Customer</th>
                <th className="pb-2 pr-4">Job</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.recentTickets.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{t.id}</td>
                  <td className="py-2 pr-4">{t.customer.name}</td>
                  <td className="py-2 pr-4">{t.jobDescription}</td>
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
