import { useState, useEffect } from 'react';

export const usePreferencesOnboarding = () => {
  const [isPreferencesComplete, setIsPreferencesComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPreferencesStatus();
  }, []);

  const checkPreferencesStatus = async () => {
    try {
      const response = await fetch('/api/settings/email-filters');
      const data = await response.json();
      
      if (data.success) {
        // If isDefault is false, user has saved settings and completed onboarding
        // If isDefault is true, user hasn't completed preferences onboarding yet
        setIsPreferencesComplete(!data.isDefault);
      } else {
        setIsPreferencesComplete(false);
      }
    } catch (error) {
      console.error('Error checking preferences status:', error);
      // Default to not complete on error
      setIsPreferencesComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const markPreferencesComplete = () => {
    setIsPreferencesComplete(true);
  };

  return {
    isPreferencesComplete,
    loading,
    markPreferencesComplete
  };
}; 