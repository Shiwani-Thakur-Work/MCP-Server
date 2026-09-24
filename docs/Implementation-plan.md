# Implementation Plan: Generic Gmail + Google Docs MCP Server

Based on the `problemStatement.md`, here is a step-by-step implementation plan to build the MCP server using TypeScript and Node.js.

## Phase 1: Project Setup and Foundation

1. **Initialize Project**
   - Initialize a new Node.js project (`npm init`).
   - Setup TypeScript configuration (`tsc --init`).
   - Configure build scripts in `package.json`.
   - Setup basic project structure (`src/server`, `src/tools`, `src/services`, `src/auth`, `src/config`, `src/utils`).

2. **Dependencies**
   - Install official MCP SDK (`@modelcontextprotocol/sdk`).
   - Install Google APIs Node.js Client (`googleapis`).
   - Install Zod for schema validation (`zod`).
   - Install Dotenv for environment variables (`dotenv`).
   - Install development dependencies (TypeScript, types, testing framework like Jest).

3. **Configuration & Environment Handling**
   - Create `.env.example` with required variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_TOKEN_PATH`).
   - Implement a configuration module (`src/config/index.ts`) using Zod to validate the environment variables.

## Phase 2: Authentication Layer

1. **Google OAuth Integration**
   - Implement `src/auth/google-auth.ts`.
   - Setup OAuth2 client using `googleapis`.
   - Implement logic to load tokens from a file, handle authentication flow, and refresh tokens automatically.
   - Securely manage `access_token` and `refresh_token` without exposing them.

## Phase 3: Service Layer (Google API Integration)

1. **Gmail Service**
   - Implement `src/services/gmail-service.ts`.
   - Implement `createDraft` method:
     - Take `to`, `cc`, `bcc`, `subject`, `body`.
     - Construct a valid MIME message.
     - Call `gmail.users.drafts.create`.
   - Implement `sendEmail` method:
     - Take the same inputs.
     - Construct a valid MIME message.
     - Call `gmail.users.messages.send`.

2. **Google Docs Service**
   - Implement `src/services/google-docs-service.ts`.
   - Implement `appendContent` method:
     - Take `documentId` and `content`.
     - Retrieve document metadata to find the end index.
     - Call `docs.documents.batchUpdate` with `insertText` request at the end of the document.

## Phase 4: MCP Layer (Tool Definitions & Server)

1. **MCP Server Initialization**
   - Implement `src/server/mcp-server.ts`.
   - Setup the MCP server instance.

2. **Define Tools and Schemas**
   - **`gmail_create_draft`** tool:
     - Define input schema using Zod.
     - Add descriptive documentation for the agent.
     - Map handler to `GmailService.createDraft`.
   - **`gmail_send_email`** tool:
     - Define input schema.
     - Add clear warnings that this performs a side-effect (sending an actual email).
     - Map handler to `GmailService.sendEmail`.
   - **`google_docs_append_content`** tool:
     - Define input schema.
     - Add documentation.
     - Map handler to `GoogleDocsService.appendContent`.

3. **Validation and Error Handling**
   - Implement a centralized error handler or structured error mapping in the MCP handlers.
   - Catch Google API errors and return structured, non-sensitive MCP responses (`success: false`, `error`, `message`).
   - Ensure authentication errors are explicitly reported.

## Phase 5: Testing and Polish

1. **Unit Tests**
   - Write unit tests for email validation, MIME construction, and Google Docs request building.
   - Test MCP argument validation using Zod.
   - Test error mappings.

2. **Integration Tests**
   - Implement basic integration tests against test Google accounts (if applicable), or mock the `googleapis` responses for testing tool execution end-to-end.

3. **Documentation**
   - Write a detailed `README.md`.
   - Include setup instructions (creating a Google Cloud project, setting up OAuth consent screen, generating credentials).
   - Document the supported MCP tools and their schemas.

## Phase 6: Review and Finalize

1. Verify against Acceptance Criteria.
2. Ensure strict separation of concerns (no agent-specific prompts or logic).
3. Ensure no secrets are logged or returned in responses.
