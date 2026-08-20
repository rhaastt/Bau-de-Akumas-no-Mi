/* Desafio — a tela principal: trilha de categorias e a sequência de risco.
 *
 * Duas vistas dentro da mesma <section>: a trilha, que mostra o progresso, e a
 * rodada, que mostra a pergunta e depois vira o card de resultado.
 *
 * O card de resultado é inline de propósito, e não um segundo modal:
 * modalItem.js é do item e não conhece regra de jogo — duplicá-lo para um
 * payload que não é item seria complicar uma mecânica cuja força é a simplicidade.
 */

import { pegar, esc } from "../util.js";
import * as estado from "../estado.js";
import {
  CATEGORIAS,
  PERGUNTAS_POR_CATEGORIA,
  TAXA_REJOGO,
  descreverRecompensa,
  recompensaDe,
} from "../quiz.js";

let trilhaEl;
let categoriasEl;
let rodadaEl;
let contextoEl;
let perguntaVistaEl;
let enunciadoEl;
let opcoesEl;
let resultadoEl;
let resultadoTituloEl;
let resultadoValorEl;
let resultadoApoioEl;
let acoesEl;
let avisoEl;

/** Cinco quadrados: preenchidos são as perguntas já respondidas. */
function marcadoresHTML(respondidas) {
  const partes = [];
  for (let i = 0; i < PERGUNTAS_POR_CATEGORIA; i++) {
    const cheio = i < respondidas ? " cheio" : "";
    partes.push(`<span class="quiz-marcador${cheio}"></span>`);
  }
  return `<div class="quiz-marcadores" role="img"
    aria-label="${respondidas} de ${PERGUNTAS_POR_CATEGORIA} respondidas">${partes.join(
    ""
  )}</div>`;
}

function rotuloDoBotao(respondidas, ciclos) {
  if (respondidas >= PERGUNTAS_POR_CATEGORIA) return "REJOGAR";
  if (respondidas > 0 || ciclos > 0) return "CONTINUAR";
  return "COMEÇAR";
}

function renderTrilha() {
  categoriasEl.innerHTML = CATEGORIAS.map((nome) => {
    const liberada = estado.categoriaLiberada(nome, CATEGORIAS);
    const respondidas = estado.progressoDe(nome);
    const ciclos = estado.ciclosDe(nome);
    const anterior = CATEGORIAS[CATEGORIAS.indexOf(nome) - 1];

    // A trava também é dita por escrito: opacidade sozinha não é informação.
    const apoio = liberada
      ? ciclos > 0
        ? `Já completada — rejogar rende ${Math.round(TAXA_REJOGO * 100)}% do valor.`
        : `${respondidas} de ${PERGUNTAS_POR_CATEGORIA} respondidas.`
      : `Travada: complete ${esc(anterior)} para liberar.`;

    return `<section class="painel quiz-categoria${liberada ? "" : " travada"}">
      <h2 class="titulo-painel">${esc(nome)}</h2>
      ${marcadoresHTML(respondidas)}
      <p class="texto-apoio">${apoio}</p>
      <button class="btn" type="button" data-categoria="${esc(nome)}"
        ${liberada ? "" : "disabled"}>${
      liberada ? rotuloDoBotao(respondidas, ciclos) : "TRAVADA"
    }</button>
    </section>`;
  }).join("");
}

function renderPergunta(rodada) {
  const perguntas = estado.perguntasDe(rodada.categoria);
  const atual = perguntas[rodada.posicao];
  if (!atual) return;

  const potencial = recompensaDe(rodada.categoria, rodada.posicao, rodada.rejogo);
  contextoEl.textContent =
    `${rodada.categoria} · pergunta ${rodada.posicao + 1} de ${PERGUNTAS_POR_CATEGORIA}` +
    ` · vale ${descreverRecompensa(potencial)}` +
    (rodada.pote.berrys > 0 || rodada.pote.baus > 0
      ? ` · em jogo: ${descreverRecompensa(rodada.pote)}`
      : "");

  enunciadoEl.textContent = atual.pergunta;
  opcoesEl.innerHTML = atual.opcoes
    .map(
      (op, i) =>
        `<li><button class="btn quiz-opcao" type="button" data-opcao="${i}">${esc(
          op
        )}</button></li>`
    )
    .join("");

  perguntaVistaEl.hidden = false;
  resultadoEl.hidden = true;
}

