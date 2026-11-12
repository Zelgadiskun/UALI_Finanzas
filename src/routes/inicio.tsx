import { createFileRoute } from "@tanstack/react-router";
import { Inicio } from "./index";

const title = "Ualí Finanzas — Panel Principal";
const description =
  "Panel financiero gamificado con conservación de flujo de caja, comparativa mensual, metas de ahorro con Nido y misiones de aprendizaje.";

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Inicio,
});
