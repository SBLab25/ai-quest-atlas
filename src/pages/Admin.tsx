import React from 'react';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { useRole } from '@/hooks/useSimpleRole';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const Admin = () => {
  const { isAdmin, isModerator, loading } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin && !isModerator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                You need admin or moderator privileges to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminPanel />;
};

export default Admin;