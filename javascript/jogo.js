/* Ponto de entrada: carrega o catálogo, monta as telas, liga a navegação e
   mantém tudo sincronizado com o estado compartilhado. */

import { pegar, formatarBerrys } from "./util.js";
import * as estado from "./estado.js";
import { carregarCatalogo } from "./dados.js";
import { iniciarNavegacao } from "./navegacao.js";
import { iniciarModal } from "./modalItem.js";

import { iniciarBau, renderBau } from "./telas/bau.js";
import { iniciarMochila, renderMochila } from "./telas/mochila.js";
import { iniciarPerfil, renderPerfil } from "./telas/perfil.js";
import { iniciarLoja, renderLoja } from "./telas/loja.js";
import { iniciarConfig, renderConfig } from "./telas/config.js";
import { iniciarBusca, renderBusca } from "./telas/busca.js";

function mostrarFalha(erro) {
  console.error(erro);
  const area = document.querySelector(".area-conteudo");
  if (!area) return;
  area.innerHTML = `<div class="painel">
    <h2 class="titulo-painel">Não foi possível carregar os itens</h2>
    <p class="texto-apoio">Verifique se a pasta <strong>dados/</strong> está
    acessível e recarregue a página.</p>
  </div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  // O catálogo vem de dados/*.json, então a inicialização espera o fetch
  // antes de montar qualquer tela.
  try {
    estado.definirCatalogo(await carregarCatalogo());
  } catch (erro) {
    mostrarFalha(erro);
    return;
  }

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
