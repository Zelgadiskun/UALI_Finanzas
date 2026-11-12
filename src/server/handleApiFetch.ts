import {
  getDatabase,
  ensureAccountExists,
  type BrandPillar,
  type Idea,
  type Draft,
  type Slide,
} from "../db";
import crypto from "node:crypto";

/**
 * Web standard Request handler for /api endpoints.
 * Enforces Fase 2 (auth/context via X-Account-ID) and Fase 3 (WHERE account_id = ?).
 */
export async function handleApiFetch(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (!pathname.startsWith("/api/")) {
    return null;
  }

  // Healthcheck is public
  if (pathname === "/api/health") {
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "multi-tenant-content-engine",
      }),
      { headers: { "content-type": "application/json" } },
    );
  }

  // Bypass location radar
  if (pathname === "/api/location-radar") {
    return null;
  }

  // Fase 2: Auth Context - Extract 'X-Account-ID'
  const rawAccountId = request.headers.get("x-account-id");
  if (!rawAccountId) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Missing required 'X-Account-ID' header",
      }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  const accountId = rawAccountId.trim();
  if (!accountId) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "The 'X-Account-ID' header cannot be empty",
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  // Ensure account exists
  ensureAccountExists(accountId);

  const db = getDatabase();
  const method = request.method.toUpperCase();

  // Route: /api/accounts/me
  if (pathname === "/api/accounts/me" && method === "GET") {
    const acc = db.prepare("SELECT * FROM accounts WHERE id = ?").get(accountId);
    return new Response(JSON.stringify({ data: acc }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Route: /api/brand-pillars
  if (pathname === "/api/brand-pillars") {
    if (method === "GET") {
      const rows = db
        .prepare("SELECT * FROM brand_pillars WHERE account_id = ? ORDER BY created_at DESC")
        .all(accountId);
      return new Response(JSON.stringify({ data: rows, total: rows.length, accountId }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (method === "POST") {
      const body = (await request.json().catch(() => ({}))) as {
        title?: string;
        description?: string;
        tone?: string;
        color?: string;
      };
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        return new Response(
          JSON.stringify({
            error: "Validation Error",
            message: "Title is required for a brand pillar",
          }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }
      const id = `bp_${crypto.randomUUID()}`;
      db.prepare(
        "INSERT INTO brand_pillars (id, account_id, title, description, tone, color) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(
        id,
        accountId,
        body.title.trim(),
        body.description?.trim() || null,
        body.tone?.trim() || null,
        body.color?.trim() || null,
      );
      const created = db
        .prepare("SELECT * FROM brand_pillars WHERE id = ? AND account_id = ?")
        .get(id, accountId);
      return new Response(
        JSON.stringify({ data: created, message: "Brand pillar created successfully" }),
        {
          status: 201,
          headers: { "content-type": "application/json" },
        },
      );
    }
  }

  const brandPillarMatch = pathname.match(/^\/api\/brand-pillars\/([^/]+)$/);
  if (brandPillarMatch) {
    const id = brandPillarMatch[1];
    if (method === "GET") {
      const row = db
        .prepare("SELECT * FROM brand_pillars WHERE id = ? AND account_id = ?")
        .get(id, accountId);
      if (!row) {
        return new Response(
          JSON.stringify({ error: "Not Found", message: `Brand pillar '${id}' not found` }),
          {
            status: 404,
            headers: { "content-type": "application/json" },
          },
        );
      }
      return new Response(JSON.stringify({ data: row }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (method === "PUT" || method === "PATCH") {
      const existing = db
        .prepare<[string, string], BrandPillar>(
          "SELECT * FROM brand_pillars WHERE id = ? AND account_id = ?",
        )
        .get(id, accountId);
      if (!existing) {
        return new Response(
          JSON.stringify({ error: "Not Found", message: `Brand pillar '${id}' not found` }),
          {
            status: 404,
            headers: { "content-type": "application/json" },
          },
        );
      }
      const body = (await request.json().catch(() => ({}))) as {
        title?: string;
        description?: string;
        tone?: string;
        color?: string;
      };
      const title = body.title !== undefined ? String(body.title).trim() : existing.title;
      const desc =
        body.description !== undefined
          ? body.description
            ? String(body.description).trim()
            : null
          : existing.description;
      const tone =
        body.tone !== undefined ? (body.tone ? String(body.tone).trim() : null) : existing.tone;
      const color =
        body.color !== undefined ? (body.color ? String(body.color).trim() : null) : existing.color;
      db.prepare(
        "UPDATE brand_pillars SET title = ?, description = ?, tone = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND account_id = ?",
      ).run(title, desc, tone, color, id, accountId);
      const updated = db
        .prepare("SELECT * FROM brand_pillars WHERE id = ? AND account_id = ?")
        .get(id, accountId);
      return new Response(JSON.stringify({ data: updated }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (method === "DELETE") {
      const res = db
        .prepare("DELETE FROM brand_pillars WHERE id = ? AND account_id = ?")
        .run(id, accountId);
      if (res.changes === 0) {
        return new Response(
          JSON.stringify({ error: "Not Found", message: `Brand pillar '${id}' not found` }),
          {
            status: 404,
            headers: { "content-type": "application/json" },
          },
        );
      }
      return new Response(JSON.stringify({ success: true, deletedId: id }), {
        headers: { "content-type": "application/json" },
      });
    }
  }

  // Route: /api/ideas
  if (pathname === "/api/ideas") {
    if (method === "GET") {
      const pillarId = url.searchParams.get("brand_pillar_id");
      let q =
        "SELECT i.*, bp.title as brand_pillar_title, bp.color as brand_pillar_color FROM ideas i LEFT JOIN brand_pillars bp ON i.brand_pillar_id = bp.id WHERE i.account_id = ?";
      const params: unknown[] = [accountId];
      if (pillarId) {
        q += " AND i.brand_pillar_id = ?";
        params.push(pillarId);
      }
      q += " ORDER BY i.created_at DESC";
      const rows = db.prepare(q).all(...params);
      return new Response(JSON.stringify({ data: rows, total: rows.length, accountId }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (method === "POST") {
      const body = (await request.json().catch(() => ({}))) as {
        title?: string;
        description?: string;
        status?: string;
        brand_pillar_id?: string;
      };
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        return new Response(
          JSON.stringify({ error: "Validation Error", message: "Title is required for an idea" }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }
      if (body.brand_pillar_id) {
        const pillar = db
          .prepare("SELECT id FROM brand_pillars WHERE id = ? AND account_id = ?")
          .get(body.brand_pillar_id, accountId);
        if (!pillar) {
          return new Response(
            JSON.stringify({
              error: "Validation Error",
              message: `Brand pillar '${body.brand_pillar_id}' does not exist for this account`,
            }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }
      }
      const id = `idea_${crypto.randomUUID()}`;
      db.prepare(
        "INSERT INTO ideas (id, account_id, brand_pillar_id, title, description, status) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(
        id,
        accountId,
        body.brand_pillar_id || null,
        body.title.trim(),
        body.description?.trim() || null,
        body.status?.trim() || "backlog",
      );
      const created = db
        .prepare("SELECT * FROM ideas WHERE id = ? AND account_id = ?")
        .get(id, accountId);
      return new Response(JSON.stringify({ data: created, message: "Idea created successfully" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }
  }

  const ideaMatch = pathname.match(/^\/api\/ideas\/([^/]+)$/);
  if (ideaMatch) {
    const id = ideaMatch[1];
    if (method === "GET") {
      const row = db
        .prepare(
          "SELECT i.*, bp.title as brand_pillar_title FROM ideas i LEFT JOIN brand_pillars bp ON i.brand_pillar_id = bp.id WHERE i.id = ? AND i.account_id = ?",
        )
        .get(id, accountId);
      if (!row) {
        return new Response(
          JSON.stringify({ error: "Not Found", message: `Idea '${id}' not found` }),
          {
            status: 404,
            headers: { "content-type": "application/json" },
          },
        );
      }
      return new Response(JSON.stringify({ data: row }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (method === "DELETE") {
      const res = db
        .prepare("DELETE FROM ideas WHERE id = ? AND account_id = ?")
        .run(id, accountId);
      if (res.changes === 0) {
        return new Response(
          JSON.stringify({ error: "Not Found", message: `Idea '${id}' not found` }),
          {
            status: 404,
            headers: { "content-type": "application/json" },
          },
        );
      }
      return new Response(JSON.stringify({ success: true, deletedId: id }), {
        headers: { "content-type": "application/json" },
      });
    }
  }

  // Route: /api/drafts
  if (pathname === "/api/drafts") {
    if (method === "GET") {
      const rows = db
        .prepare("SELECT * FROM drafts WHERE account_id = ? ORDER BY created_at DESC")
        .all(accountId);
      return new Response(JSON.stringify({ data: rows, total: rows.length, accountId }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (method === "POST") {
      const body = (await request.json().catch(() => ({}))) as {
        title?: string;
        content?: string;
        status?: string;
        idea_id?: string;
      };
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        return new Response(
          JSON.stringify({ error: "Validation Error", message: "Title is required for a draft" }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }
      if (body.idea_id) {
        const idea = db
          .prepare("SELECT id FROM ideas WHERE id = ? AND account_id = ?")
          .get(body.idea_id, accountId);
        if (!idea) {
          return new Response(
            JSON.stringify({
              error: "Validation Error",
              message: `Referenced idea '${body.idea_id}' does not exist for this account`,
            }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }
      }
      const id = `draft_${crypto.randomUUID()}`;
      db.prepare(
        "INSERT INTO drafts (id, account_id, idea_id, title, content, status) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(
        id,
        accountId,
        body.idea_id || null,
        body.title.trim(),
        body.content?.trim() || null,
        body.status?.trim() || "draft",
      );
      const created = db
        .prepare("SELECT * FROM drafts WHERE id = ? AND account_id = ?")
        .get(id, accountId);
      return new Response(
        JSON.stringify({ data: created, message: "Draft created successfully" }),
        {
          status: 201,
          headers: { "content-type": "application/json" },
        },
      );
    }
  }

  // Route: /api/slides
  if (pathname === "/api/slides") {
    if (method === "GET") {
      const draftId = url.searchParams.get("draft_id");
      let q = "SELECT * FROM slides WHERE account_id = ?";
      const params: unknown[] = [accountId];
      if (draftId) {
        q += " AND draft_id = ?";
        params.push(draftId);
      }
      q += " ORDER BY order_index ASC";
      const rows = db.prepare(q).all(...params);
      return new Response(JSON.stringify({ data: rows, total: rows.length, accountId }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (method === "POST") {
      const body = (await request.json().catch(() => ({}))) as {
        draft_id?: string;
        order_index?: number;
        headline?: string;
        body?: string;
        visual_notes?: string;
      };
      if (!body.draft_id) {
        return new Response(
          JSON.stringify({ error: "Validation Error", message: "draft_id is required" }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }
      const draft = db
        .prepare("SELECT id FROM drafts WHERE id = ? AND account_id = ?")
        .get(body.draft_id, accountId);
      if (!draft) {
        return new Response(
          JSON.stringify({
            error: "Validation Error",
            message: `Parent draft '${body.draft_id}' does not exist for this account`,
          }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }
      const id = `slide_${crypto.randomUUID()}`;
      db.prepare(
        "INSERT INTO slides (id, account_id, draft_id, order_index, headline, body, visual_notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).run(
        id,
        accountId,
        body.draft_id,
        body.order_index ?? 0,
        body.headline?.trim() || null,
        body.body?.trim() || null,
        body.visual_notes?.trim() || null,
      );
      const created = db
        .prepare("SELECT * FROM slides WHERE id = ? AND account_id = ?")
        .get(id, accountId);
      return new Response(
        JSON.stringify({ data: created, message: "Slide created successfully" }),
        {
          status: 201,
          headers: { "content-type": "application/json" },
        },
      );
    }
  }

  return null;
}
