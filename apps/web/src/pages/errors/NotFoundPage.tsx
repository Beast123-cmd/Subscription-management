import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@/components/ui/error-state';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="py-12">
      <ErrorState
        statusCode={404}
        title="Page Not Found"
        message="The screen you are attempting to access does not exist or has moved."
        onBack={() => navigate('/app/dashboard')}
      />
    </div>
  );
}
