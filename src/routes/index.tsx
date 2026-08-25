import { createFileRoute } from "@tanstack/react-router";
import { PainelRecompra } from "@/components/recompra/PainelRecompra";

const titulo = "Painel de recompra de ração — fila por situação";
const descricao =
  "Data prevista de recompra recalculada a partir do consumo real de cada pet, com fila por urgência: atrasado, urgente e normal.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: titulo },
      { name: "description", content: descricao },
      { property: "og:title", content: titulo },
      { property: "og:description", content: descricao },
    ],
  }),
  component: PainelRecompra,
});
