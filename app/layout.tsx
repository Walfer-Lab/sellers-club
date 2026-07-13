import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sellers Club",
  description: "The platform for top sellers to create, manage, and scale digital products.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full"
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
