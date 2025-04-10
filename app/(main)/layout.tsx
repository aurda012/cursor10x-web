import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      {children}
    </main>
  );
}
