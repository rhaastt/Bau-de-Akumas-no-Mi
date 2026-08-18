# Baú de Itens

Mini-jogo estático (HTML, CSS e JavaScript puro, sem build nem dependências)
em que o jogador abre baús e coleciona itens do universo de One Piece.

## Itens

O catálogo fica em `dados/`, um arquivo JSON por categoria:

| Arquivo | Categoria | Itens |
|---|---|---|
| `dados/frutas.json` | Fruta | 109 Akuma no Mi |
| `dados/armas.json` | Arma | 26 espadas e armas lendárias |

Cada item tem `nome`, `tipo`, `img` e `desc`; a `categoria` fica no topo do
arquivo. Para adicionar uma categoria nova, crie o JSON e liste-o em
`ARQUIVOS`, no começo de `javascript/dados.js`.

O baú sorteia uniformemente entre todos os itens do catálogo.

## Telas

Baú, Mochila, Perfil, Loja, Ajustes e Busca — todas na mesma página, com
troca via JavaScript. No desktop a navegação vira uma barra lateral e a
mochila acompanha o baú em duas colunas.

O progresso não é salvo: recarregar a página zera mochila e Berrys.

## Rodando

O projeto usa módulos ES e `fetch`, então precisa ser servido por HTTP —
abrir o `index.html` direto pelo sistema de arquivos não funciona:

```sh
python3 -m http.server
```

E acesse http://localhost:8000

## Imagens

As artes ficam em `imagens/`. As armas apontam para
`imagens/armas/<nome-em-slug>.webp`; enquanto o arquivo não existir, o item
aparece com o mesmo tratamento de um slot vazio, sem imagem quebrada.
