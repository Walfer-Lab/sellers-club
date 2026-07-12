import Navbar from "@/components/Navbar";

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
