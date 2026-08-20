/* Mochila — o mesmo componente montado em dois pontos:
   a tela cheia (mobile e desktop) e o painel lateral do desktop.
   Ambos leem o estado compartilhado, então ficam sincronizados sozinhos. */

import { pegar, slotHTML, ligarFallbackImagens, formatarBerrys } from "../util.js";
import * as estado from "../estado.js";
import { ligarGradeAoModal } from "../modalItem.js";
import { VALOR_VENDA } from "../raridade.js";

const MIN_SLOTS = 12;

let gradeTela;
let gradeLateral;
let btnVenderTudo;
let avisoEl;

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

  const quantas = estado.duplicatasNaMochila().length;
  const total = estado.valorDasDuplicatas();
  btnVenderTudo.hidden = quantas === 0;
  btnVenderTudo.textContent = `VENDER ${quantas} ${
    quantas === 1 ? "DUPLICATA" : "DUPLICATAS"
  } · +${formatarBerrys(total)}`;
}

/** Todo slot preenchido pode ser vendido; a última cópia pede confirmação. */
function dadosDoSlot(idx) {
  const item = estado.obter().mochila[idx];
  if (!item) return undefined;

  const ultima = !estado.ehDuplicata(idx);
  return {
    item,
    venda: {
      valor: VALOR_VENDA[item.raridade] ?? 0,
      ultima,
      vender: () => {
        const recebido = estado.venderItem(idx);
        avisoEl.textContent = ultima
          ? `${item.nome} vendida por ${formatarBerrys(
              recebido
            )} Berrys — saiu da coleção.`
          : `${item.nome} vendida por ${formatarBerrys(recebido)} Berrys.`;
      },
    },
  };
}

export function iniciarMochila() {
  gradeTela = pegar("mochila-itens");
  gradeLateral = pegar("mochila-lateral-itens");
  btnVenderTudo = pegar("btn-vender-duplicatas");
  avisoEl = pegar("mochila-aviso");

  ligarGradeAoModal(gradeTela, dadosDoSlot);
  ligarGradeAoModal(gradeLateral, dadosDoSlot);

  btnVenderTudo.addEventListener("click", () => {
    const { quantidade, total } = estado.venderDuplicatas();
    if (quantidade === 0) return;
    avisoEl.textContent = `${quantidade} ${
      quantidade === 1 ? "duplicata vendida" : "duplicatas vendidas"
    } por ${formatarBerrys(total)} Berrys.`;
  });

  renderMochila();
}
