import type { Request, Response, NextFunction } from "express";
import { ensureAccountExists, type Account } from "../../db.ts";

// Extend Express Request interface to include account context
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      accountId: string;
      account?: Account;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * Middleware: authContext
 * Extracts 'X-Account-ID' from incoming HTTP headers.
 * Rejects requests without the required account identifier.
 * Ensures the account exists in SQLite and populates req.accountId & req.account.
 */
export function authContext(req: Request, res: Response, next: NextFunction): void {
  const rawAccountId = req.headers["x-account-id"];

  if (!rawAccountId) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing required 'X-Account-ID' header",
    });
    return;
  }

  const accountId = (Array.isArray(rawAccountId) ? rawAccountId[0] : rawAccountId).trim();

  if (!accountId) {
    res.status(400).json({
      error: "Bad Request",
      message: "The 'X-Account-ID' header cannot be empty",
    });
    return;
  }

  try {
    const account = ensureAccountExists(accountId);
    req.accountId = accountId;
    req.account = account;
    next();
  } catch (err: unknown) {
    res.status(500).json({
      error: "Internal Server Error",
      message: (err as Error)?.message || "Failed to establish tenant account context",
    });
  }
}

export default authContext;
