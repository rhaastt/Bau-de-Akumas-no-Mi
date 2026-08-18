/* Tela do Baú — abrir, sortear e animar o drop. */

import { pegar, preload } from "../util.js";
import * as estado from "../estado.js";
import { irPara } from "../navegacao.js";

const ANIM_MS = 380;
const VISIBLE_MS = 1400;

let btnAbrirBau;
let contBau;
let qtdAtualEl;
let qtdTotalEl;
let dropItemEl;
let dropImgEl;
let dropLegendEl;

let aberto = false;
let busy = false;
let dropTimeoutId = null;

function sortearItem() {
  const i = Math.floor(Math.random() * estado.catalogo.length);
  return estado.catalogo[i];
}

function atualizarBotao() {
  const { atual } = estado.obter().baus;
  if (atual === 0 && !aberto) {
    btnAbrirBau.disabled = true;
    btnAbrirBau.textContent = "SEM BAÚS";
    return;
  }
  btnAbrirBau.textContent = aberto ? "ABRIR OUTRO" : "ABRIR BAÚ";
  btnAbrirBau.disabled = busy || (!aberto && atual <= 0);
}

function dropItem() {
  const item = sortearItem();
  estado.adicionarItem(item);

  dropImgEl.src = item.img;
  dropImgEl.alt = item.nome;
  dropLegendEl.textContent = item.nome;

  dropItemEl.classList.remove("show");
  void dropItemEl.offsetWidth; // força reflow para reiniciar a animação
  dropItemEl.classList.remove("hidden");
  dropItemEl.classList.add("show");

  clearTimeout(dropTimeoutId);
  dropTimeoutId = setTimeout(() => {
    dropItemEl.classList.remove("show");
    dropItemEl.classList.add("hidden");
  }, VISIBLE_MS);

  if (estado.obter().config.irParaMochilaAoGanhar) {
    irPara("mochila");
  }
}

/** Redesenha o que a tela do Baú mostra a partir do estado. */
export function renderBau() {
  const { baus } = estado.obter();
  qtdAtualEl.textContent = baus.atual;
  qtdTotalEl.textContent = baus.total;
  atualizarBotao();
}

export function iniciarBau() {
  btnAbrirBau = pegar("btn-bau");
  contBau = pegar("container-bau");
  qtdAtualEl = pegar("qtd-atual");
  qtdTotalEl = pegar("qtd-limite");
  dropItemEl = pegar("dropItem");
  dropImgEl = pegar("dropImg");
  dropLegendEl = pegar("dropLegend");

  preload("imagens/bau-fechado.webp");
  preload("imagens/bau-aberto.webp");
  // Todas as frutas compartilham a mesma imagem hoje; o Set evita 109 requisições.
  for (const src of new Set(estado.catalogo.map((f) => f.img))) preload(src);

  btnAbrirBau.addEventListener("click", () => {
    if (busy) return;

    const temBau = estado.obter().baus.atual > 0;
    if (!aberto && !temBau) {
      atualizarBotao();
      return;
    }

    busy = true;
    atualizarBotao();

    if (!aberto) estado.consumirBau();

    aberto = !aberto;
    contBau.classList.toggle("open", aberto);
    atualizarBotao();

    if (aberto) setTimeout(dropItem, ANIM_MS);

    setTimeout(() => {
      busy = false;
      atualizarBotao();
    }, ANIM_MS);
  });

  // Resetar progresso fecha o baú junto, senão a arte fica aberta sem contexto.
  estado.assinar(() => {
    if (estado.obter().bausAbertos === 0 && aberto) {
      aberto = false;
      contBau.classList.remove("open");
    }
  });

  renderBau();
}
