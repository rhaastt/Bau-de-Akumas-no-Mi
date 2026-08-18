/* Responsividade, layout desktop e acessibilidade. */

import { criarColetor, vigiar } from "../auxiliar.js";

export const nome = "Layout e acessibilidade";

export async function executar({ navegador, url }) {
  const { check, resultados } = criarColetor(nome);

  // --- Mobile ---
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const { erros, respostasRuins } = vigiar(page);
  await page.goto(url);
  await page.waitForTimeout(900);

  await page.click("#btn-buscar");
  await page.waitForTimeout(350);
  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.waitForTimeout(400);
  const nav = await page.evaluate(() => {
    const n = document.querySelector(".nav-principal");
    const r = n.getBoundingClientRect();
    return {
      posicao: getComputedStyle(n).position,
      visivel: r.bottom <= window.innerHeight + 2 && r.top < window.innerHeight,
      scroll: window.scrollY,
    };
  });
  check(
    "nav continua visível ao rolar (mobile)",
    nav.posicao === "fixed" && nav.visivel && nav.scroll > 100,
    JSON.stringify(nav)
  );

  const toques = await page.$$eval(".nav-item", (els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return Math.min(r.width, r.height);
    })
  );
  check(
    "alvos de toque com pelo menos 48px",
    toques.every((t) => t >= 48),
    `menor=${Math.min(...toques).toFixed(1)}px`
  );

  const folga = await page.evaluate(() => ({
    padding: parseFloat(getComputedStyle(document.body).paddingBlockEnd),
    altura: document.querySelector(".nav-principal").getBoundingClientRect().height,
  }));
  check(
    "padding do body evita conteúdo sob a nav",
    folga.padding >= folga.altura,
    `padding=${folga.padding.toFixed(0)}px nav=${folga.altura.toFixed(0)}px`
  );

  for (const largura of [320, 390, 768]) {
    await page.setViewportSize({ width: largura, height: 844 });
    await page.waitForTimeout(300);
    check(
      `sem rolagem horizontal em ${largura}px`,
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    );
  }
  await ctx.close();

  // --- Desktop ---
  const ctx2 = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await ctx2.newPage();
  const vig2 = vigiar(page2);
  await page2.goto(url);
  await page2.waitForTimeout(900);

  const layout = await page2.evaluate(() => {
    const nav = document.querySelector(".nav-principal");
    const rNav = nav.getBoundingClientRect();
    const rConteudo = document.querySelector(".area-conteudo").getBoundingClientRect();
    const lateral = document.querySelector(".mochila-lateral");
    const rLateral = lateral.getBoundingClientRect();
    const rPrincipal = document.querySelector(".bau-principal").getBoundingClientRect();
    return {
      posicao: getComputedStyle(nav).position,
      aEsquerda: rNav.right <= rConteudo.left + 2,
      vertical: rNav.height > rNav.width,
      lateralVisivel: getComputedStyle(lateral).display !== "none",
      duasColunas: rLateral.left >= rPrincipal.right - 2,
      quantasNavs: document.querySelectorAll(".nav-itens").length,
    };
  });
  check("rail fica à esquerda do conteúdo", layout.aEsquerda, JSON.stringify(layout));
  check("rail é vertical", layout.vertical);
  check("nav vira sticky, não fixa no rodapé", layout.posicao === "sticky", layout.posicao);
  check("uma só <nav> no DOM (sem duplicar marcação)", layout.quantasNavs === 1);
  check("mochila lateral visível", layout.lateralVisivel);
  check("baú e mochila em duas colunas", layout.duasColunas);

  await page2.click("#btn-bau");
  await page2.waitForTimeout(1000);
  const lateral = await page2.$$eval("#mochila-lateral-itens li.slot[data-idx]", (e) => e.length);
  await page2.click('.nav-item[data-tela="mochila"]');
  await page2.waitForTimeout(350);
  const tela = await page2.$$eval("#mochila-itens li.slot[data-idx]", (e) => e.length);
  check(
    "mochila lateral e tela ficam sincronizadas",
    lateral === 1 && tela === 1,
    `lateral=${lateral} tela=${tela}`
  );

  for (const largura of [1024, 1440]) {
    await page2.setViewportSize({ width: largura, height: 900 });
    await page2.waitForTimeout(300);
    check(
      `sem rolagem horizontal em ${largura}px`,
      await page2.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    );
  }
  await ctx2.close();

  // --- Movimento reduzido e teclado ---
  const ctx3 = await navegador.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page3 = await ctx3.newPage();
  const vig3 = vigiar(page3);
  await page3.goto(url);
  await page3.waitForTimeout(800);
  await page3.click("#btn-bau");
  await page3.waitForTimeout(900);
  await page3.click('.nav-item[data-tela="mochila"]');
  await page3.waitForTimeout(350);
  await page3.click("#mochila-itens li.slot[data-idx]");
  await page3.waitForTimeout(350);
  check(
    "[movimento reduzido] modal abre",
    await page3.$eval("#inventarioItem", (e) => e.classList.contains("active"))
  );
  await page3.click("#btnFecharCardItemIventario");
  await page3.waitForTimeout(700);
  check(
    "[movimento reduzido] modal fecha",
    await page3.$eval("#inventarioItem", (e) => !e.classList.contains("active"))
  );

  await page3.keyboard.press("Tab");
  await page3.keyboard.press("Tab");
  const foco = await page3.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return null;
    return { tag: a.tagName, contorno: getComputedStyle(a).outlineStyle };
  });
  check("foco visível ao navegar por teclado", foco !== null, JSON.stringify(foco));
  await ctx3.close();

  const todosErros = [...erros, ...vig2.erros, ...vig3.erros];
  const todas404 = [...respostasRuins, ...vig2.respostasRuins, ...vig3.respostasRuins];
  check("sem erro de JS", todosErros.length === 0, todosErros.slice(0, 2).join(" | "));
  check("sem resposta 4xx/5xx", todas404.length === 0, todas404.slice(0, 2).join(" | "));

  return resultados;
}
