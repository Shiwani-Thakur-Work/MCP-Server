# Problem Statement: Generic Gmail + Google Docs MCP Server

## 1. Overview

Build a **generic Model Context Protocol (MCP) server** that exposes a
small set of Google Workspace capabilities to AI agents.

The initial version should support two core workflows:

1.  **Gmail**
    -   Draft an email
    -   Send an email
2.  **Google Docs**
    -   Append content to an existing Google Doc

The MCP server must be designed as a **reusable, agent-agnostic
integration layer**. It should not contain logic specific to one AI
agent, one prompt, or one application. Any MCP-compatible AI agent
should be able to discover and use the available tools through the
standard MCP interface.

------------------------------------------------------------------------

## 2. Problem

AI agents can generate useful content and make decisions, but they need
controlled access to external productivity tools to complete real-world
tasks.

For example, an AI agent may need to:

-   Prepare an email based on information gathered during a task.
-   Save a generated report or notes to a Google Doc.
-   Draft an email for human review before sending it.
-   Send a finalized email without requiring the user to manually copy
    and paste it.

Currently, these actions require application-specific integrations or
manual intervention.

We need a **single MCP server** that provides a clean, standardized
interface between AI agents and Google Workspace.

The MCP server should abstract away Google API details so that an AI
agent only needs to understand the MCP tools and their input/output
contracts.

------------------------------------------------------------------------

## 3. Goals

### Primary goals

-   Build an MCP-compliant server.
-   Integrate with the Gmail API.
-   Integrate with the Google Docs API.
-   Expose Gmail operations as MCP tools.
-   Expose Google Docs append functionality as an MCP tool.
-   Support both drafting and sending emails.
-   Allow AI agents to append generated content to an existing Google
    Doc.
-   Keep the implementation generic and reusable across MCP-compatible
    AI agents.
-   Use structured inputs and outputs with clear validation and error
    handling.
-   Implement secure Google OAuth authentication.
-   Keep Google API-specific implementation details inside the server
    rather than exposing them to the agent.

### Secondary goals

-   Make the server easy to run locally during development.
-   Keep the architecture extensible for future Google Workspace
    capabilities.
-   Provide clear documentation for configuring and using the MCP
    server.
-   Make the tools understandable through MCP tool descriptions so an AI
    agent can discover them without application-specific instructions.

------------------------------------------------------------------------

## 4. Non-Goals for the Initial Version

The first version does **not** need to include:

-   Gmail inbox/search functionality.
-   Reading email contents.
-   Email deletion.
-   Email labeling.
-   Google Drive file management.
-   Creating new Google Docs.
-   Editing arbitrary sections of a document.
-   Spreadsheet support.
-   Calendar support.
-   Multi-user enterprise administration.
-   Complex workflow orchestration.
-   Agent-specific business logic.
-   Autonomous decision-making about whether an email should be sent.

These can be considered future extensions.

------------------------------------------------------------------------

# 5. Functional Requirements

## 5.1 Gmail --- Draft Email

The MCP server must expose a tool that allows an AI agent to create a
Gmail draft.

### Suggested MCP tool name

`gmail_create_draft`

### Required inputs

``` json
{
  "to": ["recipient@example.com"],
  "subject": "Email subject",
  "body": "Email body"
}
```

### Optional inputs

``` json
{
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"]
}
```

The implementation may support additional email fields later, but the
initial version should keep the interface simple.

### Expected behavior

1.  Validate the email input.
2.  Authenticate with Gmail using the configured Google account.
3.  Construct a valid MIME email.
4.  Encode it according to Gmail API requirements.
5.  Create a Gmail draft.
6.  Return a structured result containing the draft identifier and
    useful metadata.

### Example response

``` json
{
  "success": true,
  "draft_id": "1234567890",
  "message": "Email draft created successfully."
}
```

The exact response structure can be improved during implementation, but
it must be deterministic and machine-readable.

------------------------------------------------------------------------

# 5.2 Gmail --- Send Email

The MCP server must expose a tool that allows an AI agent to send an
email through Gmail.

