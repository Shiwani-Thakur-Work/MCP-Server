import express from "express";
import cors from "cors";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { GmailService } from "../services/gmail-service";
import { GoogleDocsService } from "../services/google-docs-service";

const server = new Server(
  {
    name: "mcp-google-workspace",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define Schemas
const EmailSchema = z.object({
  to: z.array(z.string()),
  cc: z.array(z.string()).optional(),
  bcc: z.array(z.string()).optional(),
  subject: z.string(),
  body: z.string(),
});

const DocsAppendSchema = z.object({
  documentId: z.string(),
  content: z.string(),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "gmail_create_draft",
        description: "Creates a draft email in the authenticated user's Gmail account. This does not send the email.",
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "array", items: { type: "string" } },
            cc: { type: "array", items: { type: "string" } },
            bcc: { type: "array", items: { type: "string" } },
            subject: { type: "string" },
            body: { type: "string" }
          },
          required: ["to", "subject", "body"]
        },
      },
      {
        name: "gmail_send_email",
        description: "Sends an email from the authenticated user's Gmail account. This performs an external side effect and should only be used when the user or agent workflow has authorized sending.",
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "array", items: { type: "string" } },
            cc: { type: "array", items: { type: "string" } },
            bcc: { type: "array", items: { type: "string" } },
            subject: { type: "string" },
            body: { type: "string" }
          },
          required: ["to", "subject", "body"]
        },
      },
      {
        name: "google_docs_append_content",
        description: "Appends plain text content to the end of an existing Google Doc. Existing document content is preserved.",
        inputSchema: {
          type: "object",
          properties: {
            documentId: { type: "string" },
            content: { type: "string" }
          },
          required: ["documentId", "content"]
        },
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "gmail_create_draft": {
        const params = EmailSchema.parse(request.params.arguments);
        const result = await GmailService.createDraft(params);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }]
        };
      }
      case "gmail_send_email": {
        const params = EmailSchema.parse(request.params.arguments);
        const result = await GmailService.sendEmail(params);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }]
        };
      }
      case "google_docs_append_content": {
        const params = DocsAppendSchema.parse(request.params.arguments);
        const result = await GoogleDocsService.appendContent(params.documentId, params.content);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }]
        };
      }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error: any) {
    const errorResponse = {
      success: false,
      error: error.name || "SERVER_ERROR",
      message: error.message || "An unexpected error occurred."
    };
    return {
      isError: true,
      content: [{ type: "text", text: JSON.stringify(errorResponse) }]
    };
  }
});

export async function runServer() {
  const app = express();
  app.use(cors());

  let transport: SSEServerTransport;

  app.get("/sse", async (req, res) => {
    transport = new SSEServerTransport("/messages", res);
    await server.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send("SSE transport not active");
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.error(`MCP Server running on HTTP/SSE port ${PORT}`);
  });
}
