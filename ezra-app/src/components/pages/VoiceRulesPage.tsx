'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { mockPromptVersions } from '@/lib/mockData';

export const VoiceRulesPage: React.FC = () => {
  const { data: session } = useSession();
  const [currentSettings, setCurrentSettings] = useState(mockPromptVersions.find(p => p.active)?.settings || mockPromptVersions[0].settings);

  const handleSettingChange = (key: string, value: string | number) => {
    const newSettings = { ...currentSettings, [key]: value };
    setCurrentSettings(newSettings);
  };

  const generateSampleOutput = () => {
    const userName = session?.user?.name || 'User';
    let output = `Subject: Quick Update\n\n`;
    if (currentSettings.tone === 'Professional') output += `Dear Team,\n\n`;
    else if (currentSettings.tone === 'Friendly') output += `Hey everyone,\n\n`;
    else output += `Hi,\n\n`;

    output += `This is a sample email to demonstrate the current voice settings. `;
    if (currentSettings.formality === 'High') output += `We kindly request your attention to this matter. `;
    else if (currentSettings.formality === 'Medium') output += `Please take a look when you have a moment. `;
    else output += `Check this out! `;

    if (currentSettings.emojiUsage > 0) {
      output += `Emojis are cool ${'👍'.repeat(Math.min(currentSettings.emojiUsage, 3))}. `;
    }
    output += `\n\n${currentSettings.signOff.replace('{UserName}', userName)}`;
    return output;
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Voice & Rules (Prompt Vault)</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Customize EZRA's Voice</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tone</label>
            <div className="flex space-x-2">
              {['Professional', 'Friendly', 'Direct'].map(tone => (
                <button
                  key={tone}
                  onClick={() => handleSettingChange('tone', tone)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${currentSettings.tone === tone ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500'}`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="formality" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formality</label>
            <select
              id="formality"
              value={currentSettings.formality}
              onChange={(e) => handleSettingChange('formality', e.target.value)}
              className="w-full text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-700 dark:text-gray-200"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="signOff" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sign-off (use {`{UserName}`} for your name)</label>
            <input
              id="signOff"
              type="text"
              value={currentSettings.signOff}
              onChange={(e) => handleSettingChange('signOff', e.target.value)}
              className="w-full text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-700 dark:text-gray-200"
            />
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sample: {currentSettings.signOff.replace('{UserName}', session?.user?.name || 'User')}</p>
          </div>

          <div>
            <label htmlFor="emojiUsage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emoji Usage (0-5)</label>
            <div className="flex items-center space-x-2">
              <input
                id="emojiUsage"
                type="range"
                min="0"
                max="5"
                value={currentSettings.emojiUsage}
                onChange={(e) => handleSettingChange('emojiUsage', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300 w-4 text-center">{currentSettings.emojiUsage}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Live Sample Output</h3>
            <pre className="text-xs bg-gray-50 dark:bg-gray-700 p-3 rounded-md whitespace-pre-wrap h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
              {generateSampleOutput()}
            </pre>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Prompt Version History</h3>
            <ul className="space-y-3 max-h-72 overflow-y-auto">
              {mockPromptVersions.map(version => (
                <li key={version.id} className={`p-3 rounded-md border ${version.active ? 'bg-emerald-50 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        Version {version.version} 
                        {version.active && <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Active)</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{version.date} by {version.editor}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{version.reason}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 