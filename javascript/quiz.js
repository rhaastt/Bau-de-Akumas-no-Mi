/* Regras e valores do Desafio.
 *
 * Mesmo papel que raridade.js tem para a economia do baú: os números moram
 * junto da regra que os usa, em vez de espalhados pelas telas.
 *
 * Por que o Desafio existe: o loop do baú morre sozinho. Um baú custa 250 e um
 * item inédito rende 316 em média, mas com a coleção cheia só sobra a venda,
 * que rende 201 — prejuízo de 49 por baú. O Desafio é a segunda torneira, a que
 * sustenta o fim de partida.
 */

/** Ordem de progressão: cada uma libera a seguinte. */
export const CATEGORIAS = ["East Blue", "Grand Line", "Novo Mundo"];

export const PERGUNTAS_POR_CATEGORIA = 5;

/**
 * Valor da pergunta pela posição dentro da categoria. Crescente de propósito:
 * é o que faz "arrisco mais uma?" pesar mais a cada acerto, porque o que está
 * na mesa cresce mais devagar do que o que vem a seguir.
 */
const VALOR_POR_POSICAO = [100, 200, 300, 400, 500];

/** Multiplicador da categoria — a progressão também é de recompensa. */
const MULTIPLICADOR = { "East Blue": 1, "Grand Line": 2, "Novo Mundo": 3 };

/** Posição (base 0) que paga baú em vez de Berrys, uma por categoria. */
const POSICAO_DO_BAU = 2;

/**
 * Quanto vale rejogar uma categoria já completada.
 *
 * Rende 1.740 Berrys por ciclo completo de 15 perguntas — cobre 36 baús do
 * prejuízo de fim de jogo. É trickle de propósito: quem já decorou as respostas
 * não corre risco nenhum na repetição, então o valor precisa ser pequeno o
 * bastante para o rejogo não substituir o baú como fonte principal.
 */
export const TAXA_REJOGO = 0.2;

/**
 * Recompensa de uma pergunta.
 *
 * @param {string} categoria
 * @param {number} posicao   índice da pergunta na categoria (base 0)
 * @param {boolean} rejogo   true quando a categoria já foi completada antes
 * @returns {{berrys: number, baus: number}}
 */
export function recompensaDe(categoria, posicao, rejogo = false) {
  const mult = MULTIPLICADOR[categoria] ?? 1;
  const taxa = rejogo ? TAXA_REJOGO : 1;

  if (posicao === POSICAO_DO_BAU) {
    // No rejogo o baú vira Berrys: fracionar baú não existe, e arredondar para
    // zero faria a pergunta do meio não pagar nada.
    return rejogo
      ? { berrys: Math.round(VALOR_POR_POSICAO[posicao] * mult * taxa), baus: 0 }
      : { berrys: 0, baus: mult };
  }

  const base = VALOR_POR_POSICAO[posicao] ?? 0;
  return { berrys: Math.round(base * mult * taxa), baus: 0 };
}

/** Soma duas recompensas — usado para acumular o pote da sequência. */
export function somar(a, b) {
  return { berrys: a.berrys + b.berrys, baus: a.baus + b.baus };
}

export const POTE_VAZIO = { berrys: 0, baus: 0 };

/** Texto de uma recompensa, para legenda e para o card de resultado. */
export function descreverRecompensa({ berrys, baus }) {
  const partes = [];
  if (berrys > 0) partes.push(`${berrys.toLocaleString("pt-BR")} Berrys`);
  if (baus > 0) partes.push(`${baus} ${baus === 1 ? "baú" : "baús"}`);
  return partes.join(" + ") || "nada";
}
