/* Utilitários compartilhados entre as telas.
   Extraídos do antigo jogo.js para que Busca, Loja e Perfil reusem
   as mesmas garantias (escape de HTML, guarda de DOM, animação). */

/** Lança se o elemento não existir — evita falha silenciosa em cascata. */
export function exige(id, el) {
  if (!el) throw new Error(`Elemento com id "${id}" não encontrado no DOM.`);
  return el;
}

/** Atalho: busca por id já validando a existência. */
export function pegar(id) {
  return exige(id, document.getElementById(id));
}

/** Escapa HTML. Obrigatório: as listas são montadas via innerHTML. */
export function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m])
  );
}

export function preload(src) {
  const im = new Image();
  im.decoding = "async";
  im.loading = "eager";
  im.src = src;
}

export function prefersReducedMotion() {
  if (document.documentElement.dataset.animacoes === "off") return true;
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

/** Reinicia uma animação CSS forçando reflow entre remover e aplicar. */
export function restartAnimation(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

/** Formata Berrys com separador de milhar e 2 casas. */
export function formatarBerrys(valor) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Markup de um slot — a célula usada por Mochila, Busca e Perfil.
 * Estilizado em css/mochila.css.
 *
 * @param {object|null} item  fruta a exibir; null renderiza slot vazio
 * @param {object} opcoes
 * @param {number} [opcoes.idx]      índice para o clique abrir o modal
 * @param {boolean} [opcoes.obtida]  false esmaece (catálogo não coletado)
 * @param {string}  [opcoes.rotuloVazio]
 */
export function slotHTML(item, { idx, obtida = true, rotuloVazio = "Vazio" } = {}) {
  if (!item) {
    return `<li class="slot vazio">
      <div class="pad"></div>
      <div class="label">${esc(rotuloVazio)}</div>
    </li>`;
  }
  const attrIdx = idx === undefined ? "" : ` data-idx="${idx}"`;
  const classe = obtida ? "slot" : "slot nao-obtida";
  return `<li class="${classe}"${attrIdx}>
    <div class="pad">
      <img src="${esc(item.img)}" alt="${esc(item.nome)}" loading="lazy" decoding="async">
    </div>
    <div class="label">${esc(item.nome)}</div>
  </li>`;
}

/** Barra de progresso line-art: retângulo com borda, preenchimento preto. */
export function barraProgressoHTML(rotulo, atual, total) {
  const pct = total > 0 ? Math.round((atual / total) * 100) : 0;
  return `<div class="progresso-linha">
    <div class="progresso-topo">
      <span class="progresso-rotulo">${esc(rotulo)}</span>
      <span class="progresso-valor">${atual}/${total}</span>
    </div>
    <div class="progresso-trilho" role="progressbar"
         aria-valuenow="${atual}" aria-valuemin="0" aria-valuemax="${total}"
         aria-label="${esc(rotulo)}">
      <div class="progresso-preenchimento" style="inline-size: ${pct}%"></div>
    </div>
  </div>`;
}
