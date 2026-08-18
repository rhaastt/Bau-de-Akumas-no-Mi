/* Loja — torna os Berrys funcionais: comprar debita saldo e credita baús. */

import { pegar, esc, formatarBerrys } from "../util.js";
import * as estado from "../estado.js";

const PACOTES = [
  { id: "p1", quantidade: 1, preco: 250, nome: "Baú avulso" },
  { id: "p5", quantidade: 5, preco: 1100, nome: "Pacote de 5" },
  { id: "p10", quantidade: 10, preco: 2000, nome: "Pacote de 10" },
];

let lista;
let avisoEl;
let limiteEl;

function motivoBloqueio(pacote, st) {
  if (pacote.preco > st.berrys) return "Berrys insuficientes";
  if (st.baus.atual + pacote.quantidade > st.baus.total) return "Limite de baús";
  return null;
}

export function renderLoja() {
  const st = estado.obter();
  limiteEl.textContent = st.baus.total;

  lista.innerHTML = PACOTES.map((p) => {
    const bloqueio = motivoBloqueio(p, st);
    return `<li class="pacote">
      <div class="pacote-info">
        <span class="pacote-nome">${esc(p.nome)}</span>
        <span class="pacote-detalhe">${p.quantidade} ${
      p.quantidade === 1 ? "baú" : "baús"
    } · ${formatarBerrys(p.preco)} Berrys</span>
      </div>
      <button class="btn btn-compacto" type="button" data-pacote="${p.id}"
        ${bloqueio ? "disabled" : ""}>${esc(bloqueio ?? "COMPRAR")}</button>
    </li>`;
  }).join("");
}

export function iniciarLoja() {
  lista = pegar("loja-pacotes");
  avisoEl = pegar("loja-aviso");
  limiteEl = pegar("loja-limite");

  lista.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-pacote]");
    if (!btn) return;
    const pacote = PACOTES.find((p) => p.id === btn.dataset.pacote);
    if (!pacote) return;

    const ok = estado.comprarBaus(pacote.quantidade, pacote.preco);
    avisoEl.textContent = ok
      ? `${pacote.nome} comprado.`
      : (motivoBloqueio(pacote, estado.obter()) ?? "Compra não realizada") + ".";
  });

  renderLoja();
}
