/**
 * Motor de cálculo da recompra prevista.
 *
 * Regra: NÃO usamos o campo "recompra prevista" do CRM. Recalculamos a data
 * do zero a partir do consumo real de cada pet:
 *
 *   consumoDiarioTotal = soma do consumo diário de todos os pets do tutor
 *                        que dividem aquele pacote
 *   diasDuracao        = pesoPacoteKg * 1000 / consumoDiarioTotal(g/dia)
 *   dataRecompra       = dataCompra + diasDuracao
 *
 * A fonte do consumo diário pode ser:
 *   - "tabela"     -> tabela real impressa na embalagem do fabricante
 *   - "estimativa" -> percentual do peso corporal (fallback p/ marcas sem tabela)
 */

export type Especie = "cao" | "gato";
export type Porte = "mini" | "pequeno" | "medio" | "grande";
export type FaseVida = "filhote" | "adulto" | "senior";
export type FonteCalculo = "tabela" | "estimativa";
export type Situacao = "atrasado" | "urgente" | "normal";

export type Pet = {
  id: string;
  nome: string;
  especie: Especie;
  pesoKg: number;
  porte: Porte;
  fase: FaseVida;
  idadeMeses?: number;
  produtoId: string;
  origemCadastro: "whatsapp" | "manual";
};

export type Tutor = {
  id: string;
  nome: string;
  pets: Pet[];
};

export type Produto = {
  id: string;
  marca: string;
  linha: string;
  variacao: string;
  pesoPacoteKg: number;
  preco: number;
  /** Marcas sem tabela real confirmada caem na estimativa por peso corporal. */
  temTabelaReal: boolean;
};

export type Pedido = {
  id: string;
  tutorId: string;
  produtoId: string;
  dataCompra: string; // ISO
  quantidade: number;
};

export type LinhaFila = {
  id: string;
  tutor: Tutor;
  pets: Pet[];
  produto: Produto;
  dataCompra: Date;
  dataRecompra: Date;
  diasRestantes: number;
  diasDuracao: number;
  consumoDiarioG: number;
  consumoMinG: number;
  consumoMaxG: number;
  fonte: FonteCalculo;
  situacao: Situacao;
  valor: number;
  multiPet: boolean;
};

export type Exclusao = { pedidoId: string; cliente: string; motivo: string };

/* ---------------------------------------------------------------- catálogo */

export const PRODUTOS: Produto[] = [
  { id: "fn-fresh-adulto-15", marca: "Fórmula Natural", linha: "Fresh Meat", variacao: "Cães Adultos Médio/Grande", pesoPacoteKg: 15, preco: 389.9, temTabelaReal: true },
  { id: "fn-fresh-mini-7", marca: "Fórmula Natural", linha: "Fresh Meat", variacao: "Cães Adultos Mini/Pequeno", pesoPacoteKg: 7, preco: 219.9, temTabelaReal: true },
  { id: "fn-life-senior-10", marca: "Fórmula Natural", linha: "Life", variacao: "Cães Sênior", pesoPacoteKg: 10.1, preco: 249.9, temTabelaReal: true },
  { id: "fn-pro-filhote-15", marca: "Fórmula Natural", linha: "Pró", variacao: "Cães Filhotes", pesoPacoteKg: 15, preco: 298.5, temTabelaReal: true },
  { id: "fn-sensitive-gato-3", marca: "Fórmula Natural", linha: "Fresh Meat Sensitive", variacao: "Gatos Adultos", pesoPacoteKg: 3, preco: 149.9, temTabelaReal: true },
  { id: "fn-fresh-gato-7", marca: "Fórmula Natural", linha: "Fresh Meat", variacao: "Gatos Adultos Castrados", pesoPacoteKg: 7, preco: 279.9, temTabelaReal: true },
  { id: "golden-adulto-15", marca: "Golden", linha: "Special", variacao: "Cães Adultos Frango", pesoPacoteKg: 15, preco: 209.9, temTabelaReal: false },
  { id: "premier-gato-7", marca: "Premier", linha: "Nattu", variacao: "Gatos Adultos", pesoPacoteKg: 7, preco: 289.9, temTabelaReal: false },
];

/* ------------------------------------------- tabelas reais do fabricante */
/** g/dia mín–máx por faixa de peso corporal (kg), conforme embalagem. */
type FaixaTabela = { pesoMax: number; min: number; max: number };

const TABELA_CAO_ADULTO: FaixaTabela[] = [
  { pesoMax: 5, min: 55, max: 100 },
  { pesoMax: 10, min: 100, max: 165 },
  { pesoMax: 20, min: 165, max: 280 },
  { pesoMax: 30, min: 280, max: 380 },
  { pesoMax: 45, min: 380, max: 500 },
  { pesoMax: 100, min: 500, max: 640 },
];

