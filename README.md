# Generic Gmail + Google Docs MCP Server

A Model Context Protocol (MCP) server that provides a standardized interface for AI agents to interact with Google Workspace capabilities, specifically drafting/sending emails in Gmail and appending content to Google Docs.

## Features

- **Gmail**: Draft an email (`gmail_create_draft`), Send an email (`gmail_send_email`)
- **Google Docs**: Append content to a document (`google_docs_append_content`)

## Setup

1. **Google Cloud Project Setup**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project or select an existing one.
   - Enable the **Gmail API** and **Google Docs API**.
   - Configure the **OAuth consent screen** (Internal or External).
   - Create **OAuth 2.0 Client IDs** (Desktop app or Web app with redirect URI).
   - Download the credentials (`client_id` and `client_secret`).

2. **Installation**:
   ```bash
   npm install
   ```

3. **Configuration**:
   Copy `.env.example` to `.env` and fill in your details:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
   GOOGLE_TOKEN_PATH=./tokens/google-token.json
   ```

4. **Authentication**:
   Before running the MCP server, you must generate an OAuth token.
   ```bash
   npm run auth
   ```
   Follow the link provided in the terminal, grant permissions, and paste the code back into the terminal. The token will be saved to `GOOGLE_TOKEN_PATH`.

5. **Build and Run**:
   ```bash
   npm run build
   npm start
   ```

## MCP Configuration

To use this server with an MCP client, configure it to run via `stdio`:

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "node",
      "args": ["/path/to/mcp-server/build/index.js"],
      "env": {
         "GOOGLE_CLIENT_ID": "...",
         "GOOGLE_CLIENT_SECRET": "...",
         "GOOGLE_REDIRECT_URI": "http://localhost:3000/oauth2callback",
         "GOOGLE_TOKEN_PATH": "/absolute/path/to/tokens/google-token.json"
      }
    }
  }
}
```