### Suggested MCP tool name

`gmail_send_email`

### Required inputs

``` json
{
  "to": ["recipient@example.com"],
  "subject": "Email subject",
  "body": "Email body"
}
```

### Optional inputs

``` json
{
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"]
}
```

### Expected behavior

1.  Validate the request.
2.  Authenticate with Gmail.
3.  Construct the MIME message.
4.  Encode the message correctly.
5.  Send the message using Gmail API.
6.  Return a structured result containing the Gmail message identifier.

### Example response

``` json
{
  "success": true,
  "message_id": "1234567890",
  "message": "Email sent successfully."
}
```

### Important safety consideration

Sending an email is an **external side effect**.

The MCP server must not silently send an email as a result of malformed
or ambiguous input.

The tool description should clearly communicate that the operation sends
an actual email.

The AI agent/client should be able to distinguish:

-   creating a draft, which does not send the email;
-   sending an email, which performs an external action.

The server should not attempt to make autonomous decisions about whether
an email should be sent.

------------------------------------------------------------------------

# 5.3 Google Docs --- Append Content

The MCP server must expose a tool that allows an AI agent to append
content to an existing Google Doc.

### Suggested MCP tool name

`google_docs_append_content`

### Required inputs

``` json
{
  "document_id": "GOOGLE_DOCUMENT_ID",
  "content": "Content to append to the document."
}
```

### Expected behavior

1.  Validate the document ID and content.
2.  Authenticate with Google.
3.  Retrieve enough document metadata to determine the current document
    end position.
4.  Append the provided content to the end of the document.
5.  Preserve existing document content.
6.  Return a structured success response.

### Example response

``` json
{
  "success": true,
  "document_id": "123abc",
  "message": "Content appended successfully."
}
```

### Formatting

The initial implementation may append plain text.

However, the architecture should allow future support for:

-   headings;
-   paragraphs;
-   bullet lists;
-   numbered lists;
-   links;
-   basic text formatting.

Do not over-engineer rich formatting in the first version.

------------------------------------------------------------------------

# 6. MCP Requirements

The server must follow the **Model Context Protocol** specification and
expose the functionality as MCP tools.

The MCP server should:

-   expose discoverable tools;
-   provide clear tool names;
-   provide descriptions that explain what each tool does;
-   define structured input schemas;
-   validate tool arguments;
-   return structured results;
-   return meaningful errors when operations fail.

The server should not assume a specific MCP client.

It should be usable by any compatible AI agent/client that supports the
transport used by the implementation.

------------------------------------------------------------------------

# 7. Generic Architecture

The architecture should separate the following concerns:

``` text
AI Agent / MCP Client
        |
        | MCP
        v
+-----------------------------+
|       MCP Server            |
|                             |
|  +-----------------------+  |
|  | MCP Tool Definitions  |  |
|  +-----------+-----------+  |
|              |              |
|      +-------+-------+      |
|      |               |      |
|      v               v      |
|   Gmail Service   Docs Service
|      |               |      |
+------+---------------+------+
       |               |
       v               v
   Gmail API       Google Docs API
       |
       v
   Google OAuth
```

### Recommended separation

#### MCP layer

Responsible for:

-   tool definitions;
-   input schemas;
-   MCP protocol communication;
-   returning tool results.

#### Service layer

Responsible for:

-   Gmail operations;
-   Google Docs operations;
-   business-independent validation;
-   converting application requests into Google API requests.

#### Authentication layer

Responsible for:

-   OAuth flow;
-   access tokens;
-   refresh tokens;
-   token persistence;
-   authentication errors.

#### Configuration layer

Responsible for:

-   Google OAuth client configuration;
-   scopes;
-   environment variables;
-   runtime configuration.

This separation should make it easy to add additional Google Workspace
tools later.

------------------------------------------------------------------------

# 8. Authentication

Use Google's OAuth 2.0 flow.

The server should request only the scopes required for the supported
functionality.

At minimum, the implementation will need appropriate permissions for:

-   Gmail draft creation;
-   Gmail sending;
-   Google Docs modification.