const TABELA_CAO_SENIOR: FaixaTabela[] = [
  { pesoMax: 5, min: 50, max: 90 },
  { pesoMax: 10, min: 90, max: 150 },
  { pesoMax: 20, min: 150, max: 255 },
  { pesoMax: 30, min: 255, max: 345 },
  { pesoMax: 100, min: 345, max: 470 },
];

/** Filhotes: o consumo varia por idade além do peso. */
const TABELA_CAO_FILHOTE: Record<string, FaixaTabela[]> = {
  "2-4": [
    { pesoMax: 5, min: 110, max: 180 },
    { pesoMax: 10, min: 180, max: 300 },
    { pesoMax: 25, min: 300, max: 480 },
    { pesoMax: 100, min: 480, max: 700 },
  ],
  "4-9": [
    { pesoMax: 5, min: 95, max: 155 },
    { pesoMax: 10, min: 155, max: 260 },
    { pesoMax: 25, min: 260, max: 420 },
    { pesoMax: 100, min: 420, max: 610 },
  ],
  "9-12": [
    { pesoMax: 5, min: 80, max: 130 },
    { pesoMax: 10, min: 130, max: 215 },
    { pesoMax: 25, min: 215, max: 350 },
    { pesoMax: 100, min: 350, max: 520 },
  ],
};

const TABELA_GATO_ADULTO: FaixaTabela[] = [
  { pesoMax: 3, min: 35, max: 45 },
  { pesoMax: 5, min: 45, max: 65 },
  { pesoMax: 7, min: 65, max: 80 },
  { pesoMax: 100, min: 80, max: 95 },
];

function buscaFaixa(tabela: FaixaTabela[], pesoKg: number): FaixaTabela {
  return (
    tabela.find((f) => pesoKg <= f.pesoMax) ??
    tabela[tabela.length - 1] ?? { pesoMax: 100, min: 0, max: 0 }
  );
}

function faixaIdade(meses: number) {
  if (meses <= 4) return "2-4";
  if (meses <= 9) return "4-9";
  return "9-12";
}

/** Consumo diário (g) de um pet. Retorna também a fonte do número. */
export function consumoDiario(pet: Pet, produto: Produto) {
  if (!produto.temTabelaReal) {
    // Fallback: percentual do peso corporal (2,5% cão adulto, 2% gato, 4% filhote).
    const pct = pet.fase === "filhote" ? 0.04 : pet.especie === "gato" ? 0.02 : 0.025;
    const base = pet.pesoKg * 1000 * pct;
    return { min: base * 0.85, max: base * 1.15, medio: base, fonte: "estimativa" as FonteCalculo };
  }

  let faixa: FaixaTabela;
  if (pet.especie === "gato") {
    faixa = buscaFaixa(TABELA_GATO_ADULTO, pet.pesoKg);
  } else if (pet.fase === "filhote") {
    faixa = buscaFaixa(TABELA_CAO_FILHOTE[faixaIdade(pet.idadeMeses ?? 6)], pet.pesoKg);
  } else if (pet.fase === "senior") {
    faixa = buscaFaixa(TABELA_CAO_SENIOR, pet.pesoKg);
  } else {
    faixa = buscaFaixa(TABELA_CAO_ADULTO, pet.pesoKg);
  }
  return { min: faixa.min, max: faixa.max, medio: (faixa.min + faixa.max) / 2, fonte: "tabela" as FonteCalculo };
}

/* ---------------------------------------------------------------- cadastro */

