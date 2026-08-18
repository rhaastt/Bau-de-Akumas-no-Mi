/* Configurações — só opções que controlam comportamento que existe de
   verdade no projeto. Nenhum toggle decorativo. */

import { pegar } from "../util.js";
import * as estado from "../estado.js";

let toggleAnimacoes;
let toggleIrMochila;
let avisoEl;

function pintarToggle(btn, ligado) {
  btn.setAttribute("aria-checked", String(ligado));
  btn.classList.toggle("ligado", ligado);
}

export function renderConfig() {
  const { config } = estado.obter();
  pintarToggle(toggleAnimacoes, config.animacoes);
  pintarToggle(toggleIrMochila, config.irParaMochilaAoGanhar);

  // O atributo no <html> desliga as animações pelo mesmo caminho que o
  // prefers-reduced-motion do reset.css já usa.
  document.documentElement.dataset.animacoes = config.animacoes ? "on" : "off";
}

export function iniciarConfig() {
  toggleAnimacoes = pegar("cfg-animacoes");
  toggleIrMochila = pegar("cfg-ir-mochila");
  avisoEl = pegar("config-aviso");

  toggleAnimacoes.addEventListener("click", () => {
    estado.definirConfig("animacoes", !estado.obter().config.animacoes);
  });

  toggleIrMochila.addEventListener("click", () => {
    estado.definirConfig(
      "irParaMochilaAoGanhar",
      !estado.obter().config.irParaMochilaAoGanhar
    );
  });

  pegar("btn-resetar").addEventListener("click", () => {
    estado.resetarProgresso();
    avisoEl.textContent = "Progresso resetado.";
  });

  renderConfig();
}
