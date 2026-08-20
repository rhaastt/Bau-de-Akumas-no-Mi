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
index.html              topo, navegação e as 7 <section class="tela">
css/
  styles.css            barril de @import — a ordem importa
  tokens.css            variáveis: cor, espaço, tipografia, raio, raridade
  reset.css componentes.css telas.css mochila.css quiz.css dropItem.css
  modal-item.css
javascript/
  dados.js              carrega os JSON e carimba categoria e raridade
  raridade.js           mapa tipo→raridade, pesos e sorteio ponderado
  quiz.js               categorias, valores das perguntas e taxa de rejogo
  persistencia.js       localStorage: carregar, salvar, limpar
  estado.js             estado observável compartilhado, e que persiste
  navegacao.js          troca de telas
  modalItem.js          modal de detalhe, compartilhado por 3 telas
  util.js               esc, slotHTML, fallback de imagem, formatação
  telas/                quiz, bau, mochila, perfil, loja, config, busca
dados/                  catálogo (um JSON por categoria) + quiz.json
testes/
  executar.js           runner: sobe o servidor, roda os casos, derruba
  auxiliar.js           coletor de checks, ganharItem() e filtro de ruído
  servidor.js           servidor estático (serve o npm start também)
  casos/                dados, economia, quiz, jogo, telas, layout
```

## Regras que não dá para deduzir lendo o código

**Acessores de estado são funções, não constantes.** Use `estado.catalogo()`,
`estado.tiposDe(cat)`, `estado.totalPorTipo()`. O catálogo chega por `fetch`
depois que os módulos já carregaram, então não existe constante para exportar
no topo do arquivo.

**Página única, telas trocadas por JS.** Nasceu de "sem persistência", quando
navegar de verdade zerava o estado. O save existe agora, mas a página única
fica: a troca é instantânea e não há recarga para o estado atravessar.

**O jogo abre no Desafio, não no Baú.** `iniciarNavegacao()` chama
`irPara("quiz")`. Teste que clica `#btn-bau` logo depois do `goto` precisa
navegar antes — use `irAoBau()` de `testes/auxiliar.js`, que `ganharItem()` já
chama sozinho.

**Tudo é salvo, e nada pode lançar ao salvar.** `notificar()` chama
`persistencia.salvar()`, então todo `atualizar()` já grava e nenhuma tela
precisa saber disso. Em compensação, `persistencia.js` engole exceção em tudo:
`localStorage` **lança** em navegação privada e com cookies bloqueados, e um
throw ali derrubaria o jogo a cada compra. Há teste rodando com o storage
lançando de propósito.

**O save é mesclado sobre `estadoInicial()`, um nível fundo.** Campo novo que
você acrescentar volta `undefined` para quem já tem save se o merge for
esquecido — quebra em produção e passa nos testes, que sempre partem de storage
vazio. `resetarProgresso()` limpa o storage **antes** de notificar, senão o
próprio notificar regrava e o progresso ressuscita no reload.

**`esc()` é obrigatório em qualquer texto que entre por `innerHTML`.** As
grades e listas são montadas com template string, então nome e descrição
precisam passar por `esc()` de `util.js`.

**Chame `ligarFallbackImagens(container)` depois de cada `innerHTML` que
contenha imagens.** O evento `error` não borbulha, então não dá para delegar de
um ancestral — o listener precisa ser preso a cada `<img>` após o render.

**Raridade sai do `tipo`, pelo mapa em `raridade.js`.** Não escreva raridade
item a item nos JSON. Um item com campo `raridade` próprio sobrescreve o mapa,
para exceções pontuais.

**Dá para vender qualquer item, inclusive o único — e vender o único tira o
item da coleção.** `nomesObtidos()` deriva da mochila, então o Perfil perde a
contagem e a Busca desmarca. Por isso a última cópia pede confirmação em dois
cliques no modal. `ehDuplicata()` decide se pede confirmação; a venda em massa
(`venderDuplicatas()`) continua tocando **só em duplicatas**, para um clique
nunca destruir item único.

**`mochila` e `descobertos` são coisas diferentes, e misturá-las quebra a
economia.** `mochila` é o que o jogador tem agora; `descobertos` é o que ele já
encontrou alguma vez e **só cresce**. O bônus de descoberta lê `descobertos`.
Se lesse a mochila, vender tudo depois de cada drop faria todo item voltar a
ser inédito: +317 Berrys líquidos por baú, dinheiro infinito. Já simulei — dava
5.000 baús e 1,5 milhão de Berrys sem nunca travar. Há teste guardando isso.

**No Desafio, `progresso[cat]` conta perguntas RESPONDIDAS, não acertadas.** É
o que faz o erro encerrar a tentativa sem apagar o desbloqueio, como o desenho
pede. Quem contasse acertos travaria o jogador na mesma pergunta para sempre.

**A rodada em andamento mora no estado, não no módulo da tela.** Assim ela
sobrevive a sair da tela e voltar, e o pote em aberto não some sozinho. Efeito
colateral bom: como o save roda em todo `atualizar()`, a resposta errada é
gravada antes de qualquer reload — não dá para recarregar a página para escapar
do erro.

**O Desafio não é enfeite: sem ele a coleção não fecha.** Simulando a partida
inteira, só com baú e venda o jogador trava em 110/135 itens depois de ~255
baús. Com a primeira passada do Desafio chega a 131/135. Só com o rejogo a
coleção fecha, em ~1.194 baús e ~17 ciclos. Se mexer em `TAXA_REJOGO` ou nos
valores de `quiz.js`, rode a simulação de novo — é essa curva que está em jogo.

**O rejogo não tem risco, e tudo bem.** Quem decorou as respostas arrisca de
graça na repetição; a tensão é propriedade da primeira passada. Não há
embaralhamento nem cooldown de propósito — se o valor precisar cair, `TAXA_REJOGO`
é uma linha só.

