import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Shield, 
  Users, 
  Plus, 
  X, 
  CheckCircle, 
  AlertCircle,
  Settings as SettingsIcon,
  Bell,
  BellOff
} from 'lucide-react';
import { OnboardingOverlay } from '@/components/ui/OnboardingOverlay';
import { EmailPreferencesOnboarding } from '@/components/ui/EmailPreferencesOnboarding';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { usePreferencesOnboarding } from '@/hooks/usePreferencesOnboarding';

interface EmailFilterSettings {
  replyScope: 'ALL_SENDERS' | 'CONTACTS_ONLY';
  blockedSenders: string[];
  allowedSenders: string[];
  enablePushNotifications: boolean;
}

export const SettingsPage: React.FC = () => {
  const { isOnboardingComplete, loading: onboardingLoading } = useOnboardingStatus();
  const { isPreferencesComplete, loading: preferencesLoading, markPreferencesComplete } = usePreferencesOnboarding();
  
  const [settings, setSettings] = useState<EmailFilterSettings>({
    replyScope: 'CONTACTS_ONLY',
    blockedSenders: [],
    allowedSenders: [],
    enablePushNotifications: true // Default to enabled
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBlockedSender, setNewBlockedSender] = useState('');
  const [newAllowedSender, setNewAllowedSender] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load settings on component mount - moved before conditional returns
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/email-filters');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      } else {
        setErrorMessage('Failed to load settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setErrorMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Show preferences onboarding first, then regular onboarding
  if (!preferencesLoading && !isPreferencesComplete) {
    return <EmailPreferencesOnboarding onComplete={markPreferencesComplete} />;
  }

  // Show onboarding overlay if not complete
  if (!onboardingLoading && !isOnboardingComplete) {
    return <OnboardingOverlay />;
  }

  const saveSettings = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await fetch('/api/settings/email-filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const setupPushNotifications = async () => {
    try {
      const response = await fetch('/api/gmail-push/setup', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSettings(prev => ({ ...prev, enablePushNotifications: true }));
        setSuccessMessage('Push notifications enabled successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to setup push notifications');
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      setErrorMessage('Failed to setup push notifications');
    }
  };

  const addBlockedSender = () => {
    if (newBlockedSender.trim() && !settings.blockedSenders.includes(newBlockedSender.trim())) {
      setSettings(prev => ({
        ...prev,
        blockedSenders: [...prev.blockedSenders, newBlockedSender.trim()]
      }));
      setNewBlockedSender('');
    }
  };

  const removeBlockedSender = (sender: string) => {
    setSettings(prev => ({
      ...prev,
      blockedSenders: prev.blockedSenders.filter(s => s !== sender)
    }));
  };

  const addAllowedSender = () => {
    if (newAllowedSender.trim() && !settings.allowedSenders.includes(newAllowedSender.trim())) {
      setSettings(prev => ({
        ...prev,
        allowedSenders: [...prev.allowedSenders, newAllowedSender.trim()]
      }));
      setNewAllowedSender('');
    }
  };

  const removeAllowedSender = (sender: string) => {
    setSettings(prev => ({
      ...prev,
      allowedSenders: prev.allowedSenders.filter(s => s !== sender)
    }));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Email Filtering Settings
        </h2>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="flex items-center space-x-2 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-200">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center space-x-2 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-200">{errorMessage}</span>
        </div>
      )}



      {/* Reply Scope */}
      <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-start space-x-3">
          <Users className="h-6 w-6 text-blue-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Who can Ezra reply to?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Control which senders receive automatic replies from Ezra.
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="replyScope"
                  checked={settings.replyScope === 'CONTACTS_ONLY'}
                  onChange={() => setSettings(prev => ({ ...prev, replyScope: 'CONTACTS_ONLY' }))}
                  className="h-4 w-4 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">Only my contacts</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Only reply to people you've emailed before (recommended)</p>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="replyScope"
                  checked={settings.replyScope === 'ALL_SENDERS'}
                  onChange={() => setSettings(prev => ({ ...prev, replyScope: 'ALL_SENDERS' }))}
                  className="h-4 w-4 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">Anyone who emails me</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reply to all legitimate senders (use with caution)</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </section>



      {/* Blocked Senders */}
      <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-red-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Blocked Senders
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Email addresses or domains that Ezra should never reply to.
            </p>
            <div className="mt-4">
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newBlockedSender}
                  onChange={(e) => setNewBlockedSender(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addBlockedSender()}
                  placeholder="e.g., spam@example.com or @domain.com"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={addBlockedSender}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {settings.blockedSenders.map((sender, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <span className="text-gray-800 dark:text-gray-200">{sender}</span>
                    <button
                      onClick={() => removeBlockedSender(sender)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {settings.blockedSenders.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No blocked senders configured.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Allowed Senders (Priority) */}
      <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-green-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Priority Senders
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Email addresses or domains that Ezra should always reply to, regardless of other settings.
            </p>
            <div className="mt-4">
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newAllowedSender}
                  onChange={(e) => setNewAllowedSender(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAllowedSender()}
                  placeholder="e.g., boss@company.com or @important.com"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={addAllowedSender}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {settings.allowedSenders.map((sender, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <span className="text-gray-800 dark:text-gray-200">{sender}</span>
                    <button
                      onClick={() => removeAllowedSender(sender)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {settings.allowedSenders.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No priority senders configured.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Push Notifications */}
      <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {settings.enablePushNotifications ? (
              <Bell className="h-6 w-6 text-blue-600 mt-1" />
            ) : (
              <BellOff className="h-6 w-6 text-gray-400 mt-1" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Gmail Push Notifications
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Automatically process new emails and generate replies in real-time.
              </p>
              <div className="mt-2">
                {settings.enablePushNotifications ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enablePushNotifications}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setSettings(prev => ({ ...prev, enablePushNotifications: enabled }));
                  if (enabled && !settings.enablePushNotifications) {
                    setupPushNotifications();
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          <strong>Note:</strong> Ezra automatically filters out newsletters, promotions, social notifications, 
          and no-reply emails. These settings give you additional control over who can receive replies.
        </p>
      </div>
    </div>
  );
};
