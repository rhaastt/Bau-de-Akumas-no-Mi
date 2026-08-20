/* Troca de telas na mesma página.
 *
 * Nasceu de "sem persistência", quando navegar de verdade zerava o estado.
 * O save existe agora, mas a página única fica: a troca é instantânea e não
 * há recarga entre telas para o estado atravessar.
 */

const TITULOS = {
  quiz: "DESAFIO",
  bau: "BAÚ",
  mochila: "MOCHILA",
  perfil: "PERFIL",
  loja: "LOJA",
  config: "AJUSTES",
  busca: "BUSCA",
};

const ouvintes = new Set();
let telaAtual = "bau";

/** Notificada a cada troca — telas usam para redesenhar ao ficarem visíveis. */
export function aoTrocarTela(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export function telaVisivel() {
  return telaAtual;
}

export function irPara(nome) {
  const alvo = document.getElementById(`tela-${nome}`);
  if (!alvo) return;

  for (const secao of document.querySelectorAll(".tela")) {
    secao.hidden = secao !== alvo;
  }

  const titulo = document.getElementById("titulo-tela");
  if (titulo) titulo.textContent = TITULOS[nome] ?? nome.toUpperCase();

  // Estado ativo: só os itens do rail/nav marcam página atual.
  for (const btn of document.querySelectorAll(".nav-item[data-tela]")) {
    const ativo = btn.dataset.tela === nome;
    btn.classList.toggle("ativo", ativo);
    if (ativo) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  }

  telaAtual = nome;
  window.scrollTo({ top: 0, behavior: "instant" });
  for (const fn of ouvintes) fn(nome);
}

/** Liga todo elemento com [data-tela] à navegação. */
export function iniciarNavegacao() {
  for (const el of document.querySelectorAll("[data-tela]")) {
    el.addEventListener("click", () => irPara(el.dataset.tela));
  }
  // O Desafio é a tela principal: é onde o jogo começa.
  irPara("quiz");
}