The exact scopes should be selected according to Google's current API
documentation and least-privilege principles.

### Requirements

-   Do not hard-code credentials.
-   Do not commit client secrets or tokens to Git.
-   Use environment variables or a secure local configuration mechanism.
-   Store refresh/access tokens securely.
-   Document the OAuth setup process.
-   Handle expired access tokens gracefully.
-   Refresh tokens when required.

The authentication implementation should be isolated so that it can be
replaced or extended later.

------------------------------------------------------------------------

# 9. Configuration

Use environment variables for configuration.

For example:

``` env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_TOKEN_PATH=
```

The exact configuration can be adapted to the selected Google
authentication approach.

Do not place secrets directly in source code.

Provide an `.env.example` file.

Example:

``` env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_TOKEN_PATH=./tokens/google-token.json
```

Actual secret values must never be committed.

------------------------------------------------------------------------

# 10. Error Handling

Errors should be predictable, actionable, and safe for AI agents to
consume.

Examples include:

### Authentication errors

``` json
{
  "success": false,
  "error": "AUTHENTICATION_REQUIRED",
  "message": "Google authentication is required."
}
```

### Invalid input

``` json
{
  "success": false,
  "error": "INVALID_INPUT",
  "message": "A valid recipient email address is required."
}
```

### Google API error

``` json
{
  "success": false,
  "error": "GOOGLE_API_ERROR",
  "message": "Google API request failed."
}
```

### Document not found

``` json
{
  "success": false,
  "error": "DOCUMENT_NOT_FOUND",
  "message": "The specified Google Doc could not be accessed."
}
```

Do not expose sensitive credentials, tokens, or internal stack traces
through MCP responses.

Detailed technical errors may be logged server-side for debugging.

------------------------------------------------------------------------

# 11. Security Requirements

Security is important because the server can perform actions on behalf
of an authenticated Google user.

The implementation must:

-   never expose OAuth client secrets;
-   never expose access or refresh tokens through MCP responses;
-   never log tokens;
-   validate user/tool inputs;
-   use least-privilege Google scopes;
-   avoid arbitrary API access;
-   avoid accepting raw Google API requests from agents;
-   sanitize or safely encode email content;
-   safely handle document content;
-   clearly separate read-only operations from side-effecting
    operations.

The MCP tools should expose **high-level safe operations**, not a
generic "execute Google API request" tool.

For example, do not create a tool like:

``` text
google_api_request(method, endpoint, body)
```

Instead expose explicit capabilities such as:

``` text
gmail_create_draft
gmail_send_email
google_docs_append_content
```

This makes the server safer, easier for agents to understand, and easier
to extend.

------------------------------------------------------------------------

# 12. Idempotency and Duplicate Actions

The initial version should document the duplicate-action behavior
clearly.

Email sending is inherently capable of producing duplicate messages if
an agent retries after an ambiguous network failure.

Where practical, design the service layer so that future idempotency
support can be added without changing the MCP interface significantly.

For the first implementation:

-   do not claim that email sending is idempotent;
-   return the Gmail message ID when Gmail confirms a successful send;
-   surface failures clearly.

------------------------------------------------------------------------

# 13. Logging

Implement useful server-side logging.

Logs may include:

-   tool invoked;
-   operation type;
-   success/failure;
-   Google API response status;
-   non-sensitive error information.

Logs must **not** include:

-   OAuth client secrets;
-   access tokens;
-   refresh tokens;
-   authorization codes;
-   sensitive credentials.

Avoid logging full email bodies by default because email content may
contain sensitive information.

------------------------------------------------------------------------

# 14. Project Structure

The exact structure may depend on the chosen language/framework, but the
implementation should follow a clean separation of concerns.

Example:

