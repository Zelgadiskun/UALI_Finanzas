import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { initDatabase, closeDatabase, getDatabase, ensureAccountExists } from "../../db";
import { authContext } from "../middleware/authContext";
import { expressApp } from "../app";
import type { Request, Response } from "express";

describe("Multi-Tenant Architecture (Fases 1, 2 y 3)", () => {
  let db: Database.Database;

  beforeEach(() => {
    // Use an in-memory database or isolated test db
    process.env.SQLITE_DB_PATH = ":memory:";
    closeDatabase();
    db = initDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
    delete process.env.SQLITE_DB_PATH;
  });

  describe("Fase 1: SQLite Schema & Foreign Keys", () => {
    it("should have brand_pillars table with account_id and foreign key constraint", () => {
      const tableInfo = db.prepare("PRAGMA table_info(brand_pillars)").all() as Array<{
        name: string;
      }>;
      const columnNames = tableInfo.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("account_id");
      expect(columnNames).toContain("title");
      expect(columnNames).toContain("description");
      expect(columnNames).toContain("tone");
      expect(columnNames).toContain("color");
      expect(columnNames).toContain("created_at");
      expect(columnNames).toContain("updated_at");

      const fks = db.prepare("PRAGMA foreign_key_list(brand_pillars)").all() as Array<{
        table: string;
        to: string;
        on_delete: string;
      }>;
      expect(
        fks.some((fk) => fk.table === "accounts" && fk.to === "id" && fk.on_delete === "CASCADE"),
      ).toBe(true);
    });

    it("should have account_id with foreign keys and indexes in ideas, drafts, and slides", () => {
      for (const table of ["ideas", "drafts", "slides"]) {
        const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
          name: string;
        }>;
        const columnNames = tableInfo.map((c) => c.name);
        expect(columnNames).toContain("account_id");

        const fks = db.prepare(`PRAGMA foreign_key_list(${table})`).all() as Array<{
          table: string;
          to: string;
          on_delete: string;
        }>;
        expect(
          fks.some((fk) => fk.table === "accounts" && fk.to === "id" && fk.on_delete === "CASCADE"),
        ).toBe(true);
      }

      // Check indexes
      const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
        .all() as Array<{ name: string }>;
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain("idx_brand_pillars_account_id");
      expect(indexNames).toContain("idx_ideas_account_id");
      expect(indexNames).toContain("idx_drafts_account_id");
      expect(indexNames).toContain("idx_slides_account_id");
    });
  });

  describe("Fase 2: Express Middleware (auth/context)", () => {
    it("should return 401 Unauthorized when X-Account-ID header is missing", () => {
      let statusCode = 0;
      let jsonPayload: unknown = null;

      const mockReq = {
        headers: {},
      } as unknown as Request;

      const mockRes = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: unknown) {
          jsonPayload = data;
          return this;
        },
      } as unknown as Response;

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      authContext(mockReq, mockRes, next);

      expect(statusCode).toBe(401);
      expect(nextCalled).toBe(false);
      expect(jsonPayload).toMatchObject({
        error: "Unauthorized",
      });
    });

    it("should return 400 Bad Request when X-Account-ID header is blank", () => {
      let statusCode = 0;
      let jsonPayload: unknown = null;

      const mockReq = {
        headers: {
          "x-account-id": "   ",
        },
      } as unknown as Request;

      const mockRes = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: unknown) {
          jsonPayload = data;
          return this;
        },
      } as unknown as Response;

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      authContext(mockReq, mockRes, next);

      expect(statusCode).toBe(400);
      expect(nextCalled).toBe(false);
      expect(jsonPayload).toMatchObject({
        error: "Bad Request",
      });
    });

    it("should set req.accountId and req.account and call next() when header is provided", () => {
      const mockReq = {
        headers: {
          "x-account-id": "tenant_123",
        },
      } as unknown as Request;

      const mockRes = {} as unknown as Response;

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      authContext(mockReq, mockRes, next);

      expect(nextCalled).toBe(true);
      expect(mockReq.accountId).toBe("tenant_123");
      expect(mockReq.account?.id).toBe("tenant_123");
    });
  });

  describe("Fase 3: API Route Controllers with WHERE account_id = ?", () => {
    const createMockReq = (accountId: string, overrides: Partial<Request> = {}): Request => {
      return {
        accountId,
        headers: { "x-account-id": accountId },
        query: {},
        params: {},
        body: {},
        ...overrides,
      } as unknown as Request;
    };

    const createMockRes = () => {
      let statusCode = 200;
      let responseData: unknown = null;

      const res = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: unknown) {
          responseData = data;
          return this;
        },
        getStatus() {
          return statusCode;
        },
        getData() {
          return responseData;
        },
      };

      return res as unknown as Response & { getStatus(): number; getData(): unknown };
    };

    it("should strictly isolate brand_pillars by account_id", async () => {
      const { brandPillarsController } = await import("../controllers/brandPillarsController");

      ensureAccountExists("account_A");
      ensureAccountExists("account_B");

      // 1. Account A creates a pillar
      const createReq = createMockReq("account_A", {
        body: {
          title: "Sostenibilidad Financiera",
          description: "Enfoque en ahorro de largo plazo",
          tone: "Inspirador",
          color: "#10b981",
        },
      });
      const createRes = createMockRes();
      brandPillarsController.create(createReq, createRes);

      expect(createRes.getStatus()).toBe(201);
      const pillarA = createRes.getData().data;
      expect(pillarA.account_id).toBe("account_A");

      // 2. Account B lists pillars - should be completely empty
      const listReqB = createMockReq("account_B");
      const listResB = createMockRes();
      brandPillarsController.list(listReqB, listResB);

      expect(listResB.getStatus()).toBe(200);
      expect(listResB.getData().data).toHaveLength(0);

      // 3. Account B tries to fetch Account A's pillar by ID - must return 404 Not Found
      const getReqB = createMockReq("account_B", { params: { id: pillarA.id } });
      const getResB = createMockRes();
      brandPillarsController.getById(getReqB, getResB);

      expect(getResB.getStatus()).toBe(404);

      // 4. Account B tries to update Account A's pillar - must return 404
      const updateReqB = createMockReq("account_B", {
        params: { id: pillarA.id },
        body: { title: "Hacked Title" },
      });
      const updateResB = createMockRes();
      brandPillarsController.update(updateReqB, updateResB);

      expect(updateResB.getStatus()).toBe(404);

      // 5. Account B tries to delete Account A's pillar - must return 404
      const deleteReqB = createMockReq("account_B", { params: { id: pillarA.id } });
      const deleteResB = createMockRes();
      brandPillarsController.delete(deleteReqB, deleteResB);

      expect(deleteResB.getStatus()).toBe(404);

      // 6. Account A can read and update their own pillar
      const getReqA = createMockReq("account_A", { params: { id: pillarA.id } });
      const getResA = createMockRes();
      brandPillarsController.getById(getReqA, getResA);

      expect(getResA.getStatus()).toBe(200);
      expect(getResA.getData().data.title).toBe("Sostenibilidad Financiera");
    });

    it("should prevent cross-tenant referencing in ideas, drafts, and slides", async () => {
      const { brandPillarsController } = await import("../controllers/brandPillarsController");
      const { ideasController } = await import("../controllers/ideasController");
      const { draftsController } = await import("../controllers/draftsController");
      const { slidesController } = await import("../controllers/slidesController");

      ensureAccountExists("tenant_x");
      ensureAccountExists("tenant_y");

      // Tenant X creates pillar
      const pillarRes = createMockRes();
      brandPillarsController.create(
        createMockReq("tenant_x", { body: { title: "Tenant X Pillar" } }),
        pillarRes,
      );
      const pillarX = pillarRes.getData().data;

      // Tenant Y tries to create an idea referencing Tenant X's pillar -> 400
      const evilIdeaRes = createMockRes();
      ideasController.create(
        createMockReq("tenant_y", {
          body: {
            title: "Illicit Idea",
            brand_pillar_id: pillarX.id,
          },
        }),
        evilIdeaRes,
      );
      expect(evilIdeaRes.getStatus()).toBe(400);

      // Tenant X creates their idea
      const ideaXRes = createMockRes();
      ideasController.create(
        createMockReq("tenant_x", {
          body: {
            title: "Valid Idea for X",
            brand_pillar_id: pillarX.id,
          },
        }),
        ideaXRes,
      );
      expect(ideaXRes.getStatus()).toBe(201);
      const ideaX = ideaXRes.getData().data;

      // Tenant Y creates draft referencing Tenant X's idea -> 400
      const evilDraftRes = createMockRes();
      draftsController.create(
        createMockReq("tenant_y", {
          body: {
            title: "Illicit Draft",
            idea_id: ideaX.id,
          },
        }),
        evilDraftRes,
      );
      expect(evilDraftRes.getStatus()).toBe(400);

      // Tenant X creates their draft
      const draftXRes = createMockRes();
      draftsController.create(
        createMockReq("tenant_x", {
          body: {
            title: "Valid Draft for X",
            idea_id: ideaX.id,
          },
        }),
        draftXRes,
      );
      expect(draftXRes.getStatus()).toBe(201);
      const draftX = draftXRes.getData().data;

      // Tenant Y tries to create a slide referencing Tenant X's draft -> 400
      const evilSlideRes = createMockRes();
      slidesController.create(
        createMockReq("tenant_y", {
          body: {
            draft_id: draftX.id,
            headline: "Illicit Slide",
          },
        }),
        evilSlideRes,
      );
      expect(evilSlideRes.getStatus()).toBe(400);

      // Tenant X creates slide -> 201
      const slideXRes = createMockRes();
      slidesController.create(
        createMockReq("tenant_x", {
          body: {
            draft_id: draftX.id,
            headline: "Legit Slide 1",
            body: "Content for Tenant X",
            order_index: 1,
          },
        }),
        slideXRes,
      );
      expect(slideXRes.getStatus()).toBe(201);

      // Tenant Y query for slides -> empty
      const listSlidesYRes = createMockRes();
      slidesController.list(createMockReq("tenant_y"), listSlidesYRes);
      expect(listSlidesYRes.getStatus()).toBe(200);
      expect(listSlidesYRes.getData().data).toHaveLength(0);
    });
  });
});
