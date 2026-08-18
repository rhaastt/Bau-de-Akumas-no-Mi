/* Ponto de entrada: monta as telas, liga a navegação e mantém tudo
   sincronizado com o estado compartilhado. */

import { pegar, formatarBerrys } from "./util.js";
import * as estado from "./estado.js";
import { iniciarNavegacao } from "./navegacao.js";
import { iniciarModal } from "./modalItem.js";

import { iniciarBau, renderBau } from "./telas/bau.js";
import { iniciarMochila, renderMochila } from "./telas/mochila.js";
import { iniciarPerfil, renderPerfil } from "./telas/perfil.js";
import { iniciarLoja, renderLoja } from "./telas/loja.js";
import { iniciarConfig, renderConfig } from "./telas/config.js";
import { iniciarBusca, renderBusca } from "./telas/busca.js";

document.addEventListener("DOMContentLoaded", () => {
  const berrysEl = pegar("qtd-berrys");

  iniciarModal();

  iniciarBau();
  iniciarMochila();
  iniciarPerfil();
  iniciarLoja();
  iniciarConfig();
  iniciarBusca();

  function renderTudo() {
    berrysEl.textContent = formatarBerrys(estado.obter().berrys);
    renderBau();
    renderMochila();
    renderPerfil();
    renderLoja();
    renderConfig();
    renderBusca();
  }

  // Uma assinatura só: qualquer mudança de estado redesenha as telas.
  // São poucos elementos e nenhuma tela é grande o bastante para justificar
  // redesenho seletivo.
  estado.assinar(renderTudo);

  iniciarNavegacao();
  renderTudo();
});
