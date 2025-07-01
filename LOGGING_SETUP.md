# Conversation Logging Setup Guide

The voice assistant now includes comprehensive logging capabilities to save your conversations to various destinations.

## Features

✅ **Local Storage** - Automatically saves conversations in your browser  
✅ **File Downloads** - Export conversations as TXT, JSON, or CSV  
✅ **Airtable Integration** - Real-time sync to Airtable database  
✅ **Google Sheets Integration** - Real-time sync to Google Sheets  
✅ **Session Tracking** - Organized by conversation sessions  
✅ **Statistics** - View conversation analytics  

## Quick Start

1. **Enable Local Storage** (Default)
   - Conversations are automatically saved to your browser's local storage
   - Access via the "Logging" button in the voice assistant

2. **Download Conversations**
   - Click "Logging" → Choose download format (TXT, JSON, CSV)
   - Files include timestamps, session IDs, and metadata

## Advanced Setup

### Airtable Integration

1. **Create an Airtable Base**
   - Sign up at [Airtable.com](https://airtable.com)
   - Create a new base with a table for conversations

2. **Get API Credentials**
   - Go to [Airtable Account Settings](https://airtable.com/account)
   - Create a Personal Access Token with write permissions
   - Note your Base ID and Table ID/Name

3. **Configure in App**
   - Click "Logging" button → Enable Airtable Integration
   - Enter your Base ID, Table ID, and Personal Access Token
   - Save settings

**Expected Table Structure:**
```
- ID (Single line text)
- Timestamp (Date & time)
- User Input (Long text)
- AI Response (Long text)
- Session ID (Single line text)
- Processing Time (Number)
- Tokens Used (Number)
- Model (Single line text)
```

### Google Sheets Integration

1. **Set up Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable the Google Sheets API

2. **Create API Key**
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Restrict the key to Google Sheets API

3. **Prepare Your Sheet**
   - Create a Google Sheet
   - Name the first sheet "Sheet1" or update the code accordingly
   - Add headers: ID, Timestamp, User Input, AI Response, Session ID, Processing Time, Tokens Used, Model

4. **Configure in App**
   - Click "Logging" button → Enable Google Sheets Integration
   - Enter your Spreadsheet ID (from the URL) and API Key
   - Save settings

**Getting Spreadsheet ID:**
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
                                    ^^^^^^^^^^^^^^
```

## Data Structure

Each conversation log contains:

```json
{
  "id": "log_1234567890_abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "userInput": "What's the weather like?",
  "aiResponse": "I don't have access to real-time weather data...",
  "sessionId": "session_1234567890_xyz789",
  "metadata": {
    "processingTime": 1250,
    "tokensUsed": 45,
    "model": "gpt-3.5-turbo"
  }
}
```

## Privacy & Security

- **Local Storage**: Data stays in your browser
- **File Downloads**: You control when and where files are saved
- **API Keys**: Stored locally in your browser, never sent to third parties
- **Airtable/Sheets**: Data sent directly to your configured accounts

## Troubleshooting

### Airtable Issues
- Verify your Personal Access Token has write permissions
- Check Base ID and Table ID are correct
- Ensure table structure matches expected fields

### Google Sheets Issues
- Confirm Google Sheets API is enabled in your project
- Verify API key has proper permissions
- Check spreadsheet is accessible and Sheet1 exists
- Ensure columns match expected structure

### General Issues
- Check browser console for error messages
- Verify network connectivity
- Try refreshing the page and reconfiguring

## Statistics & Management

The logging system provides:
- Total conversation count
- Number of sessions
- Average response length
- Total tokens used
- First and last conversation timestamps

Use the "Clear All Logs" button to reset all local data (this won't affect external services like Airtable or Google Sheets). 