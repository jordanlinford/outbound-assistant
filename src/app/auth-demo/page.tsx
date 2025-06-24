import { Suspense } from 'react';
import { AuthDemo } from '@/components/AuthDemo';

function AuthDemoLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">Loading...</div>
      </div>
    </div>
  );
}

export default function AuthDemoPage() {
  return (
    <Suspense fallback={<AuthDemoLoading />}>
      <AuthDemo />
    </Suspense>
  );
} 