export const TUTORES: Tutor[] = [
  {
    id: "t1", nome: "Mariana Prado",
    pets: [
      { id: "p1", nome: "Thor", especie: "cao", pesoKg: 28, porte: "grande", fase: "adulto", produtoId: "fn-fresh-adulto-15", origemCadastro: "whatsapp" },
      { id: "p2", nome: "Luna", especie: "cao", pesoKg: 22, porte: "medio", fase: "adulto", produtoId: "fn-fresh-adulto-15", origemCadastro: "whatsapp" },
    ],
  },
  { id: "t2", nome: "Ricardo Nunes", pets: [{ id: "p3", nome: "Mel", especie: "cao", pesoKg: 6.4, porte: "pequeno", fase: "adulto", produtoId: "fn-fresh-mini-7", origemCadastro: "whatsapp" }] },
  { id: "t3", nome: "Camila Ferraz", pets: [{ id: "p4", nome: "Bidu", especie: "cao", pesoKg: 14, porte: "medio", fase: "senior", produtoId: "fn-life-senior-10", origemCadastro: "manual" }] },
  {
    id: "t4", nome: "Eduardo Lima",
    pets: [
      { id: "p5", nome: "Simba", especie: "gato", pesoKg: 5.2, porte: "medio", fase: "adulto", produtoId: "fn-fresh-gato-7", origemCadastro: "whatsapp" },
      { id: "p6", nome: "Nala", especie: "gato", pesoKg: 4.1, porte: "pequeno", fase: "adulto", produtoId: "fn-fresh-gato-7", origemCadastro: "whatsapp" },
      { id: "p7", nome: "Pipoca", especie: "gato", pesoKg: 3.4, porte: "pequeno", fase: "adulto", produtoId: "fn-fresh-gato-7", origemCadastro: "manual" },
    ],
  },
  { id: "t5", nome: "Juliana Castro", pets: [{ id: "p8", nome: "Frida", especie: "cao", pesoKg: 9.5, porte: "pequeno", fase: "filhote", idadeMeses: 5, produtoId: "fn-pro-filhote-15", origemCadastro: "whatsapp" }] },
  { id: "t6", nome: "Paulo Rezende", pets: [{ id: "p9", nome: "Zeus", especie: "cao", pesoKg: 38, porte: "grande", fase: "adulto", produtoId: "golden-adulto-15", origemCadastro: "manual" }] },
  { id: "t7", nome: "Beatriz Amorim", pets: [{ id: "p10", nome: "Amora", especie: "gato", pesoKg: 4.6, porte: "pequeno", fase: "adulto", produtoId: "premier-gato-7", origemCadastro: "whatsapp" }] },
  { id: "t8", nome: "Fernanda Vidal", pets: [{ id: "p11", nome: "Tobias", especie: "cao", pesoKg: 4.2, porte: "mini", fase: "adulto", produtoId: "fn-fresh-mini-7", origemCadastro: "whatsapp" }] },
  { id: "t9", nome: "Otávio Bastos", pets: [{ id: "p12", nome: "Rex", especie: "cao", pesoKg: 31, porte: "grande", fase: "senior", produtoId: "fn-life-senior-10", origemCadastro: "whatsapp" }] },
  { id: "t10", nome: "Larissa Duarte", pets: [{ id: "p13", nome: "Kiara", especie: "gato", pesoKg: 3.1, porte: "pequeno", fase: "adulto", produtoId: "fn-sensitive-gato-3", origemCadastro: "manual" }] },
  {
    id: "t11", nome: "Gustavo Peixoto",
    pets: [
      { id: "p14", nome: "Bento", especie: "cao", pesoKg: 12, porte: "medio", fase: "adulto", produtoId: "fn-fresh-adulto-15", origemCadastro: "whatsapp" },
      { id: "p15", nome: "Pretinha", especie: "cao", pesoKg: 8, porte: "pequeno", fase: "adulto", produtoId: "fn-fresh-adulto-15", origemCadastro: "manual" },
    ],
  },
  { id: "t12", nome: "Aline Moretti", pets: [{ id: "p16", nome: "Nina", especie: "cao", pesoKg: 18, porte: "medio", fase: "filhote", idadeMeses: 10, produtoId: "fn-pro-filhote-15", origemCadastro: "whatsapp" }] },
  { id: "t13", nome: "Marcelo Antunes", pets: [{ id: "p17", nome: "Duque", especie: "cao", pesoKg: 25, porte: "grande", fase: "adulto", produtoId: "golden-adulto-15", origemCadastro: "whatsapp" }] },
  { id: "t14", nome: "Priscila Rocha", pets: [{ id: "p18", nome: "Malu", especie: "gato", pesoKg: 6.2, porte: "medio", fase: "adulto", produtoId: "fn-fresh-gato-7", origemCadastro: "whatsapp" }] },
];

/** dias atrás em relação a "hoje" (mantém a fila estável entre renders). */
const HOJE = new Date();
HOJE.setHours(12, 0, 0, 0);

function diasAtras(d: number) {
  const dt = new Date(HOJE);
  dt.setDate(dt.getDate() - d);
  return dt.toISOString();
}

