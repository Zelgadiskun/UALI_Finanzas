import type { Request, Response } from "express";
import crypto from "node:crypto";
import { getDatabase, type Slide, type Draft } from "../../db.ts";

export const slidesController = {
  // GET /api/slides
  list(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { draft_id } = req.query;

    let query = "SELECT * FROM slides WHERE account_id = ?";
    const params: unknown[] = [accountId];

    if (draft_id && typeof draft_id === "string") {
      query += " AND draft_id = ?";
      params.push(draft_id);
    }

    query += " ORDER BY order_index ASC, created_at ASC";

    const stmt = db.prepare(query);
    const slides = stmt.all(...params);

    res.json({
      data: slides,
      total: slides.length,
      accountId,
    });
  },

  // GET /api/slides/:id
  getById(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { id } = req.params;

    const stmt = db.prepare<[string, string], Slide>(
      "SELECT * FROM slides WHERE id = ? AND account_id = ?",
    );
    const slide = stmt.get(id, accountId);

    if (!slide) {
      res.status(404).json({
        error: "Not Found",
        message: `Slide '${id}' not found for this account`,
      });
      return;
    }

    res.json({ data: slide });
  },

  // POST /api/slides
  create(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { draft_id, order_index = 0, headline, body, visual_notes } = req.body ?? {};

    if (!draft_id || typeof draft_id !== "string") {
      res.status(400).json({
        error: "Validation Error",
        message: "draft_id is required to create a slide",
      });
      return;
    }

    // Verify parent draft belongs to this account
    const checkDraft = db
      .prepare<[string, string], Draft>("SELECT id FROM drafts WHERE id = ? AND account_id = ?")
      .get(draft_id, accountId);

    if (!checkDraft) {
      res.status(400).json({
        error: "Validation Error",
        message: `Parent draft '${draft_id}' does not exist for this account`,
      });
      return;
    }

    const id = `slide_${crypto.randomUUID()}`;

    const insertStmt = db.prepare(
      `INSERT INTO slides (id, account_id, draft_id, order_index, headline, body, visual_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    insertStmt.run(
      id,
      accountId,
      draft_id,
      Number(order_index) || 0,
      headline ? String(headline).trim() : null,
      body ? String(body).trim() : null,
      visual_notes ? String(visual_notes).trim() : null,
    );

    const getStmt = db.prepare<[string, string], Slide>(
      "SELECT * FROM slides WHERE id = ? AND account_id = ?",
    );
    const created = getStmt.get(id, accountId);

    res.status(201).json({
      data: created,
      message: "Slide created successfully",
    });
  },

  // PUT /api/slides/:id
  update(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { id } = req.params;
    const { order_index, headline, body, visual_notes } = req.body ?? {};

    const findStmt = db.prepare<[string, string], Slide>(
      "SELECT * FROM slides WHERE id = ? AND account_id = ?",
    );
    const existing = findStmt.get(id, accountId);

    if (!existing) {
      res.status(404).json({
        error: "Not Found",
        message: `Slide '${id}' not found for this account`,
      });
      return;
    }

    const newOrder = order_index !== undefined ? Number(order_index) : existing.order_index;
    const newHeadline =
      headline !== undefined ? (headline ? String(headline).trim() : null) : existing.headline;
    const newBody = body !== undefined ? (body ? String(body).trim() : null) : existing.body;
    const newVisualNotes =
      visual_notes !== undefined
        ? visual_notes
          ? String(visual_notes).trim()
          : null
        : existing.visual_notes;

    const updateStmt = db.prepare(
      `UPDATE slides
       SET order_index = ?, headline = ?, body = ?, visual_notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND account_id = ?`,
    );

    updateStmt.run(newOrder, newHeadline, newBody, newVisualNotes, id, accountId);

    const updated = findStmt.get(id, accountId);
    res.json({
      data: updated,
      message: "Slide updated successfully",
    });
  },

  // DELETE /api/slides/:id
  delete(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { id } = req.params;

    const deleteStmt = db.prepare("DELETE FROM slides WHERE id = ? AND account_id = ?");
    const result = deleteStmt.run(id, accountId);

    if (result.changes === 0) {
      res.status(404).json({
        error: "Not Found",
        message: `Slide '${id}' not found for this account`,
      });
      return;
    }

    res.json({
      success: true,
      deletedId: id,
      message: "Slide deleted successfully",
    });
  },
};
