import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@/components/ui/error-state';

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="py-12">
      <ErrorState
        statusCode={403}
        title="Access Denied"
        message="Your role within the active organization does not have sufficient permission to view this module."
        onBack={() => navigate('/app/dashboard')}
      />
    </div>
  );
}
