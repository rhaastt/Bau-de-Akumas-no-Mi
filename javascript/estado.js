/* Estado compartilhado e observável.
 *
 * É a peça que faz uma compra na Loja atualizar o saldo no topo, o contador
 * de baús e a tela de Perfil sem fiação manual entre telas: cada tela assina
 * e se redesenha quando algo muda.
 *
 * O progresso é salvo: notificar() persiste o estado inteiro, então toda ação
 * de domínio já grava sem que nenhuma tela precise saber disso.
 */

import { VALOR_VENDA, BONUS_DESCOBERTA } from "./raridade.js";
import { PERGUNTAS_POR_CATEGORIA, POTE_VAZIO, recompensaDe, somar } from "./quiz.js";
import * as persistencia from "./persistencia.js";

// O catálogo chega de dados/*.json em tempo de execução, por isso é
// preenchido por definirCatalogo() e lido por funções, não por consts.
let _catalogo = [];
let _categorias = [];
let _tiposPorCategoria = {};
let _totalPorTipo = {};
let _totalPorCategoria = {};
let _totalPorRaridade = {};

export function definirCatalogo(itens) {
  _catalogo = itens;
  _categorias = [...new Set(itens.map((i) => i.categoria))];

  _tiposPorCategoria = {};
  _totalPorTipo = {};
  _totalPorCategoria = {};
  _totalPorRaridade = {};

  for (const item of itens) {
    _totalPorTipo[item.tipo] = (_totalPorTipo[item.tipo] || 0) + 1;
    _totalPorCategoria[item.categoria] =
      (_totalPorCategoria[item.categoria] || 0) + 1;
    _totalPorRaridade[item.raridade] =
      (_totalPorRaridade[item.raridade] || 0) + 1;

    const lista = (_tiposPorCategoria[item.categoria] ||= []);
    if (!lista.includes(item.tipo)) lista.push(item.tipo);
  }
}

// As perguntas chegam de dados/quiz.json em tempo de execução, pelo mesmo
// motivo do catálogo: não existe constante para exportar no topo do arquivo.
let _perguntas = [];

export function definirQuiz(categorias) {
  _perguntas = categorias;
}

export const categoriasQuiz = () => _perguntas;
export const perguntasDe = (nome) =>
  _perguntas.find((c) => c.nome === nome)?.perguntas ?? [];

export const catalogo = () => _catalogo;
export const categorias = () => _categorias;
export const tiposDe = (categoria) => _tiposPorCategoria[categoria] ?? [];
export const totalPorTipo = () => _totalPorTipo;
export const totalPorCategoria = () => _totalPorCategoria;
export const totalPorRaridade = () => _totalPorRaridade;

// 1.000 Berrys compram exatamente 4 baús avulsos (250 cada); o pacote de 5
// (1.100) fica logo fora de alcance de propósito.
const estadoInicial = () => ({
  mochila: [],
  // Nomes já encontrados alguma vez. Só cresce, e existe separado da mochila
  // porque o bônus de descoberta precisa de memória própria: como vender pode
  // esvaziar a mochila, olhar para ela faria todo item voltar a ser "inédito"
  // e o bônus seria pago de novo a cada ciclo vender-reencontrar.
  descobertos: [],
  berrys: 1000,
  baus: { atual: 2, total: 20 },
  bausAbertos: 0,
  config: {
    animacoes: true,
    irParaMochilaAoGanhar: false,
  },
  // progresso[cat] conta perguntas RESPONDIDAS, não acertadas: é o que faz o
  // erro encerrar a tentativa sem apagar o que já foi desbloqueado.
  // ciclos[cat] conta voltas completas — a partir da primeira, a categoria
  // rende a taxa de rejogo.
  quiz: { progresso: {}, ciclos: {} },
  // Sequência em andamento. Mora no estado, e não no módulo da tela, para
  // sobreviver a sair da tela e voltar: o pote em aberto não some sozinho.
  rodada: null,
});

/**
 * Mescla o save sobre o estado inicial, um nível fundo.
 *
 * Sem isso, um campo novo acrescentado depois volta `undefined` para quem já
 * tem save antigo: o jogo quebraria em produção e passaria nos testes, que
 * sempre partem de storage vazio.
 */
