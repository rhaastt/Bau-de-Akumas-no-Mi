# Baú de Itens

Mini-jogo estático em que o jogador abre baús e coleciona itens do universo de
One Piece. HTML, CSS e JavaScript puro — sem build e sem nenhuma dependência
em produção.

## Rodando

O projeto usa módulos ES e `fetch`, então precisa ser servido por HTTP — abrir
o `index.html` direto pelo sistema de arquivos **não funciona**:

```sh
npm start          # http://localhost:8000
```

Qualquer servidor estático serve, se preferir: `python3 -m http.server`.

## Itens

O catálogo fica em `dados/`, um arquivo JSON por categoria:

| Arquivo | Categoria | Itens |
|---|---|---|
| `dados/frutas.json` | Fruta | 109 Akuma no Mi |
| `dados/armas.json` | Arma | 26 espadas e armas lendárias |

(`dados/quiz.json` fica na mesma pasta, mas tem forma própria — são as
perguntas do Desafio, não itens de catálogo.)

Cada item tem `nome`, `tipo`, `img` e `desc`; a `categoria` fica no topo do
arquivo e vale para todos os itens dele. Para adicionar uma categoria nova,
crie o JSON e liste-o em `ARQUIVOS`, no começo de `javascript/dados.js`.

## Raridade

Cada item tem uma raridade, **derivada do `tipo`** pelo mapa em
`javascript/raridade.js` — não escrita item a item. Mudar a raridade de um tipo
inteiro é editar uma linha; para abrir exceção num item específico, basta dar a
ele um campo `raridade` no JSON, que tem precedência sobre o mapa.

| Raridade | Itens | Chance no baú | Cor |
|---|---|---|---|
| Comum | 63 | 50% | preto |
| Incomum | 27 | 25% | verde |
| Raro | 22 | 15% | azul |
| Épico | 11 | 7% | roxo |
| Lendário | 12 | 3% | bronze |

O sorteio é **ponderado**: escolhe-se a raridade primeiro e depois um item
dentro dela, então as porcentagens valem independentemente de uma raridade ter
63 itens e outra 11.

A cor aparece na borda do slot, na borda da imagem do drop, na legenda do drop,
na borda da imagem do modal e no selo. Ela nunca é o único sinal — o selo diz o
nome da raridade por escrito, e Épico e Lendário ainda ganham traço mais grosso.

A cor pinta **o item, nunca a ação**: o botão de vender é preto em qualquer
raridade, como todo botão do sistema. Se ele mudasse de cor junto com o item,
pareceria que a cor diz algo sobre a venda.

A raridade também pesa na revelação do baú: o drop fica mais tempo na tela
quanto mais raro (1,4s num Comum, 3,4s num Lendário), e Épico e Lendário ganham
traço mais grosso e o nome da raridade escrito na legenda.

## Desafio

A tela principal. Três categorias em ordem de progressão — **East Blue**,
**Grand Line** e **Novo Mundo** — com 5 perguntas cada. A primeira começa
liberada; cada categoria libera a seguinte quando suas 5 são respondidas.

Cada acerto acumula, e aí vem a escolha:

```
Pergunta 1 → acertou → +100 Berrys
             [ GUARDAR ]  [ ARRISCAR ]

ARRISCAR → Pergunta 2 → acertou → +200
                                  acumulado: 300 Berrys
             [ GUARDAR ]  [ ARRISCAR ]
```

**GUARDAR** credita tudo na hora e encerra a sequência. **ARRISCAR** segue para
a próxima pergunta com o acumulado em jogo — e errar perde o acumulado inteiro.

Errar **não** apaga progresso: a pergunta continua respondida e as categorias
já liberadas continuam liberadas. O que o erro custa é só o que ainda não tinha
sido guardado.

| Categoria | Perguntas 1 → 5 | Sequência perfeita |
|---|---|---|
| East Blue | 100 · 200 · **1 baú** · 400 · 500 | 1.200 Berrys + 1 baú |
| Grand Line | 200 · 400 · **2 baús** · 800 · 1.000 | 2.400 Berrys + 2 baús |
| Novo Mundo | 300 · 600 · **3 baús** · 1.200 · 1.500 | 3.600 Berrys + 3 baús |

