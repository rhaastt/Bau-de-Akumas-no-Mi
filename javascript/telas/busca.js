/* Busca — filtra o catálogo completo (109 frutas) por nome e tipo,
   marcando quais já foram coletadas. */

import { pegar, esc, slotHTML } from "../util.js";
import * as estado from "../estado.js";
import { abrirItem } from "../modalItem.js";

let campo;
let chipsEl;
let resultadosEl;
let vazioEl;
let resumoEl;

let termo = "";
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
  return estado.catalogo.filter((f) => {
    if (tipoAtivo && f.tipo !== tipoAtivo) return false;
    if (!alvo) return true;
    return normalizar(f.nome).includes(alvo);
  });
}

function renderChips() {
  const opcoes = [{ rotulo: "Todos", valor: null }].concat(
    estado.tipos.map((t) => ({ rotulo: t, valor: t }))
  );

  chipsEl.innerHTML = opcoes
    .map((o) => {
      const ativo = o.valor === tipoAtivo;
      const total = o.valor ? estado.totalPorTipo[o.valor] : estado.catalogo.length;
      return `<li>
        <button class="chip${ativo ? " ativo" : ""}" type="button"
          data-tipo="${o.valor === null ? "" : esc(o.valor)}"
          aria-pressed="${ativo}">${esc(o.rotulo)} (${total})</button>
      </li>`;
    })
    .join("");
}

export function renderBusca() {
  renderChips();

  visiveis = filtrar();
  const obtidos = estado.nomesObtidos();

  resultadosEl.innerHTML = visiveis
    .map((f, i) => slotHTML(f, { idx: i, obtida: obtidos.has(f.nome) }))
    .join("");

  const temResultado = visiveis.length > 0;
  vazioEl.hidden = temResultado;
  resultadosEl.hidden = !temResultado;

  const coletadas = visiveis.filter((f) => obtidos.has(f.nome)).length;
  resumoEl.textContent = temResultado
    ? `${visiveis.length} ${
        visiveis.length === 1 ? "fruta" : "frutas"
      } · ${coletadas} na mochila`
    : "";
}

export function iniciarBusca() {
  campo = pegar("busca-campo");
  chipsEl = pegar("busca-chips");
  resultadosEl = pegar("busca-resultados");
  vazioEl = pegar("busca-vazio");
  resumoEl = pegar("busca-resumo");

  campo.addEventListener("input", () => {
    termo = campo.value;
    renderBusca();
  });

  chipsEl.addEventListener("click", (e) => {
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