function mesclarSalvo(salvo) {
  const base = estadoInicial();
  if (!salvo) return base;

  const resultado = { ...base, ...salvo };
  for (const [chave, valorBase] of Object.entries(base)) {
    const valorSalvo = salvo[chave];
    const objetoSimples = (v) => v && typeof v === "object" && !Array.isArray(v);
    if (objetoSimples(valorBase) && objetoSimples(valorSalvo)) {
      resultado[chave] = { ...valorBase, ...valorSalvo };
    }
  }
  return resultado;
}

let estado = mesclarSalvo(persistencia.carregar());
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
  persistencia.salvar(estado);
  for (const fn of ouvintes) fn(estado);
}

/** Aplica um patch raso no estado e notifica os assinantes. */
export function atualizar(patch) {
  estado = { ...estado, ...patch };
  notificar();
}

// ===== Ações de domínio =====

/**
 * Guarda o item na mochila. Item inédito paga o bônus de descoberta na hora;
 * duplicata não paga nada aqui — ela rende quando o jogador vende.
 *
 * @returns {number} Berrys creditados (0 se era duplicata)
 */
export function adicionarItem(item) {
  // Inédito é o que nunca foi descoberto, não o que não está na mochila:
  // sem isso, vender tudo e reencontrar pagaria o bônus outra vez.
  const inedito = !estado.descobertos.includes(item.nome);
  const bonus = inedito ? BONUS_DESCOBERTA[item.raridade] ?? 0 : 0;

  atualizar({
    mochila: [...estado.mochila, item],
    descobertos: inedito
      ? [...estado.descobertos, item.nome]
      : estado.descobertos,
    bausAbertos: estado.bausAbertos + 1,
    berrys: Number((estado.berrys + bonus).toFixed(2)),
  });

  return bonus;
}

/** Se o item já rendeu bônus de descoberta alguma vez. */
export function foiDescoberto(nome) {
  return estado.descobertos.includes(nome);
}

/** Quantas cópias de cada nome existem na mochila. */
function contarPorNome(mochila) {
  const contagem = new Map();
  for (const item of mochila) {
    contagem.set(item.nome, (contagem.get(item.nome) ?? 0) + 1);
  }
  return contagem;
}

/**
 * Duplicata é ter 2+ cópias do mesmo nome.
 *
 * Vender é permitido em qualquer item, inclusive no único — mas quem é a última
 * cópia pede confirmação e some da coleção, porque Perfil e Busca leem a mochila.
 * A venda em massa continua tocando só nas duplicatas.
 */
export function ehDuplicata(idx) {
  const item = estado.mochila[idx];
  if (!item) return false;
  return contarPorNome(estado.mochila).get(item.nome) > 1;
}

/** Índices da mochila que podem ser vendidos, preservando uma cópia de cada. */
export function duplicatasNaMochila() {
  const vistos = new Set();
  const indices = [];
  estado.mochila.forEach((item, idx) => {
    if (vistos.has(item.nome)) indices.push(idx);
    else vistos.add(item.nome);
  });
  return indices;
}

/** Soma que o jogador receberia vendendo todas as duplicatas de uma vez. */
export function valorDasDuplicatas() {
  return duplicatasNaMochila().reduce(
    (soma, idx) => soma + (VALOR_VENDA[estado.mochila[idx].raridade] ?? 0),
    0
  );
}

/**
 * Vende uma cópia — duplicata ou única. Vender a última tira o item da
 * coleção: `nomesObtidos()` deriva da mochila, então Perfil e Busca refletem.
 * @returns {number} Berrys recebidos, ou 0 se o índice não existe.
 */
export function venderItem(idx) {
  if (!estado.mochila[idx]) return 0;
  const valor = VALOR_VENDA[estado.mochila[idx].raridade] ?? 0;
  atualizar({
    mochila: estado.mochila.filter((_, i) => i !== idx),
    berrys: Number((estado.berrys + valor).toFixed(2)),
  });
  return valor;
}

/**
 * Vende todas as duplicatas de uma vez.
 * @returns {{quantidade: number, total: number}}
 */
export function venderDuplicatas() {
  const indices = new Set(duplicatasNaMochila());
  if (indices.size === 0) return { quantidade: 0, total: 0 };

  const total = valorDasDuplicatas();
  atualizar({
    mochila: estado.mochila.filter((_, i) => !indices.has(i)),
    berrys: Number((estado.berrys + total).toFixed(2)),
  });
  return { quantidade: indices.size, total };
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
  // Limpar antes: sem isso o notificar() logo abaixo regravaria o save e o
  // progresso ressuscitaria no reload seguinte.
  persistencia.limpar();
  estado = estadoInicial();
  notificar();
}

