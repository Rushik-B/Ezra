'use client';

//This is a test page for the email sending functionality
//It allows you to send a test email to the user
//It also allows you to test the reply generation functionality
//It is used to test the email sending and reply generation functionality
//It is not used in the production environment
//It is only used for testing purposes
//It is not used in the production environment

import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

export const TestEmailPage: React.FC = () => {
  const [formData, setFormData] = useState({
    from: 'employee@starboard.ai',
    to: 'sara@starboard.ai',
    cc: '',
    subject: `Deployment update`,
    body: `Hi all,\n\nQuick update — the maintenance window with Globex went smoothly.\n\nAlex's team completed the deployment at 12:28 AM PST. Validation steps were finalized shortly after, and we received confirmation from the Globex EU team that data integrity checks are passing on their end. No anomalies reported post-push.\n\nThanks everyone for the coordination and late-night support.\n\nBest,\nSara`,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMessage({ type: 'success', message: 'Test email sent successfully! It should appear in the queue shortly.' });
      } else {
        setStatusMessage({ type: 'error', message: `Error: ${result.error || 'Failed to send email.'}` });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
        Send a Test Email
      </h2>

      <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="from" className="block text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
            <input
              type="email"
              name="from"
              id="from"
              value={formData.from}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
            <input
              type="email"
              name="to"
              id="to"
              value={formData.to}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="cc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CC (comma-separated)</label>
            <input
              type="text"
              name="cc"
              id="cc"
              value={formData.cc}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
            <input
              type="text"
              name="subject"
              id="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Body</label>
            <textarea
              name="body"
              id="body"
              rows={10}
              value={formData.body}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-end space-x-4">
            {statusMessage && (
              <p className={`text-sm ${statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {statusMessage.message}
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}; 