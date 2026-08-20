/* Raridade dos itens.
 *
 * A raridade é derivada do `tipo`, não escrita item a item: a regra fica
 * visível num mapa só, e um tipo novo só precisa ser acrescentado aqui.
 * Um item pode trazer `raridade` própria no JSON para abrir exceção — o
 * carregador respeita quando existe.
 */

/** Da mais comum para a mais rara. A ordem importa para exibição. */
export const RARIDADES = ["Comum", "Incomum", "Raro", "Épico", "Lendário"];

/**
 * Peso de cada raridade no sorteio do baú, em porcentagem.
 * Sorteia-se a raridade primeiro e depois um item dentro dela, então estes
 * números valem independente de quantos itens cada raridade tem.
 */
export const PESOS = {
  Comum: 50,
  Incomum: 25,
  Raro: 15,
  Épico: 7,
  Lendário: 3,
};

/**
 * Quanto rende vender uma duplicata. Valor esperado ≈ 201 Berrys, quase o
 * custo de um baú (200 no pacote de 10): o loop quase se paga quando as
 * duplicatas ficam frequentes.
 */
export const VALOR_VENDA = {
  Comum: 45,
  Incomum: 110,
  Raro: 280,
  Épico: 700,
  Lendário: 2000,
};

/**
 * Quanto paga encontrar um item inédito.
 *
 * Existe porque venda de duplicata sozinha não sustenta o início: nos
 * primeiros 10 baús aparecem ~0,3 duplicatas, então o começo produz itens
 * novos, não repetidos. As duas torneiras se complementam ao longo da curva.
 *
 * Sempre acima do VALOR_VENDA da mesma raridade, para achar item novo seguir
 * sendo a melhor notícia — senão o incentivo inverte e o jogador torce por
 * repetido.
 */
export const BONUS_DESCOBERTA = {
  Comum: 110,
  Incomum: 220,
  Raro: 450,
  Épico: 950,
  Lendário: 2400,
};

/** tipo -> raridade. Cobre as duas categorias do catálogo. */
const POR_TIPO = {
  // Frutas
  Paramecia: "Comum",
  Zoan: "Incomum",
  Logia: "Raro",
  "Zoan Ancestral": "Épico",
  "Zoan Mítica": "Lendário",

  // Armas
  Espada: "Comum",
  Katana: "Incomum",
  Sabre: "Raro",
  Nodachi: "Raro",
  Rapieira: "Raro",
  "Lâmina Fina": "Raro",
  "Par de Espadas": "Raro",
  Tridente: "Épico",
  Kanabō: "Épico",
  Foice: "Épico",
  "Lâmina Negra": "Lendário",
  Naginata: "Lendário",
};

const PADRAO = "Comum";

/** Raridade de um tipo. Tipo desconhecido cai em Comum, sem quebrar a tela. */
export function raridadeDoTipo(tipo) {
  return POR_TIPO[tipo] ?? PADRAO;
}

/**
 * Sorteia um item respeitando os pesos: primeiro a raridade, depois um item
 * dentro dela. Raridades sem item no catálogo são ignoradas e os pesos
 * renormalizados, para o sorteio nunca cair num balde vazio.
 */
export function sortearPorRaridade(itens) {
  if (itens.length === 0) return null;

  const porRaridade = new Map();
  for (const item of itens) {
    const lista = porRaridade.get(item.raridade) ?? [];
    lista.push(item);
    porRaridade.set(item.raridade, lista);
  }

  const disponiveis = RARIDADES.filter((r) => porRaridade.has(r));
  const somaPesos = disponiveis.reduce((s, r) => s + (PESOS[r] ?? 0), 0);
  if (somaPesos <= 0) {
    return itens[Math.floor(Math.random() * itens.length)];
  }

  let sorteio = Math.random() * somaPesos;
  for (const raridade of disponiveis) {
    sorteio -= PESOS[raridade] ?? 0;
    if (sorteio <= 0) {
      const lista = porRaridade.get(raridade);
      return lista[Math.floor(Math.random() * lista.length)];
    }
  }

  // Só por segurança contra arredondamento de ponto flutuante.
  const ultima = porRaridade.get(disponiveis[disponiveis.length - 1]);
  return ultima[Math.floor(Math.random() * ultima.length)];
}
