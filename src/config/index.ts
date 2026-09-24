import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file if present
dotenv.config();

const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),
  GOOGLE_REDIRECT_URI: z.string().url("Google Redirect URI must be a valid URL"),
  GOOGLE_TOKEN_PATH: z.string().default('./tokens/google-token.json'),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:");
      console.error(error.flatten().fieldErrors);
      process.exit(1);
    }
    throw error;
  }
};

export const config = parseEnv();
