/* Perfil — estatísticas derivadas do estado, nada codificado à mão. */

import { pegar, esc, barraProgressoHTML, formatarBerrys } from "../util.js";
import * as estado from "../estado.js";

let listaEstatisticas;
let containerBarras;

function estatisticaHTML(rotulo, valor) {
  return `<li class="estatistica">
    <span class="estatistica-valor">${esc(valor)}</span>
    <span class="estatistica-rotulo">${esc(rotulo)}</span>
  </li>`;
}

export function renderPerfil() {
  const st = estado.obter();
  const distintas = estado.nomesObtidos().size;
  const totalCatalogo = estado.catalogo.length;

  listaEstatisticas.innerHTML = [
    estatisticaHTML("Frutas distintas", `${distintas}/${totalCatalogo}`),
    estatisticaHTML("Itens na mochila", st.mochila.length),
    estatisticaHTML("Baús abertos", st.bausAbertos),
    estatisticaHTML("Berrys", formatarBerrys(st.berrys)),
  ].join("");

  const obtidas = estado.obtidasPorTipo();
  containerBarras.innerHTML = estado.tipos
    .map((tipo) =>
      barraProgressoHTML(tipo, obtidas[tipo] ?? 0, estado.totalPorTipo[tipo])
    )
    .join("");
}

export function iniciarPerfil() {
  listaEstatisticas = pegar("perfil-estatisticas");
  containerBarras = pegar("perfil-barras");
  renderPerfil();
}
