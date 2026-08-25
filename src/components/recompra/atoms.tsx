import type { Especie, FonteCalculo, Situacao } from "@/lib/recompra-data";
import { cn } from "@/lib/utils";

export const SITUACAO_META: Record<
  Situacao,
  { titulo: string; desc: string; dot: string; chip: string; bar: string }
> = {
  atrasado: {
    titulo: "Atrasado",
    desc: "Data prevista já passou",
    dot: "bg-late",
    chip: "bg-late-soft text-late",
    bar: "bg-late",
  },
  urgente: {
    titulo: "Urgente",
    desc: "0 a 3 dias restantes",
    dot: "bg-urgent",
    chip: "bg-urgent-soft text-urgent",
    bar: "bg-urgent",
  },
  normal: {
    titulo: "Normal",
    desc: "Mais de 3 dias restantes",
    dot: "bg-ok",
    chip: "bg-ok-soft text-ok",
    bar: "bg-ok",
  },
};

export function StatusChip({ situacao }: { situacao: Situacao }) {
  const m = SITUACAO_META[situacao];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        m.chip,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.titulo}
    </span>
  );
}

export function FonteSelo({ fonte, compact }: { fonte: FonteCalculo; compact?: boolean }) {
  const real = fonte === "tabela";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        real
          ? "border-ok/30 bg-ok-soft text-ok"
          : "border-urgent/30 bg-urgent-soft text-urgent",
      )}
      title={
        real
          ? "Consumo diário vindo da tabela real impressa na embalagem do fabricante"
          : "Sem tabela confirmada para esta marca: consumo estimado por percentual do peso corporal"
      }
    >
      <span aria-hidden>{real ? "●" : "○"}</span>
      {compact ? (real ? "tabela" : "estimativa") : real ? "tabela do fabricante" : "estimativa por peso"}
    </span>
  );
}

export function EspecieIcone({ especie }: { especie: Especie }) {
  return (
    <span
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-sm"
      title={especie === "cao" ? "Cão" : "Gato"}
      aria-label={especie === "cao" ? "Cão" : "Gato"}
    >
      {especie === "cao" ? "🐶" : "🐱"}
    </span>
  );
}