function renderResultado(rodada) {
  perguntaVistaEl.hidden = true;
  resultadoEl.hidden = false;
  contextoEl.textContent = `${rodada.categoria} · pergunta ${
    rodada.posicao + 1
  } de ${PERGUNTAS_POR_CATEGORIA}`;

  if (rodada.fase === "errou") {
    resultadoTituloEl.textContent = "RESPOSTA ERRADA";
    resultadoValorEl.textContent = descreverRecompensa(rodada.perdido ?? rodada.pote);
    resultadoApoioEl.textContent =
      "Recompensa acumulada perdida. O progresso das perguntas continua onde estava.";
    acoesEl.innerHTML = `<button class="btn" type="button" data-acao="voltar">VOLTAR</button>`;
    return;
  }

  const ganho = recompensaDe(rodada.categoria, rodada.posicao, rodada.rejogo);

  if (rodada.fase === "completou") {
    resultadoTituloEl.textContent = "CATEGORIA COMPLETA";
    resultadoValorEl.textContent = descreverRecompensa(rodada.pote);
    resultadoApoioEl.textContent = `Acertou a última: +${descreverRecompensa(
      ganho
    )}. Não há mais o que arriscar aqui.`;
    acoesEl.innerHTML = `<button class="btn" type="button" data-acao="guardar">GUARDAR RECOMPENSA</button>`;
    return;
  }

  resultadoTituloEl.textContent = "ACERTOU";
  resultadoValorEl.textContent = descreverRecompensa(rodada.pote);
  resultadoApoioEl.textContent = `Ganhou ${descreverRecompensa(
    ganho
  )} nesta pergunta. Arriscar coloca tudo isso em jogo.`;
  acoesEl.innerHTML =
    `<button class="btn" type="button" data-acao="guardar">GUARDAR</button>` +
    `<button class="btn" type="button" data-acao="arriscar">ARRISCAR</button>`;
}

export function renderQuiz() {
  const { rodada } = estado.obter();

  if (!rodada) {
    trilhaEl.hidden = false;
    rodadaEl.hidden = true;
    renderTrilha();
    return;
  }

  trilhaEl.hidden = true;
  rodadaEl.hidden = false;
  if (rodada.fase === "pergunta") renderPergunta(rodada);
  else renderResultado(rodada);
}

export function iniciarQuiz() {
  trilhaEl = pegar("quiz-trilha");
  categoriasEl = pegar("quiz-categorias");
  rodadaEl = pegar("quiz-rodada");
  contextoEl = pegar("quiz-contexto");
  perguntaVistaEl = pegar("quiz-pergunta-vista");
  enunciadoEl = pegar("quiz-enunciado");
  opcoesEl = pegar("quiz-opcoes");
  resultadoEl = pegar("quiz-resultado");
  resultadoTituloEl = pegar("quiz-resultado-titulo");
  resultadoValorEl = pegar("quiz-resultado-valor");
  resultadoApoioEl = pegar("quiz-resultado-apoio");
  acoesEl = pegar("quiz-acoes");
  avisoEl = pegar("quiz-aviso");

  categoriasEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-categoria]");
    if (!btn || btn.disabled) return;
    avisoEl.textContent = "";
    estado.iniciarRodada(btn.dataset.categoria);
  });

  opcoesEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-opcao]");
    if (!btn) return;
    const { rodada } = estado.obter();
    if (!rodada || rodada.fase !== "pergunta") return;

    const atual = estado.perguntasDe(rodada.categoria)[rodada.posicao];
    estado.responderQuiz(Number(btn.dataset.opcao) === atual.correta);
  });

  acoesEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-acao]");
    if (!btn) return;

    if (btn.dataset.acao === "arriscar") {
      estado.arriscar();
      return;
    }
    if (btn.dataset.acao === "voltar") {
      estado.abandonarRodada();
      return;
    }

    const { berrys, baus, bausPerdidos } = estado.guardarRecompensa();
    avisoEl.textContent =
      `Guardou ${descreverRecompensa({ berrys, baus })}.` +
      (bausPerdidos > 0
        ? ` ${bausPerdidos} baú(s) não couberam no limite e se perderam.`
        : "");
  });

  renderQuiz();
}