``` text
mcp-google-workspace/
│
├── src/
│   ├── server/
│   │   └── mcp-server
│   │
│   ├── tools/
│   │   ├── gmail/
│   │   │   ├── create-draft
│   │   │   └── send-email
│   │   │
│   │   └── google-docs/
│   │       └── append-content
│   │
│   ├── services/
│   │   ├── gmail-service
│   │   └── google-docs-service
│   │
│   ├── auth/
│   │   └── google-auth
│   │
│   ├── config/
│   │   └── config
│   │
│   └── utils/
│
├── tests/
│
├── .env.example
├── .gitignore
├── README.md
├── package.json
└── problemStatement.md
```

The final structure can be adapted based on whether TypeScript/Node.js
or another implementation stack is selected.

------------------------------------------------------------------------

# 15. Technology Considerations

A TypeScript/Node.js implementation is a suitable default because:

-   MCP has strong support in the JavaScript/TypeScript ecosystem;
-   Google's APIs have mature Node.js libraries;
-   schema validation can be implemented cleanly;
-   the project can be packaged and distributed easily.

However, the problem statement should not make the server dependent on a
specific MCP client or AI framework.

Recommended implementation characteristics:

-   TypeScript;
-   official MCP SDK;
-   official Google API client;
-   a schema validation library such as Zod;
-   environment-based configuration;
-   unit tests for service and validation logic.

Use current stable versions of dependencies at implementation time
rather than hard-coding outdated package versions into this
specification.

------------------------------------------------------------------------

# 16. Tool Definitions

The initial server should expose exactly these core tools.

## Tool 1: `gmail_create_draft`

**Purpose:** Create a Gmail draft without sending it.

**Input:**

``` typescript
{
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
}
```

**Output:**

``` typescript
{
  success: boolean;
  draftId?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}
```

------------------------------------------------------------------------

## Tool 2: `gmail_send_email`

**Purpose:** Send an email using Gmail.

**Input:**

``` typescript
{
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
}
```

**Output:**

``` typescript
{
  success: boolean;
  messageId?: string;
  threadId?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}
```

------------------------------------------------------------------------

## Tool 3: `google_docs_append_content`

**Purpose:** Append plain text content to the end of an existing Google
Doc.

**Input:**

``` typescript
{
  documentId: string;
  content: string;
}
```

**Output:**

``` typescript
{
  success: boolean;
  documentId?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}
```

------------------------------------------------------------------------

# 17. Agent Experience

The MCP server should make the tools easy for an AI agent to understand.

Tool descriptions should clearly state:

### Gmail draft

> Creates a draft email in the authenticated user's Gmail account. This
> does not send the email.

### Gmail send

> Sends an email from the authenticated user's Gmail account. This
> performs an external side effect and should only be used when the user
> or agent workflow has authorized sending.

### Google Docs append

> Appends plain text content to the end of an existing Google Doc.
> Existing document content is preserved.

Descriptions should avoid vague names such as:

-   `google_action`
-   `workspace_tool`
-   `execute`
-   `gmail_operation`

Use explicit, capability-oriented tool names.

------------------------------------------------------------------------

# 18. Testing Requirements

Tests should cover:

## Unit tests

-   email input validation;
-   email address validation;
-   optional CC/BCC handling;
-   MIME message construction;
-   Google Docs append request construction;
-   authentication error handling;
-   Google API error mapping;
-   invalid MCP arguments.

## Integration tests

Where practical, test against Google APIs using a dedicated test
account/project.

At minimum verify:

1.  Gmail draft creation.
2.  Gmail email sending.
3.  Google Docs content append.

Avoid using a personal production account for automated tests.

------------------------------------------------------------------------

# 19. Acceptance Criteria

The implementation is considered complete when:

### MCP

-   [ ] MCP server starts successfully.
-   [ ] MCP client can connect to the server.
-   [ ] All three tools are discoverable.
-   [ ] Tool schemas are correctly exposed.
-   [ ] Invalid arguments are rejected cleanly.

### Gmail

-   [ ] An AI agent can create a Gmail draft.
-   [ ] The draft appears in Gmail.
-   [ ] An AI agent can send an email.
-   [ ] The sent email appears in Gmail/Sent.
-   [ ] CC and BCC work when provided.
-   [ ] Gmail errors are returned in a structured format.

### Google Docs