**Todo valor de economia mora em `raridade.js`**, junto de `PESOS`:
`VALOR_VENDA` (venda) e `BONUS_DESCOBERTA` (item inédito). O bônus é sempre
maior que a venda da mesma raridade, de propósito: sem isso o incentivo inverte
e o jogador passa a torcer por repetido.

**O modal não conhece regra de jogo.** `abrirItem(item, { venda })` só mostra o
botão de vender se quem abriu passou a opção. Por isso a Busca, que usa o mesmo
modal para itens do catálogo, não oferece venda.

**Cor existe só para raridade, e nunca sozinha.** O resto do design é line-art
preto e branco. Onde a cor aparece, a informação também é dada por texto (o
selo diz o nome) ou por forma (Épico e Lendário têm borda mais grossa).

**A raridade também pesa no tempo do drop.** `tempoDoDrop()` em `telas/bau.js`
vai de 1.400 ms num Comum a 3.400 ms num Lendário, e Épico e Lendário ganham
`.destaque`. Isso é exportado justamente para o teste esperar pela raridade
sorteada: espera fixa falharia nos 3% em que sai Lendário — flake que só
aparece semanas depois.

**A cor da raridade pinta o item, nunca a ação.** Slot, borda da imagem do
drop, legenda do drop, imagem do modal e selo carregam `--cor-raridade`. O
botão de vender fica preto como qualquer outro botão — ele estava herdando a
raridade e ficava bronze num Lendário, o que sugeria que a cor dizia algo sobre
a venda. A confirmação continua se distinguindo por inversão, não por cor nova.

**Valores visuais vêm de `tokens.css`.** Nada de cor, espaço, raio ou tamanho
de fonte cru dentro dos componentes — use as variáveis. São três escalas, e
todas têm degraus suficientes:

- espaço: `--e-2xs` 2px · `--e-xs` 4px · `--e-sm` 6px · `--e-md` 8px ·
  `--e-lg` 12px · `--e-xl` 18px · `--e-2xl` 26px · `--e-3xl` 40px;
- tipografia: `--txt-2xs` … `--txt-xl` e `--txt-display`, um degrau por papel
  (rótulo de slot, selo, chip, apoio, corpo, título de painel, nome do item,
  contador do baú). Todo `font-size` do projeto sai daqui — se um tamanho novo
  parecer necessário, quase sempre o certo é usar o degrau vizinho;
- raio: `--raio-sm/md/lg/pill`.

`reset.css` é a única exceção: ele normaliza o navegador antes do tema e
mantém os valores próprios de reset (`80%` em `sub`/`sup`, borda de `input`).

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

**Venda de duplicata sozinha não sustenta o começo do jogo.** Nos primeiros 10
baús aparecem ~0,3 duplicatas: o começo produz item novo, não repetido. Simulei
e aumentar o preço de venda não resolve — triplicar a tabela dá exatamente os
mesmos 4 baús antes de travar. É por isso que o bônus de descoberta existe.
Se mexer nesses valores, simule antes: a curva é sensível, e entre
110/220/450/950/2400 e 130/260/550/1100/2800 a partida salta de 248 para 539
baús abertos.

**`rem` não é confiável aqui.** `componentes.css` define
`html { font-size: var(--txt-raiz) }`, e `--txt-raiz` é
`clamp(14px, 2.2vmin, 18px)` — a raiz depende da viewport. Então `rem` num
componente vira um número que ninguém prevê lendo o código: o
`padding: 0.5rem 0.9rem` do botão Fechar do modal resolvia para 7px / 12.6px
em 390px de largura. É por isso que espaçamento sai de `--e-*`, e não de `rem`.

**Cuidado com teste que verifica o atributo e não o efeito.** O mesmo bug acima
passou batido porque o teste conferia `data-raridade`, não a cor computada.
Quando o objetivo é visual, verifique o valor computado. Os dois checks de cor
mais novos seguem esse padrão, e o do botão de vender vai um passo além: em vez
de fixar `rgb(0, 0, 0)` e mais nada, compara a cor computada num item Comum com
a de um Lendário. Assim ele acusa o dia em que alguém reintroduzir a herança de
`--cor-raridade`, mesmo que a tinta preta mude de valor.

## Ao mexer nos dados

- Adicionar categoria: crie `dados/<nome>.json` no mesmo formato
  (`{ "categoria": ..., "itens": [...] }`) e liste em `ARQUIVOS`, no topo de
  `javascript/dados.js`. Nada mais precisa mudar — filtros, contagens e o
  perfil se montam sozinhos a partir do catálogo.
- Adicionar tipo novo: acrescente a raridade dele em `POR_TIPO`, em
  `raridade.js`. Tipo sem mapa cai em `Comum` silenciosamente.
- Os testes checam contagens exatas (135 itens, distribuição 63/27/22/11/12).
  Ao mexer no catálogo, atualize `testes/casos/dados.js` junto.
- Perguntas novas entram em `dados/quiz.json`. São 3 categorias × 5 perguntas,
  e `PERGUNTAS_POR_CATEGORIA` em `quiz.js` fecha com `VALOR_POR_POSICAO`: mudar
  a quantidade exige mexer nos dois, senão a última pergunta fica sem valor.

## Antes de entregar

Rode `npm test` e exija tudo verde. Na ordem em que `testes/executar.js` roda:
dados e raridade; economia (bônus, venda, e a brecha do dinheiro infinito); o
Desafio (risco, rejogo, persistência e storage indisponível); o fluxo do jogo;
navegação e busca; e layout/acessibilidade em cinco larguras.

O idioma do projeto é português — código, comentários, commits e documentação.
