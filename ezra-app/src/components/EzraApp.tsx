'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageType } from '@/types';
import { initialQueueItems } from '@/lib/mockData';
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
  const [autonomy, setAutonomy] = useState(75);
  const [queueItems, setQueueItems] = useState(initialQueueItems);
  const [searchTerm, setSearchTerm] = useState('');
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
        setAutoFetchStatus('Initializing your Ezra experience...');
        
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
        
        setAutoFetchStatus('Checking if emails need to be fetched...');
        
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
          let statusMessage = `Auto-fetch completed! Fetched ${data.emailCount} emails.`;
          
          if (data.masterPromptGenerated) {
            statusMessage += ' 🧠 AI Master Prompt generated!';
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
          setAutoFetchStatus('Auto-fetch failed. You can manually fetch emails later.');
          setAutoFetchCompleted(true);
          
          // Clear error status after 5 seconds
          setTimeout(() => {
            setAutoFetchStatus('');
          }, 5000);
        }
      } catch (error) {
        console.error('Error during auto-fetch:', error);
        setAutoFetchStatus('Auto-fetch failed. You can manually fetch emails later.');
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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'queue':
        return (
          <QueuePage 
            queueItems={queueItems.filter(item => 
              item.sender.toLowerCase().includes(searchTerm.toLowerCase()) || 
              item.actionSummary.toLowerCase().includes(searchTerm.toLowerCase())
            )} 
            setQueueItems={setQueueItems} 
          />
        );
      case 'history':
        return <HistoryPage />;
      case 'metrics':
        return <MetricsPage />;
      case 'voice':
        return <VoiceRulesPage />;
      case 'settings':
        return <SettingsPage autonomy={autonomy} setAutonomy={setAutonomy} />;
      default:
        return <QueuePage queueItems={queueItems} setQueueItems={setQueueItems} />;
    }
  };

  // Only render the app if user is authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans flex flex-col">
      <TopBar autonomy={autonomy} setAutonomy={setAutonomy} onSearch={handleSearch} />
      
      {/* Auto-fetch status banner */}
      {(isAutoFetching || autoFetchStatus) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2 mt-16">
          <div className="flex items-center justify-center">
            {isAutoFetching && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {autoFetchStatus || 'Fetching your emails...'}
                </span>
              </div>
            )}
            {!isAutoFetching && autoFetchStatus && (
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {autoFetchStatus}
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="flex flex-1 pt-16">
        <LeftNav activePage={activePage} setActivePage={setActivePage} />
        <main className="flex-1 ml-64 p-0 overflow-y-auto bg-gray-100 dark:bg-gray-900/70">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}; 