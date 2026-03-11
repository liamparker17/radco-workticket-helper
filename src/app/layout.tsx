"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/worktickets", label: "Work Tickets" },
  { href: "/deliverynotes", label: "Delivery Notes" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <head>
        <title>Work Ticket System</title>
        <meta
          name="description"
          content="Workshop work ticket and delivery note management"
        />
      </head>
      <body>
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-lg font-bold text-blue-600">
                Work Ticket System
              </Link>
              <div className="flex space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
