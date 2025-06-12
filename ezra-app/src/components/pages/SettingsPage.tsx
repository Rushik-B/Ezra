import React from 'react';
import { Construction } from 'lucide-react';
import { OnboardingOverlay } from '@/components/ui/OnboardingOverlay';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

export const SettingsPage: React.FC = () => {
  const { isOnboardingComplete, loading: onboardingLoading } = useOnboardingStatus();

  // Show onboarding overlay if not complete
  if (!onboardingLoading && !isOnboardingComplete) {
    return <OnboardingOverlay />;
  }

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
        Settings
      </h2>

      {/* Under Development Message */}
      <section className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-full">
            <Construction className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Settings Under Development
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              We're working hard to bring you comprehensive settings and customization options. 
              Check back soon for exciting new features! :)
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span>Coming Soon</span>
          </div>
        </div>
      </section>
    </div>
  );
};
