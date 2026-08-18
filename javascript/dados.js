/* Carregamento do catálogo.
 *
 * Os itens vivem em dados/*.json, um arquivo por categoria. Adicionar uma
 * categoria nova é acrescentar um arquivo e listá-lo em ARQUIVOS.
 *
 * fetch em vez de `import ... with { type: "json" }`: o projeto já exige um
 * servidor (módulos ES não funcionam em file://) e fetch roda em qualquer
 * navegador, enquanto módulos JSON só chegaram ao Firefox recentemente.
 */

const ARQUIVOS = ["dados/frutas.json", "dados/armas.json"];

async function carregarArquivo(caminho) {
  const resposta = await fetch(caminho);
  if (!resposta.ok) {
    throw new Error(`Falha ao carregar ${caminho}: ${resposta.status}`);
  }
  const dados = await resposta.json();
  if (!dados || !Array.isArray(dados.itens)) {
    throw new Error(`${caminho} não tem uma lista "itens".`);
  }
  // A categoria fica no topo do arquivo e é carimbada em cada item aqui,
  // para não se repetir 109 vezes no JSON.
  return dados.itens.map((item) => ({ ...item, categoria: dados.categoria }));
}

/** Busca todos os arquivos em paralelo e devolve a lista achatada. */
export async function carregarCatalogo() {
  const listas = await Promise.all(ARQUIVOS.map(carregarArquivo));
  return listas.flat();
}
