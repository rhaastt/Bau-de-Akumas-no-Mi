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

A cor aparece na borda do slot, na borda da imagem do modal, no selo e na
legenda do drop. Ela nunca é o único sinal — o selo diz o nome da raridade por
escrito, e Épico e Lendário ainda ganham traço mais grosso.

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

**Duplicata é ter 2 ou mais cópias do mesmo item.** Vender remove uma cópia e
nunca a última, então a coleção nunca encolhe — o item continua marcado como
obtido no Perfil e na Busca. Dá para vender item a item pelo modal ou todas de
uma vez pelo botão na Mochila.

## Telas

Baú, Mochila, Perfil, Loja, Ajustes e Busca — todas na mesma página, com troca
via JavaScript. No desktop a navegação vira uma barra lateral e a mochila
acompanha o baú em duas colunas.

O progresso não é salvo: recarregar a página zera mochila e Berrys.

## Imagens

As artes ficam em `imagens/`. As armas apontam para
`imagens/armas/<nome-em-slug>.webp`; enquanto o arquivo não existir, o item
aparece com o mesmo tratamento de um slot vazio, sem imagem quebrada.

## Testes

A suíte dirige um navegador de verdade com Playwright e cobre dados, fluxo do
jogo, navegação entre telas, responsividade e acessibilidade.

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
css/          tokens.css define as variáveis; styles.css importa o resto
javascript/   dados.js carrega, estado.js guarda, telas/ desenha
dados/        catálogo em JSON, um arquivo por categoria
imagens/
testes/       suíte Playwright + servidor estático
```

Convenções e armadilhas do projeto estão em [`CLAUDE.md`](CLAUDE.md).
