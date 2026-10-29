import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Route } from "./mas";

// Mock router Link
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({
      children,
      to,
      className,
    }: {
      children: ReactNode;
      to: string;
      className?: string;
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

// Partial mock for supabase queries
vi.mock("@/lib/supabase/queries", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useProgressQuery: () => ({ data: { xp: 150, streakDays: 3 } }),
    useProfileQuery: () => ({
      data: { full_name: "Test User", email: "test@example.com", display_name: "Test" },
    }),
    useFamilyQuery: () => ({ data: null }),
    usePendingInvitationsQuery: () => ({ data: [] }),
    useTransactionsQuery: () => ({ data: [] }),
    useLessonsQuery: () => ({ data: [] }),
    useCategoriesQuery: () => ({ data: [] }),
    useGoalsQuery: () => ({ data: [] }),
    useBudgetsQuery: () => ({ data: [] }),
  };
});

vi.mock("@/lib/supabase/mutations", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLeaveFamilyMutation: () => ({ mutateAsync: vi.fn() }),
    useCompleteLessonMutation: () => ({ mutateAsync: vi.fn() }),
    useDeleteGoalMutation: () => ({ mutateAsync: vi.fn() }),
  };
});

vi.mock("@/lib/supabase/auth", () => ({
  signOut: vi.fn(),
  deleteAccount: vi.fn(),
  useSession: () => ({ session: { user: { id: "test-user-id" } } }),
}));

describe("Route /mas", () => {
  it("defines the route and its metadata correctly", () => {
    expect(Route).toBeDefined();
    const headFn = Route.options.head;
    expect(headFn).toBeDefined();
    if (headFn) {
      // Execute head with mock match context
      const result = (headFn as () => { meta?: Array<{ title?: string }> })();
      const titleMeta = result.meta?.find((m) => "title" in m);
      expect(titleMeta?.title).toContain("Más — UALI Finanzas");
    }
  });

  it("renders Mas component without runtime errors (verifying cn and all UI controls)", () => {
    const Component = Route.options.component as React.ComponentType;
    expect(Component).toBeDefined();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>,
    );

    // Check device layout selector buttons where cn was previously failing
    expect(screen.getByText("Auto")).toBeInTheDocument();
    expect(screen.getByText("Móvil")).toBeInTheDocument();
    expect(screen.getByText("Tablet")).toBeInTheDocument();
    expect(screen.getByText("PC")).toBeInTheDocument();

    // Check other settings items
    expect(screen.getByText("Modo oscuro")).toBeInTheDocument();
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });
});
