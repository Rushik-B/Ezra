'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageType } from '@/types';
import { TopBar } from '@/components/layout/TopBar';
import { LeftNav } from '@/components/layout/LeftNav';
import { QueuePage } from '@/components/pages/QueuePage';
import { HistoryPage } from '@/components/pages/HistoryPage';
import { MetricsPage } from '@/components/pages/MetricsPage';
import { VoiceRulesPage } from '@/components/pages/VoiceRulesPage';
import { SettingsPage } from '@/components/pages/SettingsPage';

export const EzraApp: React.FC = () => {
  const { data: session } = useSession();
  const [activePage, setActivePage] = useState<PageType>('queue');
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [autoFetchStatus, setAutoFetchStatus] = useState<string>('');
  const [autoFetchCompleted, setAutoFetchCompleted] = useState(false);
  const [initializationStarted, setInitializationStarted] = useState(false);

  // Auto-fetch emails and ensure master prompt when user first loads the app
  useEffect(() => {
    const autoFetchEmails = async () => {
      if (!session?.userId || autoFetchCompleted || isAutoFetching || initializationStarted) return;
      
      setInitializationStarted(true);

      try {
        setIsAutoFetching(true);
        setAutoFetchStatus('Initializing your AI assistant...');
        
        // First, ensure user has a master prompt
        try {
          const masterPromptResponse = await fetch('/api/master-prompt/ensure', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (masterPromptResponse.ok) {
            const masterPromptData = await masterPromptResponse.json();
            if (!masterPromptData.hasPrompt) {
              console.log('⚠️ User needs more emails for master prompt generation');
            }
          }
        } catch (error) {
          console.warn('Master prompt check failed, continuing with email fetch:', error);
        }
        
        setAutoFetchStatus('Syncing with your email...');
        
        const response = await fetch('/api/auto-fetch-emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (data.skipped || data.inProgress) {
          setAutoFetchStatus('');
          setAutoFetchCompleted(true);
        } else if (response.ok) {
          let statusMessage = `Connected! Analyzed ${data.emailCount} emails.`;
          
          if (data.masterPromptGenerated) {
            statusMessage += ' AI brain calibrated successfully.';
          }
          
          setAutoFetchStatus(statusMessage);
          setAutoFetchCompleted(true);
          
          // Clear status after longer time if Master Prompt was generated
          const clearDelay = data.masterPromptGenerated ? 5000 : 3000;
          setTimeout(() => {
            setAutoFetchStatus('');
          }, clearDelay);
        } else {
          console.error('Auto-fetch failed:', data);
          setAutoFetchStatus('Connection failed. You can manually sync later.');
          setAutoFetchCompleted(true);
          
          // Clear error status after 5 seconds
          setTimeout(() => {
            setAutoFetchStatus('');
          }, 5000);
        }
      } catch (error) {
        console.error('Error during auto-fetch:', error);
        setAutoFetchStatus('Connection failed. You can manually sync later.');
        setAutoFetchCompleted(true);
        
        // Clear error status after 5 seconds
        setTimeout(() => {
          setAutoFetchStatus('');
        }, 5000);
      } finally {
        setIsAutoFetching(false);
      }
    };

    // Only run initialization once when session is available and not completed
    if (session?.userId && !autoFetchCompleted && !isAutoFetching && !initializationStarted) {
      console.log('🚀 Starting Ezra initialization for user:', session.userId);
      autoFetchEmails();
    }
  }, [session?.userId, autoFetchCompleted, isAutoFetching, initializationStarted]);

  const renderPage = () => {
    switch (activePage) {
      case 'queue':
        return <QueuePage />;
      case 'history':
        return <HistoryPage />;
      case 'metrics':
        return <MetricsPage />;
      case 'voice':
        return <VoiceRulesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <QueuePage />;
    }
  };

  // Only render the app if user is authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter">
      <TopBar onLogoClick={() => setActivePage('queue')} />
      
      {/* Auto-fetch status banner */}
      {(isAutoFetching || autoFetchStatus) && (
        <div className="bg-blue-500/10 backdrop-blur border-b border-blue-500/20 px-6 py-3 mt-16">
          <div className="flex items-center justify-center max-w-7xl mx-auto">
            {isAutoFetching && (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                </div>
                <span className="text-sm font-medium text-blue-200">
                  {autoFetchStatus || 'Connecting to your email...'}
                </span>
              </div>
            )}
            {!isAutoFetching && autoFetchStatus && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-sm font-medium text-emerald-200">
                  {autoFetchStatus}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex pt-16">
        <LeftNav activePage={activePage} setActivePage={setActivePage} />
        <main className="flex-1 ml-72 bg-slate-950 min-h-screen">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}; 