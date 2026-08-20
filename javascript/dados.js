/* Carregamento do catálogo.
 *
 * Os itens vivem em dados/*.json, um arquivo por categoria. Adicionar uma
 * categoria nova é acrescentar um arquivo e listá-lo em ARQUIVOS.
 *
 * fetch em vez de `import ... with { type: "json" }`: o projeto já exige um
 * servidor (módulos ES não funcionam em file://) e fetch roda em qualquer
 * navegador, enquanto módulos JSON só chegaram ao Firefox recentemente.
 */

import { raridadeDoTipo } from "./raridade.js";

const ARQUIVOS = ["dados/frutas.json", "dados/armas.json"];
const ARQUIVO_QUIZ = "dados/quiz.json";

async function buscarJSON(caminho) {
  const resposta = await fetch(caminho);
  if (!resposta.ok) {
    throw new Error(`Falha ao carregar ${caminho}: ${resposta.status}`);
  }
  return resposta.json();
}

async function carregarArquivo(caminho) {
  const dados = await buscarJSON(caminho);
  if (!dados || !Array.isArray(dados.itens)) {
    throw new Error(`${caminho} não tem uma lista "itens".`);
  }
  // A categoria fica no topo do arquivo e é carimbada em cada item aqui,
  // para não se repetir 109 vezes no JSON. A raridade sai do tipo pelo mesmo
  // motivo — mas um item pode trazer a sua e ter precedência.
  return dados.itens.map((item) => ({
    ...item,
    categoria: dados.categoria,
    raridade: item.raridade ?? raridadeDoTipo(item.tipo),
  }));
}

/** Busca todos os arquivos em paralelo e devolve a lista achatada. */
export async function carregarCatalogo() {
  const listas = await Promise.all(ARQUIVOS.map(carregarArquivo));
  return listas.flat();
}

/**
 * Carrega as perguntas do Desafio.
 *
 * Arquivo separado do catálogo porque a forma é outra: o catálogo vira uma
 * lista achatada de itens, e o quiz é uma lista de categorias, cada uma com
 * suas perguntas em ordem — a ordem é a progressão.
 */
export async function carregarQuiz() {
  const dados = await buscarJSON(ARQUIVO_QUIZ);
  if (!dados || !Array.isArray(dados.categorias)) {
    throw new Error(`${ARQUIVO_QUIZ} não tem uma lista "categorias".`);
  }
  return dados.categorias;
}
