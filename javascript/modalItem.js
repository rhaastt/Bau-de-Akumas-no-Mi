/* Modal de detalhe da fruta — compartilhado por Mochila, Busca e a mochila
   lateral do desktop. Fecha por botão, clique fora e Escape. */

import { pegar } from "./util.js";

let modal;
let card;
let img;
let nome;
let tipo;
let descricao;

export function abrirItem(item) {
  img.src = item.img;
  img.alt = item.nome;
  nome.textContent = item.nome;
  tipo.textContent = item.tipo;
  descricao.textContent = item.desc;
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

export function fecharItem() {
  if (!modal.classList.contains("active")) return;
  modal.classList.add("closing");

  const finalizar = () => {
    modal.classList.remove("active", "closing");
    document.body.style.overflow = "";
  };

  // animationend é o caminho normal; o timeout cobre o caso de a animação
  // não disparar (animações desligadas), evitando modal preso em "closing".
  let concluido = false;
  const uma = () => {
    if (concluido) return;
    concluido = true;
    finalizar();
  };
  card.addEventListener("animationend", uma, { once: true });
  setTimeout(uma, 400);
}

export function iniciarModal() {
  modal = pegar("inventarioItem");
  card = pegar("inventarioItemCard");
  img = pegar("inventarioItemImg");
  nome = pegar("inventarioItemNome");
  tipo = pegar("inventarioItemTipo");
  descricao = pegar("inventarioItemDescricao");

  pegar("btnFecharCardItemIventario").addEventListener("click", fecharItem);

  modal.addEventListener("click", (e) => {
    if (!card.contains(e.target)) fecharItem();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) fecharItem();
  });
}

/**
 * Delegação de clique numa grade de slots.
 * @param {HTMLElement} lista  o <ul> da grade
 * @param {(idx:number)=>object|undefined} resolver  índice -> item
 */
export function ligarGradeAoModal(lista, resolver) {
  lista.addEventListener("click", (e) => {
    const li = e.target.closest("li.slot");
    if (!li || li.dataset.idx === undefined) return;
    const item = resolver(Number(li.dataset.idx));
    if (item) abrirItem(item);
  });
}
