import React from "react";
import { TopNavbar } from "@/components/navigation/TopNavbar";
import { useRole } from "@/hooks/useSimpleRole";
import { AdminPanel } from "@/components/admin/AdminPanel";

const Admin = () => {
  const { isAdmin, loading } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <TopNavbar />
        <main className="container mx-auto px-6 py-8">
          <div className="rounded-xl border bg-card text-card-foreground shadow p-8 text-center">
            <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to view the Admin Panel.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <TopNavbar />
      <main className="container mx-auto px-6 py-8">
        <AdminPanel />
      </main>
    </div>
  );
};

export default Admin;
