import { useEffect, useMemo, useState } from "react";
import { Check, Copy, MessageCircle, Send } from "lucide-react";

import {
  conversaCliente,
  mensagemRecompra,
  telefoneDigitos,
  telefoneTutor,
  type LinhaFila,
} from "@/lib/recompra-data";
import { cn } from "@/lib/utils";

export function WhatsAppCliente({ linha }: { linha: LinhaFila }) {
  const conversa = useMemo(() => conversaCliente(linha), [linha]);
  const [texto, setTexto] = useState(() => mensagemRecompra(linha));
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setTexto(mensagemRecompra(linha));
    setCopiado(false);
  }, [linha]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      setCopiado(false);
    }
  };

  const link = `https://wa.me/${telefoneDigitos(linha.tutor.id)}?text=${encodeURIComponent(texto)}`;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Conversa no WhatsApp
          </p>
          <span className="text-[11px] text-muted-foreground">{telefoneTutor(linha.tutor.id)}</span>
        </div>
        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/60 p-3">
          {conversa.map((m, i) => (
            <div key={i} className={cn("flex", m.de === "loja" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm",
                  m.de === "loja"
                    ? "rounded-br-sm bg-ok-soft text-ok"
                    : "rounded-bl-sm bg-card text-card-foreground",
                )}
              >
                {m.texto}
                <span className="mt-1 block text-[10px] opacity-60">{m.quando}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Mensagem pronta de aviso de recompra
        </p>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={6}
          className="mt-2 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Send className="h-3.5 w-3.5" />
            Enviar no WhatsApp
          </a>
          <button
            type="button"
            onClick={copiar}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-secondary"
          >
            {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiado ? "Copiado" : "Copiar texto"}
          </button>
          <button
            type="button"
            onClick={() => setTexto(mensagemRecompra(linha))}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Restaurar sugestão
          </button>
        </div>
      </div>
    </div>
  );
}
