# CLAUDE.md

Orientações para trabalhar neste repositório. O `README.md` explica o projeto
para quem usa; aqui ficam as convenções e as armadilhas de quem mexe no código.

## O projeto

Mini-jogo estático de coleção de itens de One Piece. HTML, CSS e JavaScript
puro, **sem build**. A única dependência é o Playwright, e só para os testes.

**Precisa ser servido por HTTP.** Módulos ES e `fetch` não funcionam em
`file://` — abrir o `index.html` direto mostra uma página quebrada.

```sh
npm start     # servidor em http://localhost:8000
npm test      # suíte completa; sobe e derruba o servidor sozinha
```

## Estrutura

```
index.html              topo, navegação e as 6 <section class="tela">
css/
  styles.css            barril de @import — a ordem importa
  tokens.css            variáveis: cor, espaço, raio, raridade
  reset.css componentes.css telas.css mochila.css dropItem.css modal-item.css
javascript/
  dados.js              carrega os JSON e carimba categoria e raridade
  raridade.js           mapa tipo→raridade, pesos e sorteio ponderado
  estado.js             estado observável compartilhado
  navegacao.js          troca de telas
  modalItem.js          modal de detalhe, compartilhado por 3 telas
  util.js               esc, slotHTML, fallback de imagem, formatação
  telas/                bau, mochila, perfil, loja, config, busca
dados/                  catálogo, um JSON por categoria
testes/                 suíte Playwright + servidor estático
```

## Regras que não dá para deduzir lendo o código

**Acessores de estado são funções, não constantes.** Use `estado.catalogo()`,
`estado.tiposDe(cat)`, `estado.totalPorTipo()`. O catálogo chega por `fetch`
depois que os módulos já carregaram, então não existe constante para exportar
no topo do arquivo.

**Página única, telas trocadas por JS.** Não é preferência: sem persistência,
navegar entre páginas de verdade zeraria mochila e Berrys a cada clique.

**`esc()` é obrigatório em qualquer texto que entre por `innerHTML`.** As
grades e listas são montadas com template string, então nome e descrição
precisam passar por `esc()` de `util.js`.

**Chame `ligarFallbackImagens(container)` depois de cada `innerHTML` que
contenha imagens.** O evento `error` não borbulha, então não dá para delegar de
um ancestral — o listener precisa ser preso a cada `<img>` após o render.

**Raridade sai do `tipo`, pelo mapa em `raridade.js`.** Não escreva raridade
item a item nos JSON. Um item com campo `raridade` próprio sobrescreve o mapa,
para exceções pontuais.

**Cor existe só para raridade, e nunca sozinha.** O resto do design é line-art
preto e branco. Onde a cor aparece, a informação também é dada por texto (o
selo diz o nome) ou por forma (Épico e Lendário têm borda mais grossa).

**Valores visuais vêm de `tokens.css`.** Nada de cor, espaço ou raio cru dentro
dos componentes — use as variáveis.

**Uma assinatura só redesenha tudo.** `jogo.js` assina `estado.assinar()` uma
vez e chama todos os `render*`. É proposital: as telas são pequenas e redesenho
seletivo não se paga aqui.

## Armadilhas que já custaram tempo

**O botão do baú alterna abrir/fechar, e só o abrir consome um baú.** Cada item
custa **dois cliques**. Isso já quebrou a suíte de testes duas vezes — para
ganhar um item num teste, use `ganharItem()` de `testes/auxiliar.js`, que
clica até a mochila crescer.

**`imagens/armas/` não existe.** As artes das armas serão fornecidas depois. O
comportamento correto hoje é degradar: slot e drop entram em `sem-imagem` e
mostram o mesmo `+` do slot vazio. Testes devem exigir a **degradação**, não o
carregamento; e os 404 dessas imagens são ruído esperado, filtrado em
`testes/auxiliar.js`.

**Ao acrescentar uma declaração num bloco CSS existente, confira se o próprio
bloco a redefine mais abaixo.** A cor da legenda do drop nasceu morta assim: a
linha nova foi inserida no topo do bloco, que já tinha `color: #111` no fim.

**Cuidado com teste que verifica o atributo e não o efeito.** O mesmo bug acima
passou batido porque o teste conferia `data-raridade`, não a cor computada.
Quando o objetivo é visual, verifique o valor computado.

## Ao mexer nos dados

- Adicionar categoria: crie `dados/<nome>.json` no mesmo formato
  (`{ "categoria": ..., "itens": [...] }`) e liste em `ARQUIVOS`, no topo de
  `javascript/dados.js`. Nada mais precisa mudar — filtros, contagens e o
  perfil se montam sozinhos a partir do catálogo.
- Adicionar tipo novo: acrescente a raridade dele em `POR_TIPO`, em
  `raridade.js`. Tipo sem mapa cai em `Comum` silenciosamente.
- Os testes checam contagens exatas (135 itens, distribuição 63/27/22/11/12).
  Ao mexer no catálogo, atualize `testes/casos/dados.js` junto.

## Antes de entregar

Rode `npm test` e exija tudo verde. A suíte cobre dados e raridade, o fluxo do
jogo, navegação e busca, e layout/acessibilidade em cinco larguras.

O idioma do projeto é português — código, comentários, commits e documentação.
