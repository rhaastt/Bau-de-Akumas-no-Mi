/* Estado compartilhado e observável.
 *
 * É a peça que faz uma compra na Loja atualizar o saldo no topo, o contador
 * de baús e a tela de Perfil sem fiação manual entre telas: cada tela assina
 * e se redesenha quando algo muda.
 *
 * Sem persistência por decisão de produto — recarregar a página zera tudo.
 */

import { bauDeItens } from "./akumasNoMi.js";

/** Catálogo achatado: as 109 frutas numa lista só. */
export const catalogo = [
  ...bauDeItens.paramecia,
  ...bauDeItens.logia,
  ...bauDeItens.zoan,
];

/** Tipos reais presentes no campo `tipo`, na ordem em que aparecem. */
export const tipos = [...new Set(catalogo.map((f) => f.tipo))];

/** Quantas frutas existem por tipo — base das barras do Perfil. */
export const totalPorTipo = catalogo.reduce((acc, f) => {
  acc[f.tipo] = (acc[f.tipo] || 0) + 1;
  return acc;
}, {});

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

/** Cópia rasa para leitura. Telas não devem mutar o estado direto. */
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

/** Nomes das frutas já coletadas — usado por Perfil e Busca. */
export function nomesObtidos() {
  return new Set(estado.mochila.map((f) => f.nome));
}

/** Quantas frutas distintas foram coletadas, por tipo. */
export function obtidasPorTipo() {
  const obtidos = nomesObtidos();
  const contagem = {};
  for (const tipo of tipos) contagem[tipo] = 0;
  for (const fruta of catalogo) {
    if (obtidos.has(fruta.nome)) contagem[fruta.tipo] += 1;
  }
  return contagem;
}
