import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Search, Info, ChevronDown, LayoutDashboard, ListFilter, PawPrint } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  calcularFila,
  previsaoPorMes,
  moeda,
  dataCurta,
  EXCLUSOES,
  type LinhaFila,
  type Situacao,
} from "@/lib/recompra-data";
import { RingStat } from "./RingStat";
import { EspecieIcone, FonteSelo, SITUACAO_META, StatusChip } from "./atoms";

const COLUNAS: Situacao[] = ["atrasado", "urgente", "normal"];

function progressoCiclo(l: LinhaFila) {
  const consumido = l.diasDuracao - l.diasRestantes;
  return Math.max(0, Math.min(100, (consumido / Math.max(1, l.diasDuracao)) * 100));
}

function rotuloDias(dias: number) {
  if (dias < 0) return `${Math.abs(dias)} d atrás`;
  if (dias === 0) return "hoje";
  return `em ${dias} d`;
}

export function PainelRecompra() {
  const fila = useMemo(() => calcularFila(), []);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<LinhaFila | null>(null);
  const [metodologiaAberta, setMetodologiaAberta] = useState(true);

  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return fila;
    return fila.filter(
      (l) =>
        l.tutor.nome.toLowerCase().includes(q) ||
        l.pets.some((p) => p.nome.toLowerCase().includes(q)) ||
        `${l.produto.marca} ${l.produto.linha} ${l.produto.variacao}`.toLowerCase().includes(q),
    );
  }, [fila, busca]);

  const pctTabela = (fila.filter((l) => l.fonte === "tabela").length / fila.length) * 100;
  const pctNoPrazo = (fila.filter((l) => l.situacao !== "atrasado").length / fila.length) * 100;
  const pctMultiPet = (fila.filter((l) => l.multiPet).length / fila.length) * 100;
  const serie = useMemo(() => previsaoPorMes(fila), [fila]);
  const totalPrevisto = fila.reduce((s, l) => s + l.valor, 0);

  return (
    <div className="flex min-h-screen bg-background grain">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 px-2 pb-6">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <PawPrint className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold">Recompra</p>
            <p className="text-[11px] text-sidebar-foreground/60">Ração · CRM</p>
          </div>
        </div>
        <nav className="space-y-1">
          {[
            { icon: LayoutDashboard, label: "Painel", ativo: true },
            { icon: ListFilter, label: "Fila por situação", ativo: true },
          ].map((item) => (
            <span
              key={item.label}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
                item.ativo
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
          ))}
        </nav>
        <div className="mt-auto rounded-lg bg-sidebar-accent/60 p-3 text-[11px] leading-snug text-sidebar-foreground/75">
          Datas recalculadas do zero a partir do consumo real de cada pet — o campo
          “recompra prevista” do CRM não é usado.
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
        {/* Cabeçalho */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Painel de recompra</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {fila.length} combinações cliente + pet + ração · {moeda(totalPrevisto)} previstos
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cliente, pet ou produto"
              className="pl-9"
            />
          </div>
        </header>

        {/* Metodologia */}
        <section className="panel mt-6 overflow-hidden">
          <button
            onClick={() => setMetodologiaAberta((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
          >
            <span className="flex items-center gap-2 font-display text-sm font-semibold">
              <Info className="h-4 w-4 text-primary" />
              Como o cálculo funciona
            </span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", metodologiaAberta && "rotate-180")}
            />
          </button>
          {metodologiaAberta && (
            <div className="grid gap-6 border-t border-border px-5 py-5 text-sm leading-relaxed md:grid-cols-2">
              <ol className="space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">1.</strong> Pega o peso do pacote da ração
                  comprada no catálogo de produtos.
                </li>
                <li>
                  <strong className="text-foreground">2.</strong> Identifica os pets daquele tutor
                  que consomem aquela ração; se mais de um pet da mesma espécie divide o pacote, o
                  consumo diário é somado.
                </li>
                <li>
                  <strong className="text-foreground">3.</strong> O consumo diário vem da tabela
                  real impressa na embalagem (Fórmula Natural / Adimax — Fresh Meat, Life, Pró, nas
                  variações Adulto / Sênior / Sensitive / Filhote e por porte). Para filhotes a
                  faixa mín–máx considera também a idade, não só o peso.
                </li>
                <li>
                  <strong className="text-foreground">4.</strong> Sem tabela confirmada (hoje Golden
                  e Premier), cai para estimativa por percentual do peso corporal — e a linha é
                  marcada como <FonteSelo fonte="estimativa" compact />.
                </li>
                <li>
                  <strong className="text-foreground">5.</strong> Dias de duração = peso do pacote ÷
                  consumo diário total. Recompra prevista = data da compra + dias de duração.
                </li>
              </ol>
              <div>
                <p className="font-display text-sm font-semibold">
                  Pedidos fora do cálculo ({EXCLUSOES.length})
                </p>
                <ul className="mt-2 space-y-2">
                  {EXCLUSOES.map((e) => (
                    <li key={e.pedidoId} className="rounded-lg bg-muted px-3 py-2 text-xs">
                      <span className="font-semibold">{e.pedidoId}</span> · {e.cliente}
                      <p className="mt-0.5 text-muted-foreground">{e.motivo}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-lg border border-urgent/30 bg-urgent-soft px-3 py-2 text-xs text-urgent">
                  <strong>Pendente:</strong> calibrar com o histórico real de recompra. Quando o
                  mesmo cliente já comprou a mesma ração 2+ vezes, comparar o intervalo real com o
                  calculado: se for próximo, usar o real; se for muito maior, manter a tabela
                  (diferença grande normalmente indica compra em concorrente).
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Indicadores */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <RingStat
            percent={pctTabela}
            tone="primary"
            label="Vendas com tabela real"
            sublabel="Cálculo feito com a tabela de consumo do fabricante, não com estimativa."
          />
          <RingStat
            percent={pctNoPrazo}
            tone="chart-4"
            label="Fila dentro do prazo"
            sublabel="Linhas que ainda não passaram da data prevista de recompra."
          />
          <RingStat
            percent={pctMultiPet}
            tone="urgent"
            label="Vendas com mais de um pet"
            sublabel="Pacotes divididos entre dois ou mais pets do mesmo tutor."
          />
        </section>

        {/* Gráfico */}
        <section className="panel mt-6 p-5">
          <h2 className="font-display text-sm font-semibold">Valor previsto de recompra por mês</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis
                  tickFormatter={(v) => moeda(Number(v))}
                  tickLine={false}
                  axisLine={false}
                  width={78}
                  fontSize={12}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  formatter={(v) => [moeda(Number(v)), "Previsto"]}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#areaFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Kanban */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {COLUNAS.map((col) => {
            const itens = filtrada.filter((l) => l.situacao === col);
            const meta = SITUACAO_META[col];
            return (
              <div key={col} className="panel flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                      <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                      {meta.titulo}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{meta.desc}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                    {itens.length}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {itens.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setAberto(l)}
                      className="w-full rounded-lg border border-border bg-background p-3 text-left transition-shadow hover:shadow-lift"
                    >
                      <div className="flex items-center gap-2">
                        <EspecieIcone especie={l.pets[0]!.especie} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {l.pets.map((p) => p.nome).join(" + ")}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{l.tutor.nome}</p>
                        </div>
                        <FonteSelo fonte={l.fonte} compact />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {dataCurta(l.dataRecompra)} · {rotuloDias(l.diasRestantes)}
                        </span>
                        <span className="font-semibold">{moeda(l.valor)}</span>
                      </div>
                    </button>
                  ))}
                  {itens.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      Nenhuma recompra aqui
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Tabela */}
        <section className="panel mt-6 overflow-hidden">
          <h2 className="border-b border-border px-5 py-4 font-display text-sm font-semibold">
            Fila detalhada
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Pet / Tutor</th>
                  <th className="px-5 py-3 font-medium">Produto</th>
                  <th className="px-5 py-3 font-medium">Prevista</th>
                  <th className="px-5 py-3 font-medium">Urgência</th>
                  <th className="px-5 py-3 font-medium">Situação</th>
                  <th className="px-5 py-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtrada.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setAberto(l)}
                    className="cursor-pointer border-b border-border/70 transition-colors last:border-0 hover:bg-muted/60"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <EspecieIcone especie={l.pets[0]!.especie} />
                        <div>
                          <p className="font-medium">{l.pets.map((p) => p.nome).join(" + ")}</p>
                          <p className="text-xs text-muted-foreground">{l.tutor.nome}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium">
                        {l.produto.marca} {l.produto.linha} · {l.produto.pesoPacoteKg} kg
                      </p>
                      <div className="mt-1">
                        <FonteSelo fonte={l.fonte} compact />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{dataCurta(l.dataRecompra)}</p>
                      <p className="text-xs text-muted-foreground">{rotuloDias(l.diasRestantes)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", SITUACAO_META[l.situacao].bar)}
                          style={{ width: `${progressoCiclo(l)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusChip situacao={l.situacao} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">{moeda(l.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtrada.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              Nada encontrado para “{busca}”.
            </p>
          )}
        </section>
      </main>

      {/* Modal de detalhe */}
      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-w-lg">
          {aberto && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {aberto.pets.map((p) => p.nome).join(" + ")} · {aberto.tutor.nome}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip situacao={aberto.situacao} />
                  <FonteSelo fonte={aberto.fonte} />
                  {aberto.multiPet && (
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                      pacote dividido entre {aberto.pets.length} pets
                    </span>
                  )}
                </div>

                <dl className="grid grid-cols-2 gap-3">
                  {[
                    ["Pedido", aberto.id],
                    ["Produto", `${aberto.produto.marca} ${aberto.produto.linha} — ${aberto.produto.variacao}`],
                    ["Pacote", `${aberto.produto.pesoPacoteKg} kg`],
                    ["Data da compra", dataCurta(aberto.dataCompra)],
                    ["Consumo diário total", `${aberto.consumoDiarioG} g/dia (faixa ${aberto.consumoMinG}–${aberto.consumoMaxG} g)`],
                    ["Duração do pacote", `${aberto.diasDuracao} dias`],
                    ["Recompra prevista", `${dataCurta(aberto.dataRecompra)} (${rotuloDias(aberto.diasRestantes)})`],
                    ["Valor", moeda(aberto.valor)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-muted px-3 py-2">
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
                      <dd className="mt-0.5 font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div>
                  <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pets considerados
                  </p>
                  <ul className="mt-2 space-y-1">
                    {aberto.pets.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                        <EspecieIcone especie={p.especie} />
                        <span className="font-medium">{p.nome}</span>
                        <span className="text-muted-foreground">
                          {p.pesoKg} kg · porte {p.porte} · {p.fase}
                          {p.fase === "filhote" && p.idadeMeses ? ` (${p.idadeMeses} meses)` : ""} ·
                          cadastro {p.origemCadastro === "whatsapp" ? "WhatsApp" : "manual"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground">
                  Fonte do cálculo:{" "}
                  {aberto.fonte === "tabela"
                    ? "tabela real de consumo impressa na embalagem do fabricante."
                    : "estimativa por percentual do peso corporal — marca ainda sem tabela confirmada."}{" "}
                  {aberto.produto.pesoPacoteKg} kg ÷ {aberto.consumoDiarioG} g/dia ={" "}
                  {aberto.diasDuracao} dias.
                </p>

                <div className="border-t border-border pt-4">
                  <WhatsAppCliente linha={aberto} />
                </div>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
