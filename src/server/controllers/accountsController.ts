import type { Request, Response } from "express";
import { getDatabase, type Account } from "../../db.ts";

export const accountsController = {
  // GET /api/accounts/me
  getCurrent(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;

    const stmt = db.prepare<[string], Account>("SELECT * FROM accounts WHERE id = ?");
    const account = stmt.get(accountId);

    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    res.json({ data: account });
  },

  // GET /api/accounts
  listAll(_req: Request, res: Response): void {
    const db = getDatabase();
    const stmt = db.prepare<[], Account>("SELECT * FROM accounts ORDER BY created_at DESC");
    const accounts = stmt.all();
    res.json({ data: accounts });
  },
};
