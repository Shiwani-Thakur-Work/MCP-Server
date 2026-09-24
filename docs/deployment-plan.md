# Railway Deployment Plan for MCP Google Workspace Server

This document outlines the necessary steps to deploy this local MCP (Model Context Protocol) server to [Railway](https://railway.app). 

## 1. Architectural Changes Required

Currently, the server uses standard input/output (`StdioServerTransport`) for local client-server communication. Additionally, it relies on a local interactive OAuth flow and file-based token storage, which is not suitable for a cloud environment.

### A. Switch to SSE (Server-Sent Events) Transport
Railway relies on HTTP networking. To allow a remote MCP client to connect to your server, you need to expose the server over HTTP using `SSEServerTransport` with a framework like Express.

1. **Install Express**: `npm install express cors` and `npm install -D @types/express @types/cors`.
2. **Update `src/index.ts` & `src/server/mcp-server.ts`**:
   - Replace `StdioServerTransport` with `SSEServerTransport`.
   - Start an Express server listening on `process.env.PORT || 3000`.
   - Create endpoints (e.g., `/sse` and `/messages`) to handle the MCP connections.

### B. Handle Google Credentials and Auth Tokens
Railway containers have ephemeral file systems, so saving `tokens/token.json` locally will result in re-authentication prompts every time the container restarts.

**Option 1 (Recommended): Use Google Service Accounts**
- Switch from OAuth Client ID to a Google Cloud Service Account.
- Service Accounts don't require interactive user consent.
- Encode the Service Account JSON key as a base64 string and store it in a Railway Environment Variable (e.g., `GOOGLE_SERVICE_ACCOUNT_BASE64`).
- Modify `src/services/gmail-service.ts` and `google-docs-service.ts` to use `new google.auth.GoogleAuth(...)` instead of OAuth2.

**Option 2: Persistent Refresh Token via Env Vars**
- Complete the OAuth flow locally to generate `token.json`.
- Extract the `refresh_token`, `client_id`, and `client_secret`.
- Pass these to Railway as Environment Variables (e.g., `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`).
- Update your auth code to instantiate the `OAuth2Client` directly from these environment variables rather than reading from the filesystem.

---

## 2. Prepare the Codebase for Railway

Railway uses Nixpacks to automatically detect and build Node.js applications. 

1. Ensure your `package.json` has the correct scripts (already present):
   ```json
   "scripts": {
     "build": "tsc",
     "start": "node build/index.js"
   }
   ```
2. **Port Binding**: Ensure your Express server binds to the `PORT` environment variable provided by Railway:
   ```typescript
   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
   ```
3. Add `tokens/` and `client_secret_*.json` to `.gitignore` to prevent leaking secrets.

---

## 3. Deployment Steps on Railway

1. **Commit and Push** your updated code to a GitHub repository.
2. Log in to [Railway](https://railway.app) and create a **New Project**.
3. Select **Deploy from GitHub repo** and choose your repository.
4. **Configure Environment Variables**:
   Go to the Variables tab in Railway and add:
   - `PORT`: `3000`
   - `GOOGLE_SERVICE_ACCOUNT_BASE64`: `your_base64_encoded_service_account_json` (if using Option 1)
   - Or OAuth credentials (if using Option 2).
5. Railway will automatically build (using `npm install` and `npm run build`) and deploy your app.
6. **Generate a Domain**: Under the "Settings" tab in Railway, click **Generate Domain** in the "Networking" section to get a public URL for your MCP server (e.g., `https://mcp-server-production.up.railway.app`).

---

## 4. Connecting the Client
Once deployed, configure your AI Agent / MCP Client to connect to your Railway URL using an SSE connection instead of local STDIO.

**Example Client Configuration:**
- **URL**: `https://mcp-server-production.up.railway.app/sse`
- **Transport**: SSE
