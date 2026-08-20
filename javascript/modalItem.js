/* Modal de detalhe da fruta — compartilhado por Mochila, Busca e a mochila
   lateral do desktop. Fecha por botão, clique fora e Escape. */

import { pegar, formatarBerrys } from "./util.js";

let modal;
let card;
let img;
let nome;
let tipo;
let raridade;
let descricao;
let btnVender;
let vendaAtual = null;
let aguardandoConfirmacao = false;

/**
 * @param {object} item
 * @param {object} [opcoes]
 * @param {{valor:number, ultima:boolean, vender:()=>void}} [opcoes.venda]
 *   quando presente, mostra o botão de venda. O modal não conhece a regra de
 *   duplicata — quem abre decide se o item é vendável e se é a última cópia.
 *   Por isso a Busca, que usa o mesmo modal para itens do catálogo, não ganha
 *   botão nenhum.
 */
export function abrirItem(item, opcoes = {}) {
  img.src = item.img;
  img.alt = item.nome;
  nome.textContent = item.nome;
  tipo.textContent = item.tipo;
  descricao.textContent = item.desc;

  // O selo diz a raridade por escrito, não só pela cor — quem não distingue
  // as cores continua tendo a informação.
  raridade.textContent = item.raridade ?? "";
  raridade.hidden = !item.raridade;
  card.dataset.raridade = item.raridade ?? "";

  // Abrir um item sempre começa do zero: a confirmação pendente de um item
  // anterior nunca pode vazar para o próximo.
  vendaAtual = opcoes.venda ?? null;
  pintarVenda(false);

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

/** Desenha o botão de venda no estado normal ou no de confirmação. */
function pintarVenda(confirmando) {
  aguardandoConfirmacao = confirmando;
  btnVender.hidden = !vendaAtual;
  btnVender.classList.toggle("confirmando", confirmando);
  if (!vendaAtual) return;
  btnVender.textContent = confirmando
    ? "CONFIRMAR · ÚLTIMA CÓPIA"
    : `VENDER POR ${formatarBerrys(vendaAtual.valor)}`;
}

export function fecharItem() {
  if (!modal.classList.contains("active")) return;
  modal.classList.add("closing");

  const finalizar = () => {
    modal.classList.remove("active", "closing");
    document.body.style.overflow = "";
    // Fechar cancela qualquer confirmação pendente.
    vendaAtual = null;
    pintarVenda(false);
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
  raridade = pegar("inventarioItemRaridade");
  descricao = pegar("inventarioItemDescricao");
  btnVender = pegar("btnVenderItem");

  btnVender.addEventListener("click", () => {
    if (!vendaAtual) return;

    // Última cópia é irreversível e some da coleção: exige um segundo clique.
    if (vendaAtual.ultima && !aguardandoConfirmacao) {
      pintarVenda(true);
      return;
    }

    const vender = vendaAtual.vender;
    fecharItem();
    vender();
  });

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
 * @param {(idx:number)=>{item:object, venda?:object}|undefined} montar
 *   recebe o índice do slot e devolve o item e, opcionalmente, a venda
 */
export function ligarGradeAoModal(lista, montar) {
  lista.addEventListener("click", (e) => {
    const li = e.target.closest("li.slot");
    if (!li || li.dataset.idx === undefined) return;
    const dados = montar(Number(li.dataset.idx));
    if (dados?.item) abrirItem(dados.item, { venda: dados.venda });
  });
}
