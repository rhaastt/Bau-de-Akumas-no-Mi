/* Catálogo, raridade e sorteio. */

import { criarColetor, vigiar, contrasteComBranco } from "../auxiliar.js";

const RARIDADES = ["Comum", "Incomum", "Raro", "Épico", "Lendário"];
const DISTRIBUICAO = { Comum: 63, Incomum: 27, Raro: 22, "Épico": 11, "Lendário": 12 };
const PESOS = { Comum: 50, Incomum: 25, Raro: 15, "Épico": 7, "Lendário": 3 };

export const nome = "Dados e raridade";

export async function executar({ navegador, url }) {
  const { check, resultados } = criarColetor(nome);
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const { erros, respostasRuins } = vigiar(page);

  await page.goto(url);
  await page.waitForTimeout(1000);

  // --- JSONs ---
  const arquivos = await page.evaluate(async () => {
    const [f, a] = await Promise.all([
      fetch("dados/frutas.json").then((r) => r.json()),
      fetch("dados/armas.json").then((r) => r.json()),
    ]);
    const campos = (d) =>
      d.itens.every((i) =>
        ["nome", "tipo", "img", "desc"].every(
          (k) => typeof i[k] === "string" && i[k].length > 0
        )
      );
    return {
      frutas: f.itens.length,
      armas: a.itens.length,
      catFrutas: f.categoria,
      catArmas: a.categoria,
      completos: campos(f) && campos(a),
      nomes: [...f.itens, ...a.itens].map((i) => i.nome),
    };
  });

  check("frutas.json com 109 itens", arquivos.frutas === 109, `n=${arquivos.frutas}`);
  check("armas.json com 26 itens", arquivos.armas === 26, `n=${arquivos.armas}`);
  check(
    "categoria no topo de cada arquivo",
    arquivos.catFrutas === "Fruta" && arquivos.catArmas === "Arma"
  );
  check("todo item tem os 4 campos preenchidos", arquivos.completos);
  check(
    "nenhum nome duplicado no catálogo",
    new Set(arquivos.nomes).size === arquivos.nomes.length,
    `duplicados=${arquivos.nomes.length - new Set(arquivos.nomes).size}`
  );

  // --- Raridade aplicada ---
  await page.click("#btn-buscar");
  await page.waitForTimeout(500);
  const slots = await page.$$eval("#busca-resultados li.slot", (els) =>
    els.map((e) => e.dataset.raridade)
  );

  check("catálogo com 135 itens", slots.length === 135, `n=${slots.length}`);
  check(
    "todo item tem raridade válida",
    slots.every((r) => RARIDADES.includes(r)),
    `inválidos=${slots.filter((r) => !RARIDADES.includes(r)).length}`
  );

  const dist = {};
  slots.forEach((r) => (dist[r] = (dist[r] || 0) + 1));
  check(
    "distribuição por raridade",
    RARIDADES.every((r) => dist[r] === DISTRIBUICAO[r]),
    JSON.stringify(dist)
  );

  // --- Sorteio ponderado ---
  const amostra = await page.evaluate(async (n) => {
    const { sortearPorRaridade } = await import("./javascript/raridade.js");
    const [f, a] = await Promise.all([
      fetch("dados/frutas.json").then((r) => r.json()),
      fetch("dados/armas.json").then((r) => r.json()),
    ]);
    const { raridadeDoTipo } = await import("./javascript/raridade.js");
    const itens = [...f.itens, ...a.itens].map((i) => ({
      ...i,
      raridade: i.raridade ?? raridadeDoTipo(i.tipo),
    }));
    const obs = {};
    for (let i = 0; i < n; i++) {
      const it = sortearPorRaridade(itens);
      obs[it.raridade] = (obs[it.raridade] || 0) + 1;
    }
    return obs;
  }, 30000);

  // Margem folgada de propósito: é amostragem aleatória, não deve ficar instável.
  const desvios = RARIDADES.map((r) => {
    const pct = ((amostra[r] ?? 0) / 30000) * 100;
    return { r, pct, esperado: PESOS[r], erro: Math.abs(pct - PESOS[r]) };
  });
  check(
    "sorteio segue os pesos por raridade",
    desvios.every((d) => d.erro < 2),
    desvios.map((d) => `${d.r} ${d.pct.toFixed(1)}%`).join(" · ")
  );
  check(
    "Comum sai muito mais que Lendário",
    (amostra.Comum ?? 0) > (amostra["Lendário"] ?? 0) * 5
  );

  // --- Cores ---
  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return ["comum", "incomum", "raro", "epico", "lendario"].map((k) => [
      k,
      s.getPropertyValue(`--rar-${k}`).trim(),
    ]);
  });
  const piores = tokens
    .map(([k, hex]) => ({ k, hex, c: contrasteComBranco(hex) }))
    .sort((a, b) => a.c - b.c);
  check(
    "todas as cores de raridade >= 4.5:1 sobre branco",
    piores[0].c >= 4.5,
    `pior: ${piores[0].k} ${piores[0].hex} ${piores[0].c.toFixed(2)}:1`
  );

  const cores = await page.evaluate((rs) => {
    const out = {};
    for (const r of rs) {
      const el = document.querySelector(`#busca-resultados li.slot[data-raridade="${r}"]`);
      if (el) {
        const cs = getComputedStyle(el);
        out[r] = { cor: cs.borderTopColor, largura: cs.borderTopWidth };
      }
    }
    return out;
  }, RARIDADES);
  check(
    "cada raridade com uma cor distinta na borda",
    new Set(Object.values(cores).map((c) => c.cor)).size === 5,
    JSON.stringify(cores)
  );
  check(
    "Épico e Lendário com traço mais grosso (sinal além da cor)",
    cores["Épico"].largura === "2px" &&
      cores["Lendário"].largura === "2px" &&
      cores.Comum.largura === "1px"
  );

  // --- Imagem ausente degrada ---
  const arma = await page.evaluate(() => {
    const li = document.querySelector("#busca-resultados li.slot.sem-imagem");
    if (!li) return null;
    return {
      classe: li.className,
      display: getComputedStyle(li.querySelector("img")).display,
    };
  });
  check(
    "item sem arte cai no tratamento sem-imagem",
    arma !== null && arma.display === "none",
    JSON.stringify(arma)
  );

  check("sem erro de JS", erros.length === 0, erros.slice(0, 2).join(" | "));
  check("sem resposta 4xx/5xx", respostasRuins.length === 0, respostasRuins.slice(0, 2).join(" | "));

  await ctx.close();
  return resultados;
}