// ===== Desafio =====

export const progressoDe = (categoria) => estado.quiz.progresso[categoria] ?? 0;
export const ciclosDe = (categoria) => estado.quiz.ciclos[categoria] ?? 0;

/** Categoria completada é a que teve as 5 respondidas, ou já deu uma volta. */
export function foiCompletada(categoria) {
  return progressoDe(categoria) >= PERGUNTAS_POR_CATEGORIA || ciclosDe(categoria) > 0;
}

/**
 * A primeira categoria começa liberada; as outras esperam a anterior fechar.
 * Fechar é responder as 5 — errar não trava, só encerra a tentativa.
 */
export function categoriaLiberada(categoria, ordem) {
  const i = ordem.indexOf(categoria);
  if (i <= 0) return i === 0;
  return foiCompletada(ordem[i - 1]);
}

/**
 * Começa uma sequência. Categoria já completada recomeça do zero e passa a
 * contar como rejogo, que rende a taxa reduzida.
 */
export function iniciarRodada(categoria) {
  const completa = progressoDe(categoria) >= PERGUNTAS_POR_CATEGORIA;
  const ciclos = ciclosDe(categoria) + (completa ? 1 : 0);

  atualizar({
    quiz: {
      progresso: { ...estado.quiz.progresso, [categoria]: completa ? 0 : progressoDe(categoria) },
      ciclos: { ...estado.quiz.ciclos, [categoria]: ciclos },
    },
    rodada: {
      categoria,
      posicao: completa ? 0 : progressoDe(categoria),
      pote: POTE_VAZIO,
      rejogo: ciclos > 0,
      fase: "pergunta",
    },
  });
}

/**
 * Registra a resposta da pergunta atual.
 *
 * O progresso avança nos dois casos — a pergunta foi respondida. O que o erro
 * custa é o pote acumulado, não o desbloqueio.
 *
 * @returns {"acertou"|"completou"|"errou"|null}
 */
export function responderQuiz(acertou) {
  const rodada = estado.rodada;
  if (!rodada || rodada.fase !== "pergunta") return null;

  const respondidas = rodada.posicao + 1;
  const pote = acertou
    ? somar(rodada.pote, recompensaDe(rodada.categoria, rodada.posicao, rodada.rejogo))
    : POTE_VAZIO;
  const fase = !acertou
    ? "errou"
    : respondidas >= PERGUNTAS_POR_CATEGORIA
    ? "completou"
    : "acertou";

  atualizar({
    quiz: {
      ...estado.quiz,
      progresso: { ...estado.quiz.progresso, [rodada.categoria]: respondidas },
    },
    // `perdido` guarda o que o erro custou: o pote já foi zerado acima, e o
    // card de resultado precisa dizer o número em vez de "0".
    rodada: { ...rodada, pote, fase, perdido: acertou ? null : rodada.pote },
  });

  return fase;
}

/** ARRISCAR: segue para a próxima pergunta com o pote em jogo. */
export function arriscar() {
  const rodada = estado.rodada;
  if (!rodada || rodada.fase !== "acertou") return false;
  atualizar({
    rodada: { ...rodada, posicao: rodada.posicao + 1, fase: "pergunta" },
  });
  return true;
}

/**
 * GUARDAR: credita o pote e encerra a sequência.
 *
 * Baús são limitados pelo teto da Loja, então o que passa do limite não é
 * creditado — a tela avisa com o número que de fato entrou, em vez de mentir.
 *
 * @returns {{berrys:number, baus:number, bausPerdidos:number}}
 */
export function guardarRecompensa() {
  const rodada = estado.rodada;
  if (!rodada || (rodada.fase !== "acertou" && rodada.fase !== "completou")) {
    return { ...POTE_VAZIO, bausPerdidos: 0 };
  }

  const cabem = Math.max(0, estado.baus.total - estado.baus.atual);
  const baus = Math.min(rodada.pote.baus, cabem);
  const berrys = rodada.pote.berrys;

  atualizar({
    berrys: Number((estado.berrys + berrys).toFixed(2)),
    baus: { ...estado.baus, atual: estado.baus.atual + baus },
    rodada: null,
  });

  return { berrys, baus, bausPerdidos: rodada.pote.baus - baus };
}

/** Sai da sequência sem creditar nada — usado depois do erro. */
export function abandonarRodada() {
  if (!estado.rodada) return;
  atualizar({ rodada: null });
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
