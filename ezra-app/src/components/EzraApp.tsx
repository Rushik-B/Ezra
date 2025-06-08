'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageType } from '@/types';
import { AppSidebar } from '@/components/app-sidebar';
import { QueuePage } from '@/components/pages/QueuePage';
import { HistoryPage } from '@/components/pages/HistoryPage';
import { MetricsPage } from '@/components/pages/MetricsPage';
import { VoiceRulesPage } from '@/components/pages/VoiceRulesPage';
import { SettingsPage } from '@/components/pages/SettingsPage';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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

  const getPageTitle = () => {
    switch (activePage) {
      case 'queue':
        return 'Inbox Intelligence';
      case 'history':
        return 'Activity History';
      case 'metrics':
        return 'Performance Analytics';
      case 'voice':
        return 'Voice & Rules Configuration';
      case 'settings':
        return 'Settings';
      default:
        return 'Inbox Intelligence';
    }
  };

  // Only render the app if user is authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <SidebarProvider>
        <AppSidebar activePage={activePage} setActivePage={setActivePage} />
        <SidebarInset className="flex-1 min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 bg-white border-b border-slate-300 shadow-sm transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-6">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#" className="text-slate-600 hover:text-slate-900">
                      Ezra AI
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium text-slate-900">{getPageTitle()}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          {/* Auto-fetch status banner */}
          {(isAutoFetching || autoFetchStatus) && (
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 border-b border-blue-300 px-6 py-3 shadow-sm">
              <div className="flex items-center justify-center max-w-7xl mx-auto">
                {isAutoFetching && (
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                    <span className="text-sm font-medium text-blue-800">
                      {autoFetchStatus || 'Connecting to your email...'}
                    </span>
                  </div>
                )}
                {!isAutoFetching && autoFetchStatus && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-medium text-emerald-800">
                      {autoFetchStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="w-full">
              {renderPage()}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}; 