import { runServer } from "./server/mcp-server";

runServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
