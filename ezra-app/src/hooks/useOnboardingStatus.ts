import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface OnboardingStatus {
  emailsFetched: boolean;
  masterPromptGenerated: boolean;
  interactionNetworkGenerated: boolean;
  strategicRulebookGenerated: boolean;
}

export const useOnboardingStatus = () => {
  const { data: session } = useSession();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    fetchOnboardingStatus();
  }, [session]);

  const fetchOnboardingStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/onboarding-status');
      const data = await response.json();
      
      if (data.success && data.user) {
        const userStatus: OnboardingStatus = {
          emailsFetched: data.user.emailsFetched,
          masterPromptGenerated: data.user.masterPromptGenerated,
          interactionNetworkGenerated: data.user.interactionNetworkGenerated,
          strategicRulebookGenerated: data.user.strategicRulebookGenerated,
        };
        
        setStatus(userStatus);
        
        // Check if onboarding is complete
        const isComplete = userStatus.emailsFetched && 
                          userStatus.masterPromptGenerated && 
                          userStatus.interactionNetworkGenerated && 
                          userStatus.strategicRulebookGenerated;
        
        setIsOnboardingComplete(isComplete);
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    isOnboardingComplete,
    refetch: fetchOnboardingStatus
  };
}; 