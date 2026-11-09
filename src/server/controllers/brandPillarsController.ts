import type { Request, Response } from "express";
import crypto from "node:crypto";
import { getDatabase, type BrandPillar } from "../../db.ts";

export const brandPillarsController = {
  // GET /api/brand-pillars
  list(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;

    const stmt = db.prepare<[string], BrandPillar>(
      "SELECT * FROM brand_pillars WHERE account_id = ? ORDER BY created_at DESC",
    );
    const pillars = stmt.all(accountId);

    res.json({
      data: pillars,
      total: pillars.length,
      accountId,
    });
  },

  // GET /api/brand-pillars/:id
  getById(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { id } = req.params;

    const stmt = db.prepare<[string, string], BrandPillar>(
      "SELECT * FROM brand_pillars WHERE id = ? AND account_id = ?",
    );
    const pillar = stmt.get(id, accountId);

    if (!pillar) {
      res.status(404).json({
        error: "Not Found",
        message: `Brand pillar '${id}' not found for this account`,
      });
      return;
    }

    res.json({ data: pillar });
  },

  // POST /api/brand-pillars
  create(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { title, description, tone, color } = req.body ?? {};

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({
        error: "Validation Error",
        message: "Title is required for a brand pillar",
      });
      return;
    }

    const id = `bp_${crypto.randomUUID()}`;

    const insertStmt = db.prepare(
      `INSERT INTO brand_pillars (id, account_id, title, description, tone, color)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );

    insertStmt.run(
      id,
      accountId,
      title.trim(),
      description ? String(description).trim() : null,
      tone ? String(tone).trim() : null,
      color ? String(color).trim() : null,
    );

    const getStmt = db.prepare<[string, string], BrandPillar>(
      "SELECT * FROM brand_pillars WHERE id = ? AND account_id = ?",
    );
    const created = getStmt.get(id, accountId);

    res.status(201).json({
      data: created,
      message: "Brand pillar created successfully",
    });
  },

  // PUT /api/brand-pillars/:id
  update(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { id } = req.params;
    const { title, description, tone, color } = req.body ?? {};

    const findStmt = db.prepare<[string, string], BrandPillar>(
      "SELECT * FROM brand_pillars WHERE id = ? AND account_id = ?",
    );
    const existing = findStmt.get(id, accountId);

    if (!existing) {
      res.status(404).json({
        error: "Not Found",
        message: `Brand pillar '${id}' not found for this account`,
      });
      return;
    }

    const newTitle = title !== undefined ? String(title).trim() : existing.title;
    const newDescription =
      description !== undefined
        ? description
          ? String(description).trim()
          : null
        : existing.description;
    const newTone = tone !== undefined ? (tone ? String(tone).trim() : null) : existing.tone;
    const newColor = color !== undefined ? (color ? String(color).trim() : null) : existing.color;

    if (!newTitle) {
      res.status(400).json({
        error: "Validation Error",
        message: "Title cannot be empty",
      });
      return;
    }

    const updateStmt = db.prepare(
      `UPDATE brand_pillars
       SET title = ?, description = ?, tone = ?, color = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND account_id = ?`,
    );

    updateStmt.run(newTitle, newDescription, newTone, newColor, id, accountId);

    const updated = findStmt.get(id, accountId);
    res.json({
      data: updated,
      message: "Brand pillar updated successfully",
    });
  },

  // DELETE /api/brand-pillars/:id
  delete(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { id } = req.params;

    const deleteStmt = db.prepare("DELETE FROM brand_pillars WHERE id = ? AND account_id = ?");
    const result = deleteStmt.run(id, accountId);

    if (result.changes === 0) {
      res.status(404).json({
        error: "Not Found",
        message: `Brand pillar '${id}' not found for this account`,
      });
      return;
    }

    res.json({
      success: true,
      deletedId: id,
      message: "Brand pillar deleted successfully",
    });
  },
};
