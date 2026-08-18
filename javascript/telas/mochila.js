/* Mochila — o mesmo componente montado em dois pontos:
   a tela cheia (mobile e desktop) e o painel lateral do desktop.
   Ambos leem o estado compartilhado, então ficam sincronizados sozinhos. */

import { pegar, slotHTML, ligarFallbackImagens } from "../util.js";
import * as estado from "../estado.js";
import { ligarGradeAoModal } from "../modalItem.js";

const MIN_SLOTS = 12;

let gradeTela;
let gradeLateral;

function montar(grade) {
  const { mochila } = estado.obter();
  const total = Math.max(MIN_SLOTS, Math.ceil(mochila.length / 4) * 4);
  const partes = [];
  for (let i = 0; i < total; i++) {
    partes.push(mochila[i] ? slotHTML(mochila[i], { idx: i }) : slotHTML(null));
  }
  grade.innerHTML = partes.join("");
  ligarFallbackImagens(grade);
}

export function renderMochila() {
  montar(gradeTela);
  montar(gradeLateral);
}

export function iniciarMochila() {
  gradeTela = pegar("mochila-itens");
  gradeLateral = pegar("mochila-lateral-itens");

  const resolver = (idx) => estado.obter().mochila[idx];
  ligarGradeAoModal(gradeTela, resolver);
  ligarGradeAoModal(gradeLateral, resolver);

  renderMochila();
}
