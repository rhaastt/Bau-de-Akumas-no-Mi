/* Estado compartilhado e observável.
 *
 * É a peça que faz uma compra na Loja atualizar o saldo no topo, o contador
 * de baús e a tela de Perfil sem fiação manual entre telas: cada tela assina
 * e se redesenha quando algo muda.
 *
 * Sem persistência por decisão de produto — recarregar a página zera tudo.
 */

// O catálogo chega de dados/*.json em tempo de execução, por isso é
// preenchido por definirCatalogo() e lido por funções, não por consts.
let _catalogo = [];
let _categorias = [];
let _tiposPorCategoria = {};
let _totalPorTipo = {};
let _totalPorCategoria = {};

export function definirCatalogo(itens) {
  _catalogo = itens;
  _categorias = [...new Set(itens.map((i) => i.categoria))];

  _tiposPorCategoria = {};
  _totalPorTipo = {};
  _totalPorCategoria = {};

  for (const item of itens) {
    _totalPorTipo[item.tipo] = (_totalPorTipo[item.tipo] || 0) + 1;
    _totalPorCategoria[item.categoria] =
      (_totalPorCategoria[item.categoria] || 0) + 1;

    const lista = (_tiposPorCategoria[item.categoria] ||= []);
    if (!lista.includes(item.tipo)) lista.push(item.tipo);
  }
}

export const catalogo = () => _catalogo;
export const categorias = () => _categorias;
export const tiposDe = (categoria) => _tiposPorCategoria[categoria] ?? [];
export const totalPorTipo = () => _totalPorTipo;
export const totalPorCategoria = () => _totalPorCategoria;

const estadoInicial = () => ({
  mochila: [],
  berrys: 9999.99,
  baus: { atual: 6, total: 20 },
  bausAbertos: 0,
  config: {
    animacoes: true,
    irParaMochilaAoGanhar: false,
  },
});

let estado = estadoInicial();
const ouvintes = new Set();

export function obter() {
  return estado;
}

/** Assina mudanças. Devolve a função para cancelar a assinatura. */
export function assinar(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

function notificar() {
  for (const fn of ouvintes) fn(estado);
}

/** Aplica um patch raso no estado e notifica os assinantes. */
export function atualizar(patch) {
  estado = { ...estado, ...patch };
  notificar();
}

// ===== Ações de domínio =====

export function adicionarItem(item) {
  atualizar({
    mochila: [...estado.mochila, item],
    bausAbertos: estado.bausAbertos + 1,
  });
}

export function consumirBau() {
  if (estado.baus.atual <= 0) return false;
  atualizar({ baus: { ...estado.baus, atual: estado.baus.atual - 1 } });
  return true;
}

/**
 * Compra um pacote de baús.
 * @returns {boolean} false se o saldo não cobre ou estouraria o limite.
 */
export function comprarBaus(quantidade, preco) {
  if (preco > estado.berrys) return false;
  if (estado.baus.atual + quantidade > estado.baus.total) return false;
  atualizar({
    berrys: Number((estado.berrys - preco).toFixed(2)),
    baus: { ...estado.baus, atual: estado.baus.atual + quantidade },
  });
  return true;
}

export function definirConfig(chave, valor) {
  atualizar({ config: { ...estado.config, [chave]: valor } });
}

export function resetarProgresso() {
  estado = estadoInicial();
  notificar();
}

/** Nomes dos itens já coletados — usado por Perfil e Busca. */
export function nomesObtidos() {
  return new Set(estado.mochila.map((i) => i.nome));
}

/** Quantos itens distintos foram coletados, por tipo. */
export function obtidasPorTipo() {
  const obtidos = nomesObtidos();
  const contagem = {};
  for (const tipo of Object.keys(_totalPorTipo)) contagem[tipo] = 0;
  for (const item of _catalogo) {
    if (obtidos.has(item.nome)) contagem[item.tipo] += 1;
  }
  return contagem;
}

/** Quantos itens distintos foram coletados, por categoria. */
export function obtidasPorCategoria() {
  const obtidos = nomesObtidos();
  const contagem = {};
  for (const cat of _categorias) contagem[cat] = 0;
  for (const item of _catalogo) {
    if (obtidos.has(item.nome)) contagem[item.categoria] += 1;
  }
  return contagem;
}
