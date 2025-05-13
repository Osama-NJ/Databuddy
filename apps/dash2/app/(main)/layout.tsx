"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useAuthSession } from "@/app/providers";
import { RedirectToSignIn } from "@/components/auth/redirect-to-sign-in";
import { AuthLoading } from "@/components/auth/auth-loading";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuthSession();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!session) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="md:pl-72 pt-16 min-h-screen relative">
        <div className="h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}  