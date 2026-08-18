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
  const distintos = estado.nomesObtidos().size;
  const totalCatalogo = estado.catalogo().length;

  listaEstatisticas.innerHTML = [
    estatisticaHTML("Itens distintos", `${distintos}/${totalCatalogo}`),
    estatisticaHTML("Itens na mochila", st.mochila.length),
    estatisticaHTML("Baús abertos", st.bausAbertos),
    estatisticaHTML("Berrys", formatarBerrys(st.berrys)),
  ].join("");

  // Uma barra por categoria; os subtipos ficam dentro de um <details> para
  // não virar uma parede de barras agora que são 17 tipos.
  const obtidasCat = estado.obtidasPorCategoria();
  const totalCat = estado.totalPorCategoria();
  const obtidasTipo = estado.obtidasPorTipo();
  const totalTipo = estado.totalPorTipo();

  containerBarras.innerHTML = estado
    .categorias()
    .map((cat) => {
      const subtipos = estado
        .tiposDe(cat)
        .map((t) => barraProgressoHTML(t, obtidasTipo[t] ?? 0, totalTipo[t]))
        .join("");

      return `<section class="grupo-progresso">
        ${barraProgressoHTML(cat, obtidasCat[cat] ?? 0, totalCat[cat])}
        <details class="detalhe-subtipos">
          <summary>Ver por tipo</summary>
          <div class="subtipos">${subtipos}</div>
        </details>
      </section>`;
    })
    .join("");
}

export function iniciarPerfil() {
  listaEstatisticas = pegar("perfil-estatisticas");
  containerBarras = pegar("perfil-barras");
  renderPerfil();
}
