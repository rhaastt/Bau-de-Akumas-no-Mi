/* Tela do Baú — abrir, sortear e animar o drop. */

import { pegar, preload, prefersReducedMotion } from "../util.js";
import * as estado from "../estado.js";
import { irPara } from "../navegacao.js";
import { sortearPorRaridade } from "../raridade.js";

const ANIM_MS = 380;

/**
 * Tempo do drop na tela, por raridade.
 *
 * Antes era 1400 para todo mundo: um Lendário de 3% aparecia exatamente igual
 * a um Comum de 50%. A raridade existia no dado e na cor, mas não no peso da
 * revelação — quem tirou o item raro não tinha como sentir isso.
 */
const TEMPO_POR_RARIDADE = {
  Comum: 1400,
  Incomum: 1400,
  Raro: 2000,
  Épico: 2600,
  Lendário: 3400,
};

/** As duas raridades que ganham tratamento de destaque, como nos slots. */
const DESTAQUE = new Set(["Épico", "Lendário"]);

/** Exposto para o teste esperar pela raridade sorteada, e não por um número fixo. */
export function tempoDoDrop(raridade) {
  // Movimento reduzido: sem alongar a permanência, que também é animação.
  if (prefersReducedMotion()) return TEMPO_POR_RARIDADE.Comum;
  return TEMPO_POR_RARIDADE[raridade] ?? TEMPO_POR_RARIDADE.Comum;
}

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

/** Sorteio ponderado por raridade sobre o catálogo inteiro. */
function sortearItem() {
  return sortearPorRaridade(estado.catalogo());
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
  // Item inédito paga na hora; duplicata rende quando o jogador vende.
  const bonus = estado.adicionarItem(item);

  const destaque = DESTAQUE.has(item.raridade);

  dropImgEl.src = item.img;
  dropImgEl.alt = item.nome;
  // Nas duas raridades de destaque a legenda diz o nome da raridade por
  // escrito: o realce não pode existir só na cor e no tempo.
  const partes = [destaque ? `${item.raridade} · ${item.nome}` : item.nome];
  if (bonus > 0) partes.push(`+${bonus}`);
  dropLegendEl.textContent = partes.join(" · ");
  // A cor da raridade tinge a legenda e a borda da imagem do drop.
  dropItemEl.dataset.raridade = item.raridade ?? "";
  dropItemEl.classList.toggle("destaque", destaque);

  dropItemEl.classList.remove("show");
  void dropItemEl.offsetWidth; // força reflow para reiniciar a animação
  dropItemEl.classList.remove("hidden");
  dropItemEl.classList.add("show");

  clearTimeout(dropTimeoutId);
  dropTimeoutId = setTimeout(() => {
    dropItemEl.classList.remove("show");
    dropItemEl.classList.add("hidden");
  }, tempoDoDrop(item.raridade));

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

  // O overlay de drop não é um .slot, então precisa do próprio fallback:
  // sem isso, um item cuja imagem ainda não existe mostra ícone quebrado.
  dropImgEl.addEventListener("error", () =>
    dropItemEl.classList.add("sem-imagem")
  );
  dropImgEl.addEventListener("load", () =>
    dropItemEl.classList.remove("sem-imagem")
  );

  preload("imagens/bau-fechado.webp");
  preload("imagens/bau-aberto.webp");
  // As 109 frutas compartilham a mesma imagem; o Set evita repetir requisições.
  for (const src of new Set(estado.catalogo().map((i) => i.img))) preload(src);

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