export const PEDIDOS: Pedido[] = [
  { id: "PD-4821", tutorId: "t1", produtoId: "fn-fresh-adulto-15", dataCompra: diasAtras(38), quantidade: 1 },
  { id: "PD-4835", tutorId: "t2", produtoId: "fn-fresh-mini-7", dataCompra: diasAtras(52), quantidade: 1 },
  { id: "PD-4840", tutorId: "t3", produtoId: "fn-life-senior-10", dataCompra: diasAtras(41), quantidade: 1 },
  { id: "PD-4852", tutorId: "t4", produtoId: "fn-fresh-gato-7", dataCompra: diasAtras(24), quantidade: 1 },
  { id: "PD-4860", tutorId: "t5", produtoId: "fn-pro-filhote-15", dataCompra: diasAtras(26), quantidade: 1 },
  { id: "PD-4871", tutorId: "t6", produtoId: "golden-adulto-15", dataCompra: diasAtras(19), quantidade: 1 },
  { id: "PD-4880", tutorId: "t7", produtoId: "premier-gato-7", dataCompra: diasAtras(44), quantidade: 1 },
  { id: "PD-4884", tutorId: "t8", produtoId: "fn-fresh-mini-7", dataCompra: diasAtras(30), quantidade: 1 },
  { id: "PD-4890", tutorId: "t9", produtoId: "fn-life-senior-10", dataCompra: diasAtras(33), quantidade: 1 },
  { id: "PD-4899", tutorId: "t10", produtoId: "fn-sensitive-gato-3", dataCompra: diasAtras(58), quantidade: 1 },
  { id: "PD-4903", tutorId: "t11", produtoId: "fn-fresh-adulto-15", dataCompra: diasAtras(21), quantidade: 1 },
  { id: "PD-4911", tutorId: "t12", produtoId: "fn-pro-filhote-15", dataCompra: diasAtras(12), quantidade: 1 },
  { id: "PD-4918", tutorId: "t13", produtoId: "golden-adulto-15", dataCompra: diasAtras(9), quantidade: 1 },
  { id: "PD-4925", tutorId: "t14", produtoId: "fn-fresh-gato-7", dataCompra: diasAtras(15), quantidade: 1 },
];

export const EXCLUSOES: Exclusao[] = [
  { pedidoId: "PD-4788", cliente: "Sandra Vasques", motivo: "Nenhum pet cadastrado para o tutor — sem peso não há como calcular consumo." },
  { pedidoId: "PD-4795", cliente: "Hugo Marchetti", motivo: "Produto do pedido é petisco/acessório, não ração — fora do ciclo de recompra." },
  { pedidoId: "PD-4802", cliente: "Renata Lobo", motivo: "Peso do pet não informado no cadastro nem extraído da conversa de WhatsApp." },
  { pedidoId: "PD-4869", cliente: "Diego Sampaio", motivo: "Ração comprada não corresponde à ração registrada para o pet — vínculo ambíguo." },
  { pedidoId: "PD-4877", cliente: "Clínica Vet Pampulha", motivo: "Compra em atacado (12 pacotes) — perfil não é consumo doméstico." },
];

/* ------------------------------------------------------------------ motor */

export function calcularFila(hoje: Date = HOJE): LinhaFila[] {
  const linhas: LinhaFila[] = [];

  for (const pedido of PEDIDOS) {
    const tutor = TUTORES.find((t) => t.id === pedido.tutorId);
    const produto = PRODUTOS.find((p) => p.id === pedido.produtoId);
    if (!tutor || !produto) continue;

    // pets do tutor que consomem exatamente aquela ração
    const pets = tutor.pets.filter((p) => p.produtoId === produto.id);
    if (pets.length === 0) continue;

    let min = 0, max = 0, medio = 0;
    let fonte: FonteCalculo = "tabela";
    for (const pet of pets) {
      const c = consumoDiario(pet, produto);
      min += c.min; max += c.max; medio += c.medio;
      if (c.fonte === "estimativa") fonte = "estimativa";
    }

    const gramasPacote = produto.pesoPacoteKg * 1000 * pedido.quantidade;
    const diasDuracao = gramasPacote / medio;

    const dataCompra = new Date(pedido.dataCompra);
    const dataRecompra = new Date(dataCompra);
    dataRecompra.setDate(dataRecompra.getDate() + Math.round(diasDuracao));

    const diasRestantes = Math.round((dataRecompra.getTime() - hoje.getTime()) / 86400000);
    const situacao: Situacao = diasRestantes < 0 ? "atrasado" : diasRestantes <= 3 ? "urgente" : "normal";

    linhas.push({
      id: pedido.id,
      tutor, pets, produto, dataCompra, dataRecompra,
      diasRestantes,
      diasDuracao: Math.round(diasDuracao),
      consumoDiarioG: Math.round(medio),
      consumoMinG: Math.round(min),
      consumoMaxG: Math.round(max),
      fonte, situacao,
      valor: produto.preco * pedido.quantidade,
      multiPet: pets.length > 1,
    });
  }

  return linhas.sort((a, b) => a.diasRestantes - b.diasRestantes);
}

export function previsaoPorMes(linhas: LinhaFila[]) {
  const mapa = new Map<string, number>();
  for (const l of linhas) {
    const chave = `${l.dataRecompra.getFullYear()}-${String(l.dataRecompra.getMonth() + 1).padStart(2, "0")}`;
    mapa.set(chave, (mapa.get(chave) ?? 0) + l.valor);
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, valor]) => {
      const [ano, mes] = chave.split("-");
      const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
      return { mes: `${nomes[Number(mes) - 1]}/${ano.slice(2)}`, valor: Math.round(valor) };
    });
}

export const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const dataCurta = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