Categoria completada pode ser rejogada, valendo **20%**. As perguntas ficam em
`dados/quiz.json` e os valores em `javascript/quiz.js`.

## Economia

O jogador começa com **1.000 Berrys e 2 baús**. Os 1.000 compram exatamente 4
baús avulsos (250 cada); o pacote de 5, a 1.100, fica logo fora de alcance.

Duas fontes de Berrys, que se complementam ao longo da partida:

| | Quando rende | Comum → Lendário |
|---|---|---|
| **Bônus de descoberta** | ao tirar um item **inédito**, automático | 110 · 220 · 450 · 950 · 2.400 |
| **Venda de duplicata** | quando o jogador **vende** uma cópia extra | 45 · 110 · 280 · 700 · 2.000 |

No começo quase todo drop é novo, então quem paga é a descoberta. Com a coleção
cheia, 87% dos drops são repetidos e quem paga é a venda. Os valores ficam em
`javascript/raridade.js`, ao lado dos pesos do sorteio.

**Mas as duas juntas não bastam**, e é por isso que o Desafio existe. Um baú
custa 250; um item inédito rende 316 em média, mas com a coleção cheia sobra só
a venda, que rende 201 — prejuízo de 49 por baú. Simulando a partida inteira:

| | Baús abertos | Coleção |
|---|---|---|
| Só baú e venda | 255 | trava em 110/135 |
| Com a 1ª passada do Desafio | 502 | trava em 131/135 |
| Com o rejogo do Desafio | 1.194 | **135/135, completa** |

Ou seja: sem o Desafio a coleção **não fecha**. Com ele, fecha em ~17 ciclos de
rejogo — trickle, não torneira aberta.

Clicar num item da Mochila abre o card com o botão de vender. **Qualquer item
pode ser vendido, inclusive o único** — mas vender a última cópia tira o item da
coleção, então o Perfil perde a contagem e a Busca volta a marcar como não
obtido. Por isso a última cópia pede confirmação em dois cliques.

O botão "vender todas as duplicatas", na Mochila, toca **só nas cópias extras**:
um clique nunca destrói um item único.

Reencontrar um item que você vendeu **não** paga o bônus de descoberta de novo —
ele rende uma vez por item, para sempre.

## Telas

Baú, Mochila, Perfil, Loja, Ajustes e Busca — todas na mesma página, com troca
via JavaScript. No desktop a navegação vira uma barra lateral e a mochila
acompanha o baú em duas colunas.

O progresso fica salvo no `localStorage` do navegador: mochila, Berrys, baús,
descobertas e o Desafio voltam como estavam. "Resetar progresso", em Ajustes,
apaga o save. Sem `localStorage` disponível (navegação privada, cookies
bloqueados) o jogo funciona igual — só não lembra.

## Imagens

As artes ficam em `imagens/`. As armas apontam para
`imagens/armas/<nome-em-slug>.webp`; enquanto o arquivo não existir, o item
aparece com o mesmo tratamento de um slot vazio, sem imagem quebrada.

## Testes

A suíte dirige um navegador de verdade com Playwright e cobre dados, economia,
o Desafio, persistência, fluxo do jogo, navegação entre telas, responsividade e
acessibilidade.

```sh
npm install        # instala o Playwright (só para desenvolvimento)
npm test
```

O runner sobe o servidor sozinho numa porta livre e derruba no fim. O
`package.json` existe apenas para essa ferramenta — **o site publicado continua
sem dependência alguma**.

## Estrutura

```
index.html
css/          tokens.css guarda cor, espaço, tipografia e raio;
              styles.css importa o resto
javascript/   dados.js carrega, estado.js guarda, telas/ desenha
dados/        catálogo em JSON, um arquivo por categoria, + quiz.json
imagens/
testes/       suíte Playwright + servidor estático
```

Convenções e armadilhas do projeto estão em [`CLAUDE.md`](CLAUDE.md).
