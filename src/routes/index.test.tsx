import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Inicio } from "./index";

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

vi.mock("@/lib/supabase/queries", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useProgressQuery: () => ({
      isPending: false,
      data: { xp: 350, streakDays: 5, lessonsDone: [] },
    }),
    useProfileQuery: () => ({
      data: {
        id: "test-user-id",
        full_name: "Usuario Ualí",
        email: "test@example.com",
        display_name: "Explorador Ualí",
      },
    }),
    useFamilyQuery: () => ({ data: null }),
    useFamilyMembersQuery: () => ({ data: [] }),
    useTransactionsQuery: () => ({ isPending: false, data: [] }),
    useLessonsQuery: () => ({ data: [] }),
    useNotificationsQuery: () => ({ data: [] }),
    useMemberDisplayNameMap: () => ({}),
    useDebtsQuery: () => ({ data: [] }),
    useBudgetsQuery: () => ({ data: [] }),
    useCurrentUserId: () => "test-user-id",
  };
});

vi.mock("@/lib/supabase/mutations", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
  };
});

describe("Route / (Inicio)", () => {
  it("renders Inicio component without runtime errors or missing variables", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Inicio />
      </QueryClientProvider>,
    );

    // Verify user greeting and level rendered correctly
    expect(screen.getByText(/¡Hola, Explorador Ualí!/i)).toBeInTheDocument();
    expect(screen.getByText(/Nivel 2/i)).toBeInTheDocument();
  });
});
