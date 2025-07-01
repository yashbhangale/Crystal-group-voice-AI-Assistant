import { useState, useEffect } from 'react';
import { Settings, Download, Database, FileText, Trash2, BarChart } from 'lucide-react';
import { loggingService, type LoggingConfig } from '../services/logger';

interface LoggingSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoggingSettings({ isOpen, onClose }: LoggingSettingsProps) {
  const [config, setConfig] = useState<LoggingConfig>({
    enableLocalStorage: true,
    enableTextDownload: false,
    enableAirtable: false,
    enableGoogleSheets: false,
  });
  
  const [airtableConfig, setAirtableConfig] = useState({
    baseId: '',
    tableId: '',
    apiKey: '',
  });
  
  const [googleSheetsConfig, setGoogleSheetsConfig] = useState({
    spreadsheetId: '',
    apiKey: '',
  });

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Load saved configuration from localStorage
    const savedConfig = localStorage.getItem('loggingConfig');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      
      if (parsedConfig.airtableConfig) {
        setAirtableConfig(parsedConfig.airtableConfig);
      }
      
      if (parsedConfig.googleSheetsConfig) {
        setGoogleSheetsConfig(parsedConfig.googleSheetsConfig);
      }
    }
    
    // Get logging stats
    setStats(loggingService.getStats());
  }, [isOpen]);

  // Handle ESC key to close popup
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const saveConfig = () => {
    const fullConfig = {
      ...config,
      airtableConfig: config.enableAirtable ? airtableConfig : undefined,
      googleSheetsConfig: config.enableGoogleSheets ? googleSheetsConfig : undefined,
    };
    
    loggingService.updateConfig(fullConfig);
    localStorage.setItem('loggingConfig', JSON.stringify(fullConfig));
    onClose();
  };

  const handleConfigChange = (key: keyof LoggingConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const clearAllLogs = () => {
    if (confirm('Are you sure you want to clear all conversation logs? This action cannot be undone.')) {
      loggingService.clearLogs();
      setStats(loggingService.getStats());
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-600/50 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp transform-gpu"
           style={{
             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
           }}
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Logging Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 transform hover:scale-105"
          >
            ✕
          </button>
        </div>

        {/* Statistics Section */}
        {stats && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:bg-gray-800/60 transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <BarChart className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-medium text-white">Statistics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Total Conversations</div>
                <div className="text-white font-medium">{stats.totalConversations}</div>
              </div>
              <div>
                <div className="text-gray-400">Sessions</div>
                <div className="text-white font-medium">{stats.sessionsCount}</div>
              </div>
              <div>
                <div className="text-gray-400">Avg Response Length</div>
                <div className="text-white font-medium">{stats.avgResponseLength} chars</div>
              </div>
              <div>
                <div className="text-gray-400">Total Tokens</div>
                <div className="text-white font-medium">{stats.totalTokens}</div>
              </div>
            </div>
          </div>
        )}

        {/* Local Storage Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-3">Local Storage</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableLocalStorage}
              onChange={(e) => handleConfigChange('enableLocalStorage', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-gray-300">Save conversations to browser storage</span>
          </label>
        </div>

        {/* Download Options */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-3">Download Options</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => loggingService.downloadLogsAsText()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <FileText className="w-4 h-4" />
              Download as Text
            </button>
            <button
              onClick={() => loggingService.downloadLogsAsJSON()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-300 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
            >
              <Download className="w-4 h-4" />
              Download as JSON
            </button>
            <button
              onClick={() => loggingService.downloadLogsAsCSV()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
            >
              <Database className="w-4 h-4" />
              Download as CSV
            </button>
          </div>
        </div>

        {/* Airtable Settings */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={config.enableAirtable}
              onChange={(e) => handleConfigChange('enableAirtable', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <h3 className="text-lg font-medium text-white">Airtable Integration</h3>
          </div>
          
          {config.enableAirtable && (
            <div className="space-y-3 ml-7">
              <input
                type="text"
                placeholder="Base ID (e.g., appXXXXXXXXXXXXXX)"
                value={airtableConfig.baseId}
                onChange={(e) => setAirtableConfig(prev => ({ ...prev, baseId: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
              <input
                type="text"
                placeholder="Table ID or Name"
                value={airtableConfig.tableId}
                onChange={(e) => setAirtableConfig(prev => ({ ...prev, tableId: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
              <input
                type="password"
                placeholder="Personal Access Token"
                value={airtableConfig.apiKey}
                onChange={(e) => setAirtableConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
              <p className="text-xs text-gray-400">
                Create a Personal Access Token in your Airtable account settings with write permissions.
              </p>
            </div>
          )}
        </div>

        {/* Google Sheets Settings */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={config.enableGoogleSheets}
              onChange={(e) => handleConfigChange('enableGoogleSheets', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <h3 className="text-lg font-medium text-white">Google Sheets Integration</h3>
          </div>
          
          {config.enableGoogleSheets && (
            <div className="space-y-3 ml-7">
              <input
                type="text"
                placeholder="Spreadsheet ID (from the URL)"
                value={googleSheetsConfig.spreadsheetId}
                onChange={(e) => setGoogleSheetsConfig(prev => ({ ...prev, spreadsheetId: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
              <input
                type="password"
                placeholder="Google Sheets API Key"
                value={googleSheetsConfig.apiKey}
                onChange={(e) => setGoogleSheetsConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
              <p className="text-xs text-gray-400">
                Enable Google Sheets API in Google Cloud Console and create an API key with Sheets permissions.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={clearAllLogs}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Logs
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={saveConfig}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 