-   [ ] An AI agent can provide a Google Doc ID and content.
-   [ ] Content is appended to the end of the document.
-   [ ] Existing content remains unchanged.
-   [ ] Invalid/inaccessible document IDs produce useful errors.

### Authentication

-   [ ] OAuth authentication works.
-   [ ] Tokens are handled securely.
-   [ ] Tokens are not exposed in MCP responses or logs.
-   [ ] Required scopes are documented.

### Generic design

-   [ ] No code depends on a specific AI agent.
-   [ ] No agent-specific prompts are hard-coded.
-   [ ] Google API implementation is separated from MCP tool
    definitions.
-   [ ] Additional tools can be added without restructuring the entire
    application.

### Documentation

-   [ ] README contains setup instructions.
-   [ ] Google Cloud project setup is documented.
-   [ ] OAuth configuration is documented.
-   [ ] MCP client configuration is documented.
-   [ ] Available tools and their schemas are documented.
-   [ ] Example tool invocations are included.
-   [ ] `.env.example` is included.

------------------------------------------------------------------------

# 20. Future Extensibility

The architecture should allow future tools to be added without changing
the core MCP server architecture.

Potential future capabilities include:

### Gmail

-   Search emails.
-   Read emails.
-   Reply to emails.
-   Forward emails.
-   Create labels.
-   Add attachments.
-   Manage threads.

### Google Docs

-   Create documents.
-   Read documents.
-   Replace text.
-   Insert content at a specific location.
-   Apply formatting.
-   Add tables.
-   Add headings.

### Google Drive

-   Search files.
-   Create files.
-   Upload files.
-   Move files.
-   Retrieve file metadata.

### Google Sheets

-   Read spreadsheet data.
-   Append rows.
-   Update cells.
-   Create spreadsheets.

### Google Calendar

-   Read events.
-   Create events.
-   Update events.
-   Cancel events.

These should be added as separate explicit MCP tools rather than turning
the server into a generic arbitrary Google API executor.

------------------------------------------------------------------------

# 21. Developer Instructions for Cursor

Use this document as the source of truth for implementing the project.

Before writing significant code:

1.  Inspect the repository and existing project structure.
2.  Determine whether an MCP server already exists.
3.  Determine the existing language/runtime and follow the repository's
    conventions where appropriate.
4.  If the project is empty, use TypeScript + Node.js as the default
    implementation.
5.  Check the current official MCP SDK documentation and Google API
    documentation before choosing APIs or deprecated methods.
6.  Prefer official SDKs/libraries over custom protocol implementations.
7.  Do not introduce unnecessary frameworks.
8.  Keep the implementation modular and testable.

### Implementation priorities

Build in this order:

1.  Project setup.
2.  MCP server initialization.
3.  Configuration/environment handling.
4.  Google OAuth authentication.
5.  Gmail service.
6.  `gmail_create_draft`.
7.  `gmail_send_email`.
8.  Google Docs service.
9.  `google_docs_append_content`.
10. Validation and structured error handling.
11. Tests.
12. README and setup documentation.

### Important implementation principle

The MCP server is an **integration layer**, not an AI agent.

Do not add:

-   prompt engineering;
-   LLM calls;
-   agent loops;
-   autonomous planning;
-   agent-specific business logic;
-   hard-coded workflows for one application.

The server should expose reliable, reusable capabilities that any
MCP-compatible AI agent can invoke.

------------------------------------------------------------------------

# 22. Definition of Done

The final repository should contain a production-minded but
appropriately scoped MCP server that allows any compatible AI agent to:

``` text
AI Agent
   |
   | MCP
   |
   +---- gmail_create_draft
   |          |
   |          v
   |       Gmail Draft
   |
   +---- gmail_send_email
   |          |
   |          v
   |       Sent Email
   |
   +---- google_docs_append_content
              |
              v
          Google Doc
```

The server should be:

-   generic;
-   secure;
-   discoverable;
-   modular;
-   testable;
-   documented;
-   easy to extend.

The initial release should solve the three core operations well rather
than attempting to implement the entire Google Workspace API surface.
