import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionRow } from "./TransactionRow";
import type { Transaction } from "@/lib/ffos/types";

function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: "tx-1",
    userId: "user-1",
    type: "gasto",
    category: "Comida",
    amount: 1000,
    date: "2026-09-01",
    shared: false,
    ...overrides,
  };
}

describe("TransactionRow", () => {
  it("shows an ingreso as a positive amount", () => {
    render(<TransactionRow tx={makeTx({ type: "ingreso", category: "Sueldo" })} />);
    expect(screen.getByText("+$1.000,00")).toBeInTheDocument();
  });

  it("shows a gasto as a negative amount", () => {
    render(<TransactionRow tx={makeTx({ type: "gasto" })} />);
    expect(screen.getByText("−$1.000,00")).toBeInTheDocument();
  });

  // ahorro moves money out of what's spendable even though it isn't a loss —
  // same sign as a gasto for that reason, distinct icon/color to say why.
  it("shows an ahorro as a negative amount, same as an outflow", () => {
    render(<TransactionRow tx={makeTx({ type: "ahorro", category: "Fondo de emergencia" })} />);
    expect(screen.getByText("−$1.000,00")).toBeInTheDocument();
  });

  it("falls back to 'Sin nota' when there's no note and the date is hidden", () => {
    render(<TransactionRow tx={makeTx({ note: undefined })} showDate={false} />);
    expect(screen.getByText("Sin nota")).toBeInTheDocument();
  });

  it("shows the owner label only when provided (shared family transaction)", () => {
    const { rerender } = render(<TransactionRow tx={makeTx({})} />);
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();

    rerender(<TransactionRow tx={makeTx({})} ownerLabel="Ana" />);
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  it("calls onOptions with the transaction when the options button is clicked", () => {
    const onOptions = vi.fn();
    const tx = makeTx({});
    render(<TransactionRow tx={tx} onOptions={onOptions} />);

    fireEvent.click(screen.getByRole("button", { name: `Opciones de ${tx.category}` }));
    expect(onOptions).toHaveBeenCalledWith(tx);
  });

  it("renders no options button when onOptions isn't passed", () => {
    render(<TransactionRow tx={makeTx({})} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
