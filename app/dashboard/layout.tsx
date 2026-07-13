import type { Metadata } from "next";
import Navbar from "@/components/CommonUI/Navbar";

export const metadata: Metadata = {
  title: "Dashboard | Sellers Club",
  description: "View your sales performance, recent products, and quick actions on your Sellers Club dashboard.",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 lg:pl-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
        {children}
      </div>
    </div>
  );
}
