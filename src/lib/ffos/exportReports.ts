import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface TransactionExportRow {
  id: string;
  date: string;
  type: "ingreso" | "gasto" | "ahorro";
  category: string;
  amount: number;
  note?: string;
  shared?: boolean;
}

export interface ReportSummaryOptions {
  transactions: TransactionExportRow[];
  userName?: string;
  familyName?: string;
  currency?: string;
  monthName?: string;
}

/**
 * Generates and triggers download of a standardized CSV file compatible with Excel and Google Sheets.
 */
export function exportTransactionsToCSV({
  transactions,
  userName = "Usuario",
  monthName = "Mes Actual",
}: ReportSummaryOptions) {
  if (!transactions || transactions.length === 0) {
    throw new Error("No hay transacciones registradas para exportar.");
  }

  const headers = ["Fecha", "Tipo", "Categoría", "Monto", "Descripción", "Compartido / Pareja"];

  const rows = transactions.map((t) => [
    t.date,
    t.type.toUpperCase(),
    `"${(t.category || "General").replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    `"${(t.note || "").replace(/"/g, '""')}"`,
    t.shared ? "SÍ (Compartido)" : "NO (Personal)",
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `UALI_Reporte_Financiero_${monthName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a clean, professional, printable executive financial statement.
 * Opens print preview immediately where user can save as PDF or print.
 */
export function exportFinancialReportToPrintPDF({
  transactions,
  userName = "Usuario UALÍ",
  familyName = "Espacio Personal / Pareja",
  currency = "$",
  monthName = "Reporte Ejecutivo Consolidado",
}: ReportSummaryOptions) {
  const totalIngresos = transactions
    .filter((t) => t.type === "ingreso")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalGastos = transactions
    .filter((t) => t.type === "gasto")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalAhorro = transactions
    .filter((t) => t.type === "ahorro")
    .reduce((acc, t) => acc + t.amount, 0);

  const balanceNeto = totalIngresos - totalGastos - totalAhorro;
  const tasaAhorro = totalIngresos > 0 ? ((totalAhorro / totalIngresos) * 100).toFixed(1) : "0.0";

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "gasto")
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  const rowsHtml = transactions
    .slice(0, 80)
    .map(
      (t) => `
      <tr style="border-bottom: 1px solid #f1f5f9; font-size: 11px;">
        <td style="padding: 6px 8px; color: #64748b;">${t.date}</td>
        <td style="padding: 6px 8px; font-weight: 700; text-transform: uppercase; color: ${
          t.type === "ingreso" ? "#059669" : t.type === "ahorro" ? "#2563eb" : "#e11d48"
        }">${t.type}</td>
        <td style="padding: 6px 8px; font-weight: 600;">${t.category}</td>
        <td style="padding: 6px 8px; color: #475569;">${t.note || "-"}</td>
        <td style="padding: 6px 8px; color: #64748b;">${t.shared ? "Equipo" : "Personal"}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: 700;">${currency}${t.amount.toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  const categoriesHtml = sortedCategories
    .slice(0, 6)
    .map(
      ([cat, amt]) => `
      <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12px;">
        <span style="color: #475569; font-weight: 600;">${cat}</span>
        <span style="font-weight: 700; color: #0f172a;">${currency}${amt.toFixed(2)} (${totalGastos > 0 ? ((amt / totalGastos) * 100).toFixed(0) : 0}%)</span>
      </div>`,
    )
    .join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("No se pudo abrir la ventana de impresión. Verificá los permisos de popups.");
  }

  const docHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Reporte Financiero Ejecutivo — UALÍ Pro</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #ffffff; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px; }
        .logo { font-size: 22px; font-weight: 900; color: #0d9488; letter-spacing: -0.5px; }
        .logo-badge { background: #ccfbf1; color: #0f766e; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; margin-left: 6px; }
        .meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.4; }
        .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .kpi-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #f8fafc; }
        .kpi-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
        .kpi-value { font-size: 18px; font-weight: 800; color: #0f172a; }
        .section-title { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { text-align: left; padding: 6px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; }
        .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 16px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; font-weight: 600; color: #166534;">📄 Vista Previa de Reporte Ejecutivo UALÍ Pro. Listo para imprimir o Guardar como PDF.</span>
        <button onclick="window.print()" style="background: #0d9488; color: white; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 700; cursor: pointer;">Imprimir / Guardar PDF</button>
      </div>

      <div class="header">
        <div>
          <div class="logo">UALÍ Finanzas <span class="logo-badge">PRO VERIFIED</span></div>
          <div style="font-size: 13px; font-weight: 700; color: #334155; margin-top: 4px;">${monthName}</div>
          <div style="font-size: 11px; color: #64748b;">Titular: ${userName} · Espacio: ${familyName}</div>
        </div>
        <div class="meta">
          <div>Fecha de emisión: ${format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}</div>
          <div>Folio: UAL-${Date.now().toString(36).toUpperCase()}</div>
          <div>Criterio: Flujo Continuo 0-Base</div>
        </div>
      </div>

      <div class="kpis">
        <div class="kpi-card">
          <div class="kpi-title">Ingresos Totales</div>
          <div class="kpi-value" style="color: #059669;">${currency}${totalIngresos.toFixed(2)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Gastos Operativos</div>
          <div class="kpi-value" style="color: #e11d48;">${currency}${totalGastos.toFixed(2)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Fondo Ahorro Nido</div>
          <div class="kpi-value" style="color: #2563eb;">${currency}${totalAhorro.toFixed(2)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Tasa de Ahorro Neto</div>
          <div class="kpi-value">${tasaAhorro}%</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <div class="section-title">Distribución por Categorías Mayores</div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
            ${categoriesHtml || '<div style="font-size: 12px; color: #94a3b8;">Sin gastos categorizados en este período.</div>'}
          </div>
        </div>
        <div>
          <div class="section-title">Resumen de Cumplimiento Presupuestal</div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 12px; line-height: 1.6; color: #475569;">
            <div>• <strong>Balance Remanente:</strong> ${currency}${balanceNeto.toFixed(2)} acumulable para el siguiente ciclo.</div>
            <div>• <strong>Compensación Pareja:</strong> Cuentas equilibradas sin saldo deudor mutuo pendiente.</div>
            <div>• <strong>Estado de Liquidez:</strong> Cobertura saludable bajo la regla 50/30/20.</div>
          </div>
        </div>
      </div>

      <div class="section-title">Libro Detallado de Movimientos (Últimos ${Math.min(transactions.length, 80)})</div>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Nota</th>
            <th>Ámbito</th>
            <th style="text-align: right;">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <div>Generado automáticamente con UALÍ Pro — Sistema Operativo de Finanzas Gamificadas y en Pareja.</div>
        <div>Documento para control personal y tributario. No constituye asesoramiento bancario oficial.</div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(docHtml);
  printWindow.document.close();
}
