/* Navegação entre as telas, busca em dois níveis e perfil. */

import { criarColetor, vigiar, telasVisiveis } from "../auxiliar.js";

export const nome = "Telas";

const POR_TIPO_ARMA = {
  Katana: 9,
  Espada: 5,
  "Lâmina Negra": 2,
  Sabre: 2,
  Naginata: 1,
};

export async function executar({ navegador, url }) {
  const { check, resultados } = criarColetor(nome);
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const { erros, respostasRuins } = vigiar(page);

  await page.goto(url);
  await page.waitForTimeout(1000);

  // --- Navegação ---
  for (const [tela, titulo] of [
    ["perfil", "PERFIL"],
    ["mochila", "MOCHILA"],
    ["config", "AJUSTES"],
    ["bau", "BAÚ"],
  ]) {
    const sel = `.nav-item[data-tela="${tela}"]`;
    await page.click(sel);
    await page.waitForTimeout(250);
    const visiveis = await telasVisiveis(page);
    const t = await page.textContent("#titulo-tela");
    const atual = await page.$eval(sel, (e) => e.getAttribute("aria-current"));
    check(
      `navega para ${tela}`,
      visiveis.length === 1 && visiveis[0] === `tela-${tela}` && t === titulo && atual === "page",
      `${visiveis} · ${t} · aria-current=${atual}`
    );
  }

  await page.click("#container-carrinho");
  await page.waitForTimeout(250);
  check("carrinho abre a loja", (await telasVisiveis(page))[0] === "tela-loja");
  await page.click("#btn-buscar");
  await page.waitForTimeout(250);
  check("lupa abre a busca", (await telasVisiveis(page))[0] === "tela-busca");
  await page.click("#btn-avatar");
  await page.waitForTimeout(250);
  check("avatar abre o perfil", (await telasVisiveis(page))[0] === "tela-perfil");

  // --- Busca em dois níveis ---
  await page.click("#btn-buscar");
  await page.waitForTimeout(400);
  check(
    "busca lista o catálogo inteiro",
    (await page.$$eval("#busca-resultados li", (e) => e.length)) === 135
  );
  check(
    "chips de categoria: Tudo, Fruta e Arma",
    (await page.$$eval("#busca-chips-categoria button", (e) => e.length)) === 3
  );
  check("subtipos escondidos em 'Tudo'", await page.$eval("#busca-chips-tipo", (e) => e.hidden));

  await page.click('#busca-chips-categoria button[data-categoria="Arma"]');
  await page.waitForTimeout(400);
  check(
    "filtrar Arma reduz a 26",
    (await page.$$eval("#busca-resultados li", (e) => e.length)) === 26
  );
  const chipsTipo = await page.$$eval("#busca-chips-tipo button", (e) => e.map((x) => x.textContent));
  check("subtipos de arma aparecem", chipsTipo.length === 13, `n=${chipsTipo.length}`);
  check(
    "subtipos de fruta somem",
    !chipsTipo.some((c) => /Paramecia|Logia/.test(c))
  );

  for (const [tipo, esperado] of Object.entries(POR_TIPO_ARMA)) {
    await page.click(`#busca-chips-tipo button[data-tipo="${tipo}"]`);
    await page.waitForTimeout(300);
    const n = await page.$$eval("#busca-resultados li", (e) => e.length);
    check(`subtipo ${tipo} filtra ${esperado}`, n === esperado, `n=${n}`);
  }

  await page.click('#busca-chips-categoria button[data-categoria="Fruta"]');
  await page.waitForTimeout(400);
  check(
    "trocar de categoria zera o subtipo",
    (await page.$$eval("#busca-resultados li", (e) => e.length)) === 109
  );

  await page.click('#busca-chips-categoria button[data-categoria=""]');
  await page.waitForTimeout(300);
  await page.fill("#busca-campo", "fenix");
  await page.waitForTimeout(350);
  check(
    "busca ignora acento (fenix acha Fênix)",
    (await page.$$eval("#busca-resultados li", (e) => e.length)) === 1
  );

  await page.fill("#busca-campo", "zzzzz");
  await page.waitForTimeout(350);
  check("estado vazio aparece sem resultado", await page.$eval("#busca-vazio", (e) => !e.hidden));

  await page.fill("#busca-campo", "yoru");
  await page.waitForTimeout(350);
  await page.click("#busca-resultados li.slot");
  await page.waitForTimeout(400);
  const modal = await page.evaluate(() => ({
    ativo: document.getElementById("inventarioItem").classList.contains("active"),
    nome: document.getElementById("inventarioItemNome").textContent,
    tipo: document.getElementById("inventarioItemTipo").textContent,
  }));
  check(
    "modal reusado a partir da busca",
    modal.ativo && modal.nome === "Yoru" && modal.tipo === "Lâmina Negra",
    JSON.stringify(modal)
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  // --- Perfil ---
  await page.click('.nav-item[data-tela="perfil"]');
  await page.waitForTimeout(400);
  const perfil = await page.evaluate(() => ({
    grupos: document.querySelectorAll("#perfil-barras .grupo-progresso").length,
    detalhes: document.querySelectorAll("#perfil-barras details").length,
    barras: document.querySelectorAll("#perfil-barras .progresso-linha").length,
    texto: document.getElementById("perfil-barras").textContent.replace(/\s+/g, " "),
    estat: document.getElementById("perfil-estatisticas").textContent.replace(/\s+/g, " "),
  }));
  check("perfil agrupa por categoria", perfil.grupos === 2, `n=${perfil.grupos}`);
  check("subtipos dentro de <details>", perfil.detalhes === 2, `n=${perfil.detalhes}`);
  check(
    "totais por categoria corretos",
    /\/109/.test(perfil.texto) && /\/26/.test(perfil.texto)
  );
  check("estatística sobre os 135 itens", /\/135/.test(perfil.estat));

  check("sem erro de JS", erros.length === 0, erros.slice(0, 2).join(" | "));
  check("sem resposta 4xx/5xx", respostasRuins.length === 0, respostasRuins.slice(0, 2).join(" | "));

  await ctx.close();
  return resultados;
}
