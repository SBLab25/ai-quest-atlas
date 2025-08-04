import React from 'react';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { useRole } from '@/hooks/useSimpleRole';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const { isAdmin, isModerator, loading } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only allow access to the specific admin user (you)
  if (!isAdmin || !user || user.id !== '2b5d505d-b58f-4460-b5d8-ce2cd3146809') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                This admin panel is restricted to authorized administrators only.
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