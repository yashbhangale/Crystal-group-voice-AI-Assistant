export interface ConversationLog {
  id: string;
  timestamp: Date;
  userInput: string;
  aiResponse: string;
  sessionId: string;
  metadata?: {
    processingTime?: number;
    tokensUsed?: number;
    model?: string;
  };
}

export interface LoggingConfig {
  enableLocalStorage: boolean;
  enableTextDownload: boolean;
  enableAirtable: boolean;
  enableGoogleSheets: boolean;
  airtableConfig?: {
    baseId: string;
    tableId: string;
    apiKey: string;
  };
  googleSheetsConfig?: {
    spreadsheetId: string;
    apiKey: string;
  };
}

class LoggingService {
  private config: LoggingConfig;
  private sessionId: string;
  private logs: ConversationLog[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.config = {
      enableLocalStorage: true,
      enableTextDownload: false,
      enableAirtable: false,
      enableGoogleSheets: false,
    };
    
    // Load existing logs from localStorage
    this.loadLogsFromStorage();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private loadLogsFromStorage(): void {
    if (this.config.enableLocalStorage) {
      try {
        const storedLogs = localStorage.getItem('conversationLogs');
        if (storedLogs) {
          const parsedLogs = JSON.parse(storedLogs);
          this.logs = parsedLogs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }));
        }
      } catch (error) {
        console.error('Error loading logs from storage:', error);
      }
    }
  }

  private saveLogsToStorage(): void {
    if (this.config.enableLocalStorage) {
      try {
        localStorage.setItem('conversationLogs', JSON.stringify(this.logs));
      } catch (error) {
        console.error('Error saving logs to storage:', error);
      }
    }
  }

  async logConversation(
    userInput: string, 
    aiResponse: string, 
    metadata?: ConversationLog['metadata']
  ): Promise<void> {
    const log: ConversationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      userInput,
      aiResponse,
      sessionId: this.sessionId,
      metadata
    };

    this.logs.push(log);

    // Save to different destinations
    const promises: Promise<void>[] = [];

    if (this.config.enableLocalStorage) {
      this.saveLogsToStorage();
    }

    if (this.config.enableAirtable && this.config.airtableConfig) {
      promises.push(this.saveToAirtable(log));
    }

    if (this.config.enableGoogleSheets && this.config.googleSheetsConfig) {
      promises.push(this.saveToGoogleSheets(log));
    }

    // Execute all saves concurrently
    if (promises.length > 0) {
      try {
        await Promise.allSettled(promises);
      } catch (error) {
        console.error('Error saving logs:', error);
      }
    }
  }

  private async saveToAirtable(log: ConversationLog): Promise<void> {
    if (!this.config.airtableConfig) return;

    const { baseId, tableId, apiKey } = this.config.airtableConfig;
    
    try {
      const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'ID': log.id,
            'Timestamp': log.timestamp.toISOString(),
            'User Input': log.userInput,
            'AI Response': log.aiResponse,
            'Session ID': log.sessionId,
            'Processing Time': log.metadata?.processingTime || null,
            'Tokens Used': log.metadata?.tokensUsed || null,
            'Model': log.metadata?.model || null,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving to Airtable:', error);
      throw error;
    }
  }

  private async saveToGoogleSheets(log: ConversationLog): Promise<void> {
    if (!this.config.googleSheetsConfig) return;

    const { spreadsheetId, apiKey } = this.config.googleSheetsConfig;
    
    try {
      const values = [
        [
          log.id,
          log.timestamp.toISOString(),
          log.userInput,
          log.aiResponse,
          log.sessionId,
          log.metadata?.processingTime || '',
          log.metadata?.tokensUsed || '',
          log.metadata?.model || '',
        ]
      ];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1:append?valueInputOption=RAW&key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      throw error;
    }
  }

  downloadLogsAsText(): void {
    const content = this.logs.map(log => {
      return `=== Conversation Log ===
ID: ${log.id}
Timestamp: ${log.timestamp.toLocaleString()}
Session: ${log.sessionId}

USER: ${log.userInput}

AI: ${log.aiResponse}

${log.metadata ? `Metadata: ${JSON.stringify(log.metadata, null, 2)}` : ''}
${'='.repeat(50)}
`;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_logs_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadLogsAsJSON(): void {
    const content = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadLogsAsCSV(): void {
    const headers = ['ID', 'Timestamp', 'User Input', 'AI Response', 'Session ID', 'Processing Time', 'Tokens Used', 'Model'];
    const csvContent = [
      headers.join(','),
      ...this.logs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        `"${log.userInput.replace(/"/g, '""')}"`,
        `"${log.aiResponse.replace(/"/g, '""')}"`,
        log.sessionId,
        log.metadata?.processingTime || '',
        log.metadata?.tokensUsed || '',
        log.metadata?.model || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getLogs(): ConversationLog[] {
    return [...this.logs];
  }

  getLogsBySession(sessionId: string): ConversationLog[] {
    return this.logs.filter(log => log.sessionId === sessionId);
  }

  getCurrentSessionLogs(): ConversationLog[] {
    return this.getLogsBySession(this.sessionId);
  }

  clearLogs(): void {
    this.logs = [];
    if (this.config.enableLocalStorage) {
      localStorage.removeItem('conversationLogs');
    }
  }

  getStats() {
    const totalConversations = this.logs.length;
    const sessionsCount = new Set(this.logs.map(log => log.sessionId)).size;
    const avgResponseLength = this.logs.reduce((sum, log) => sum + log.aiResponse.length, 0) / totalConversations || 0;
    const totalTokens = this.logs.reduce((sum, log) => sum + (log.metadata?.tokensUsed || 0), 0);

    return {
      totalConversations,
      sessionsCount,
      avgResponseLength: Math.round(avgResponseLength),
      totalTokens,
      firstLog: this.logs[0]?.timestamp,
      lastLog: this.logs[this.logs.length - 1]?.timestamp,
    };
  }
}

export const loggingService = new LoggingService(); 