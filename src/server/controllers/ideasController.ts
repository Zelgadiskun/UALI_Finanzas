import type { Request, Response } from "express";
import crypto from "node:crypto";
import { getDatabase, type Idea, type BrandPillar } from "../../db.ts";

export const ideasController = {
  // GET /api/ideas
  list(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { brand_pillar_id, status } = req.query;

    let query = `
      SELECT i.*, bp.title as brand_pillar_title, bp.color as brand_pillar_color
      FROM ideas i
      LEFT JOIN brand_pillars bp ON i.brand_pillar_id = bp.id
      WHERE i.account_id = ?
    `;
    const params: unknown[] = [accountId];

    if (brand_pillar_id && typeof brand_pillar_id === "string") {
      query += " AND i.brand_pillar_id = ?";
      params.push(brand_pillar_id);
    }

    if (status && typeof status === "string") {
      query += " AND i.status = ?";
      params.push(status);
    }

    query += " ORDER BY i.created_at DESC";

    const stmt = db.prepare(query);
    const ideas = stmt.all(...params);

    res.json({
      data: ideas,
      total: ideas.length,
      accountId,
    });
  },

  // GET /api/ideas/:id
  getById(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { id } = req.params;

    const stmt = db.prepare(`
      SELECT i.*, bp.title as brand_pillar_title, bp.color as brand_pillar_color
      FROM ideas i
      LEFT JOIN brand_pillars bp ON i.brand_pillar_id = bp.id
      WHERE i.id = ? AND i.account_id = ?
    `);
    const idea = stmt.get(id, accountId);

    if (!idea) {
      res.status(404).json({
        error: "Not Found",
        message: `Idea '${id}' not found for this account`,
      });
      return;
    }

    res.json({ data: idea });
  },

  // POST /api/ideas
  create(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { title, description, status = "backlog", brand_pillar_id } = req.body ?? {};

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({
        error: "Validation Error",
        message: "Title is required for an idea",
      });
      return;
    }

    // Tenant check on foreign key: verify referenced brand pillar belongs to this account
    if (brand_pillar_id) {
      const checkPillar = db
        .prepare<[string, string], BrandPillar>(
          "SELECT id FROM brand_pillars WHERE id = ? AND account_id = ?",
        )
        .get(brand_pillar_id, accountId);

      if (!checkPillar) {
        res.status(400).json({
          error: "Validation Error",
          message: `Referenced brand pillar '${brand_pillar_id}' does not exist for this account`,
        });
        return;
      }
    }

    const id = `idea_${crypto.randomUUID()}`;

    const insertStmt = db.prepare(
      `INSERT INTO ideas (id, account_id, brand_pillar_id, title, description, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );

    insertStmt.run(
      id,
      accountId,
      brand_pillar_id || null,
      title.trim(),
      description ? String(description).trim() : null,
      status ? String(status).trim() : "backlog",
    );

    const getStmt = db.prepare<[string, string], Idea>(
      "SELECT * FROM ideas WHERE id = ? AND account_id = ?",
    );
    const created = getStmt.get(id, accountId);

    res.status(201).json({
      data: created,
      message: "Idea created successfully",
    });
  },

  // PUT /api/ideas/:id
  update(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { id } = req.params;
    const { title, description, status, brand_pillar_id } = req.body ?? {};

    const findStmt = db.prepare<[string, string], Idea>(
      "SELECT * FROM ideas WHERE id = ? AND account_id = ?",
    );
    const existing = findStmt.get(id, accountId);

    if (!existing) {
      res.status(404).json({
        error: "Not Found",
        message: `Idea '${id}' not found for this account`,
      });
      return;
    }

    if (brand_pillar_id !== undefined && brand_pillar_id !== null) {
      const checkPillar = db
        .prepare<[string, string], BrandPillar>(
          "SELECT id FROM brand_pillars WHERE id = ? AND account_id = ?",
        )
        .get(brand_pillar_id, accountId);

      if (!checkPillar) {
        res.status(400).json({
          error: "Validation Error",
          message: `Referenced brand pillar '${brand_pillar_id}' does not exist for this account`,
        });
        return;
      }
    }

    const newTitle = title !== undefined ? String(title).trim() : existing.title;
    const newDescription =
      description !== undefined
        ? description
          ? String(description).trim()
          : null
        : existing.description;
    const newStatus = status !== undefined ? String(status).trim() : existing.status;
    const newPillarId =
      brand_pillar_id !== undefined ? brand_pillar_id || null : existing.brand_pillar_id;

    if (!newTitle) {
      res.status(400).json({
        error: "Validation Error",
        message: "Title cannot be empty",
      });
      return;
    }

    const updateStmt = db.prepare(
      `UPDATE ideas
       SET title = ?, description = ?, status = ?, brand_pillar_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND account_id = ?`,
    );

    updateStmt.run(newTitle, newDescription, newStatus, newPillarId, id, accountId);

    const updated = findStmt.get(id, accountId);
    res.json({
      data: updated,
      message: "Idea updated successfully",
    });
  },

  // DELETE /api/ideas/:id
  delete(req: Request, res: Response): void {
    const db = getDatabase();
    const accountId = req.accountId;
    const { id } = req.params;

    const deleteStmt = db.prepare("DELETE FROM ideas WHERE id = ? AND account_id = ?");
    const result = deleteStmt.run(id, accountId);

    if (result.changes === 0) {
      res.status(404).json({
        error: "Not Found",
        message: `Idea '${id}' not found for this account`,
      });
      return;
    }

    res.json({
      success: true,
      deletedId: id,
      message: "Idea deleted successfully",
    });
  },
};
