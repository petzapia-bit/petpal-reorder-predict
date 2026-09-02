# Pet Recharge Planner

Use este texto para explicar, documentar ou recriar a aba principal do painel de recompra (a que abre por padrão, ícones "Painel" e "Fila por situação" na barra lateral).

O que a aba faz

Mostra, para cada pet cadastrado que já comprou ração, a data prevista da próxima compra (recompra) e organiza tudo por urgência, para o time saber quem contatar primeiro. Não usa o campo "recompra prevista" pronto do CRM — o painel recalcula essa data do zero a partir do consumo real de cada pet.

Fonte dos dados

Pedidos reais puxados do CRM (/api/crm/pedidos) cruzados com o cadastro de pets (peso, porte, espécie, ração que consome) extraído do histórico de conversas de WhatsApp e do cadastro manual. Cada linha da fila representa uma combinação cliente + pet(s) + ração comprada.

Como a data de recompra é calculada

Pega o peso do pacote da ração comprada (catálogo de produtos).

Identifica o(s) pet(s) daquele tutor que consomem aquela ração. Se for mais de um pet da mesma espécie dividindo o mesmo pacote, soma o consumo diário de todos.

Consumo diário por pet vem, sempre que possível, da tabela de consumo real impressa na embalagem do fabricante (Fórmula Natural / Adimax — Fresh Meat, Life, Pró, nas variações Adulto/Sênior/Sensitive/Filhote e por porte). Para filhotes o consumo varia também pela idade, não só pelo peso, então a faixa usada é a mín–máx real da tabela para aquela idade/peso.

Quando ainda não existe tabela real confirmada para a ração (hoje: Golden e Premier), o painel cai para uma estimativa por percentual do peso corporal do pet, e marca a linha como estimativa (não como dado real).

Dias de duração do pacote = peso do pacote ÷ consumo diário total. Data de recompra prevista = data da compra + dias de duração.

Cada linha da fila carrega uma marcação de origem do cálculo: ● tabela real do fabricante (verde) ou ○ estimativa por peso (cinza/laranja), para deixar claro o nível de confiança do número.

Classificação de urgência

A partir da data prevista, cada linha recebe um status:

Atrasado: dias restantes negativos (já passou da data prevista).

Urgente: 0 a 3 dias restantes.

Normal: mais de 3 dias restantes.

Como a informação é exibida

3 indicadores em anel no topo: % das vendas calculadas com tabela real do fabricante, % da fila dentro do prazo, % das vendas com mais de um pet.

Gráfico de área: valor previsto de recompra por mês.

Board estilo kanban com 3 colunas (Atrasado / Urgente / Normal), um cartão por combinação cliente+pet com espécie, nome do pet, tutor, data prevista e valor.

Tabela detalhada com pet/tutor, produto (+ selo de fonte do cálculo), data prevista, barra de progresso de urgência, status e valor.

Busca por nome de cliente, pet ou produto filtra kanban e tabela ao mesmo tempo.

Clicar em qualquer cartão/linha abre um modal com o detalhe completo daquela recompra, incluindo a fonte do cálculo.

Um bloco de "Como o cálculo funciona" no topo da aba documenta, em texto, a metodologia acima e lista os pedidos que ficaram de fora do cálculo (com o motivo de cada exclusão).

Limitação conhecida / próximo passo pendente

O cálculo hoje é 100% baseado na tabela do fabricante (peso × consumo recomendado), sem olhar o histórico real de recompra do cliente. Ainda falta calibrar: quando o mesmo cliente já comprou a mesma ração 2+ vezes, comparar o intervalo real entre compras com o valor calculado pela tabela — se o intervalo real for próximo do calculado (ex.: calculado 14 dias, real 18 dias), usar o real; se for muito maior (ex.: calculado 14, real 30), manter o valor da tabela, porque uma diferença grande normalmente indica que o cliente comprou de um concorrente no meio do caminho, não que o pet demora mais para consumir a ração.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4adfdb77-733b-4566-a832-1b63a803abc1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
