import type { Request, Response } from "express";
import crypto from "node:crypto";
import { getDatabase, type Draft, type Idea } from "../../db.ts";

export const draftsController = {
  // GET /api/drafts
  list(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { idea_id, status } = req.query;

    let query = `
      SELECT d.*, i.title as idea_title,
             (SELECT COUNT(*) FROM slides s WHERE s.draft_id = d.id AND s.account_id = d.account_id) as slide_count
      FROM drafts d
      LEFT JOIN ideas i ON d.idea_id = i.id
      WHERE d.account_id = ?
    `;
    const params: unknown[] = [accountId];

    if (idea_id && typeof idea_id === "string") {
      query += " AND d.idea_id = ?";
      params.push(idea_id);
    }

    if (status && typeof status === "string") {
      query += " AND d.status = ?";
      params.push(status);
    }

    query += " ORDER BY d.created_at DESC";

    const stmt = db.prepare(query);
    const drafts = stmt.all(...params);

    res.json({
      data: drafts,
      total: drafts.length,
      accountId,
    });
  },

  // GET /api/drafts/:id
  getById(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { id } = req.params;

    const stmt = db.prepare(`
      SELECT d.*, i.title as idea_title
      FROM drafts d
      LEFT JOIN ideas i ON d.idea_id = i.id
      WHERE d.id = ? AND d.account_id = ?
    `);
    const draft = stmt.get(id, accountId);

    if (!draft) {
      res.status(404).json({
        error: "Not Found",
        message: `Draft '${id}' not found for this account`,
      });
      return;
    }

    // Include slides belonging to this draft and account
    const slidesStmt = db.prepare(
      "SELECT * FROM slides WHERE draft_id = ? AND account_id = ? ORDER BY order_index ASC",
    );
    const slides = slidesStmt.all(id, accountId);

    res.json({
      data: {
        ...(draft as Record<string, unknown>),
        slides,
      },
    });
  },

  // POST /api/drafts
  create(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { title, content, status = "draft", idea_id } = req.body ?? {};

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({
        error: "Validation Error",
        message: "Title is required for a draft",
      });
      return;
    }

    // Verify idea belongs to this account if specified
    if (idea_id) {
      const checkIdea = db
        .prepare<[string, string], Idea>("SELECT id FROM ideas WHERE id = ? AND account_id = ?")
        .get(idea_id, accountId);

      if (!checkIdea) {
        res.status(400).json({
          error: "Validation Error",
          message: `Referenced idea '${idea_id}' does not exist for this account`,
        });
        return;
      }
    }

    const id = `draft_${crypto.randomUUID()}`;

    const insertStmt = db.prepare(
      `INSERT INTO drafts (id, account_id, idea_id, title, content, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );

    insertStmt.run(
      id,
      accountId,
      idea_id || null,
      title.trim(),
      content ? String(content).trim() : null,
      status ? String(status).trim() : "draft",
    );

    const getStmt = db.prepare<[string, string], Draft>(
      "SELECT * FROM drafts WHERE id = ? AND account_id = ?",
    );
    const created = getStmt.get(id, accountId);

    res.status(201).json({
      data: created,
      message: "Draft created successfully",
    });
  },

  // PUT /api/drafts/:id
  update(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { id } = req.params;
    const { title, content, status, idea_id } = req.body ?? {};

    const findStmt = db.prepare<[string, string], Draft>(
      "SELECT * FROM drafts WHERE id = ? AND account_id = ?",
    );
    const existing = findStmt.get(id, accountId);

    if (!existing) {
      res.status(404).json({
        error: "Not Found",
        message: `Draft '${id}' not found for this account`,
      });
      return;
    }

    if (idea_id !== undefined && idea_id !== null) {
      const checkIdea = db
        .prepare<[string, string], Idea>("SELECT id FROM ideas WHERE id = ? AND account_id = ?")
        .get(idea_id, accountId);

      if (!checkIdea) {
        res.status(400).json({
          error: "Validation Error",
          message: `Referenced idea '${idea_id}' does not exist for this account`,
        });
        return;
      }
    }

    const newTitle = title !== undefined ? String(title).trim() : existing.title;
    const newContent =
      content !== undefined ? (content ? String(content).trim() : null) : existing.content;
    const newStatus = status !== undefined ? String(status).trim() : existing.status;
    const newIdeaId = idea_id !== undefined ? idea_id || null : existing.idea_id;

    if (!newTitle) {
      res.status(400).json({
        error: "Validation Error",
        message: "Title cannot be empty",
      });
      return;
    }

    const updateStmt = db.prepare(
      `UPDATE drafts
       SET title = ?, content = ?, status = ?, idea_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND account_id = ?`,
    );

    updateStmt.run(newTitle, newContent, newStatus, newIdeaId, id, accountId);

    const updated = findStmt.get(id, accountId);
    res.json({
      data: updated,
      message: "Draft updated successfully",
    });
  },

  // DELETE /api/drafts/:id
  delete(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { id } = req.params;

    const deleteStmt = db.prepare("DELETE FROM drafts WHERE id = ? AND account_id = ?");
    const result = deleteStmt.run(id, accountId);

    if (result.changes === 0) {
      res.status(404).json({
        error: "Not Found",
        message: `Draft '${id}' not found for this account`,
      });
      return;
    }

    res.json({
      success: true,
      deletedId: id,
      message: "Draft deleted successfully",
    });
  },
};
