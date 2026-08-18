/* Busca — filtra o catálogo completo por nome, categoria e subtipo,
   marcando quais itens já foram coletados.

   Filtro em dois níveis: a categoria está sempre visível; os subtipos só
   aparecem depois que uma categoria é escolhida, senão seriam 17 chips. */

import { pegar, esc, slotHTML, ligarFallbackImagens } from "../util.js";
import * as estado from "../estado.js";
import { abrirItem } from "../modalItem.js";

let campo;
let chipsCategoriaEl;
let chipsTipoEl;
let resultadosEl;
let vazioEl;
let resumoEl;

let termo = "";
let categoriaAtiva = null; // null = todas
let tipoAtivo = null; // null = todos
let visiveis = [];

function normalizar(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // sem acentos: "fenix" acha "Fênix"
}

function filtrar() {
  const alvo = normalizar(termo.trim());
  return estado.catalogo().filter((item) => {
    if (categoriaAtiva && item.categoria !== categoriaAtiva) return false;
    if (tipoAtivo && item.tipo !== tipoAtivo) return false;
    if (!alvo) return true;
    return normalizar(item.nome).includes(alvo);
  });
}

function chipHTML(rotulo, total, ativo, attr, valor) {
  return `<li>
    <button class="chip${ativo ? " ativo" : ""}" type="button"
      ${attr}="${valor === null ? "" : esc(valor)}"
      aria-pressed="${ativo}">${esc(rotulo)} (${total})</button>
  </li>`;
}

function renderChips() {
  const totalCat = estado.totalPorCategoria();
  const totalTipo = estado.totalPorTipo();

  chipsCategoriaEl.innerHTML = [
    chipHTML(
      "Tudo",
      estado.catalogo().length,
      categoriaAtiva === null,
      "data-categoria",
      null
    ),
    ...estado
      .categorias()
      .map((c) =>
        chipHTML(c, totalCat[c], c === categoriaAtiva, "data-categoria", c)
      ),
  ].join("");

  // Segundo nível: só existe quando há uma categoria escolhida.
  if (!categoriaAtiva) {
    chipsTipoEl.innerHTML = "";
    chipsTipoEl.hidden = true;
    return;
  }

  chipsTipoEl.hidden = false;
  chipsTipoEl.innerHTML = [
    chipHTML(
      "Todos os tipos",
      totalCat[categoriaAtiva],
      tipoAtivo === null,
      "data-tipo",
      null
    ),
    ...estado
      .tiposDe(categoriaAtiva)
      .map((t) => chipHTML(t, totalTipo[t], t === tipoAtivo, "data-tipo", t)),
  ].join("");
}

export function renderBusca() {
  renderChips();

  visiveis = filtrar();
  const obtidos = estado.nomesObtidos();

  resultadosEl.innerHTML = visiveis
    .map((item, i) => slotHTML(item, { idx: i, obtida: obtidos.has(item.nome) }))
    .join("");
  ligarFallbackImagens(resultadosEl);

  const temResultado = visiveis.length > 0;
  vazioEl.hidden = temResultado;
  resultadosEl.hidden = !temResultado;

  const coletados = visiveis.filter((i) => obtidos.has(i.nome)).length;
  resumoEl.textContent = temResultado
    ? `${visiveis.length} ${
        visiveis.length === 1 ? "item" : "itens"
      } · ${coletados} na mochila`
    : "";
}

export function iniciarBusca() {
  campo = pegar("busca-campo");
  chipsCategoriaEl = pegar("busca-chips-categoria");
  chipsTipoEl = pegar("busca-chips-tipo");
  resultadosEl = pegar("busca-resultados");
  vazioEl = pegar("busca-vazio");
  resumoEl = pegar("busca-resumo");

  campo.addEventListener("input", () => {
    termo = campo.value;
    renderBusca();
  });

  chipsCategoriaEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-categoria]");
    if (!btn) return;
    categoriaAtiva = btn.dataset.categoria === "" ? null : btn.dataset.categoria;
    tipoAtivo = null; // trocar de categoria zera o subtipo, que não vale mais
    renderBusca();
  });

  chipsTipoEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tipo]");
    if (!btn) return;
    tipoAtivo = btn.dataset.tipo === "" ? null : btn.dataset.tipo;
    renderBusca();
  });

  // Índice é posicional na lista filtrada, por isso resolve contra `visiveis`.
  resultadosEl.addEventListener("click", (e) => {
    const li = e.target.closest("li.slot");
    if (!li || li.dataset.idx === undefined) return;
    const item = visiveis[Number(li.dataset.idx)];
    if (item) abrirItem(item);
  });

  renderBusca();
}
