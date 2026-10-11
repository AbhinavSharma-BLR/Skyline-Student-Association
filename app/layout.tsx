import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";

export const metadata: Metadata = {
  title: "Skyline Student Association | Campus Community & Operations",
  description:
    "Empowering campus life, inspiring student leadership. Discover campus events, manage student memberships, merchandise, and student operations with transparency.",
  keywords: [
    "Skyline Student Association",
    "Campus Life",
    "Student Membership",
    "Campus Events",
    "Student Leadership",
    "Student ERP",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F7F8FA] text-[#0A0A0A]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
