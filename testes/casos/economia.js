/* Economia: bônus de descoberta, venda de duplicatas e início apertado. */

import { criarColetor, vigiar, ganharItem } from "../auxiliar.js";

export const nome = "Economia";

const VALOR_VENDA = { Comum: 45, Incomum: 110, Raro: 280, "Épico": 700, "Lendário": 2000 };
const BONUS = { Comum: 110, Incomum: 220, Raro: 450, "Épico": 950, "Lendário": 2400 };

const berrys = (page) =>
  page.evaluate(() =>
    Number(document.getElementById("qtd-berrys").textContent.replace(/\./g, "").replace(",", "."))
  );

export async function executar({ navegador, url }) {
  const { check, resultados } = criarColetor(nome);
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const { erros, respostasRuins } = vigiar(page);

  await page.goto(url);
  await page.waitForTimeout(1000);

  // --- Início apertado ---
  const inicio = await page.evaluate(() => ({
    berrys: document.getElementById("qtd-berrys").textContent,
    baus: document.getElementById("qtd-atual").textContent,
  }));
  check("começa com 1.000,00 Berrys", inicio.berrys === "1.000,00", inicio.berrys);
  check("começa com 2 baús", inicio.baus === "2", inicio.baus);

  await page.click("#container-carrinho");
  await page.waitForTimeout(400);
  const pacotes = await page.$$eval("#loja-pacotes button[data-pacote]", (els) =>
    els.map((e) => ({ id: e.dataset.pacote, desabilitado: e.disabled }))
  );
  const avulso = pacotes.find((p) => p.id === "p1");
  const cinco = pacotes.find((p) => p.id === "p5");
  check("1.000 Berrys compram o avulso (250)", !avulso.desabilitado);
  check(
    "o pacote de 5 (1.100) fica fora de alcance no início",
    cinco.desabilitado,
    JSON.stringify(cinco)
  );

  // 4 avulsos é exatamente o que 1.000 Berrys pagam
  for (let i = 0; i < 4; i++) {
    await page.click('#loja-pacotes button[data-pacote="p1"]');
    await page.waitForTimeout(250);
  }
  const apos4 = await page.evaluate(() => ({
    berrys: Number(
      document.getElementById("qtd-berrys").textContent.replace(/\./g, "").replace(",", ".")
    ),
    p1: document.querySelector('#loja-pacotes button[data-pacote="p1"]').disabled,
  }));
  check("compra exatamente 4 avulsos e zera o saldo", apos4.berrys === 0, String(apos4.berrys));
  check("sem saldo, o avulso desabilita", apos4.p1);

  // --- Bônus de descoberta ---
  await page.click('.nav-item[data-tela="bau"]');
  await page.waitForTimeout(350);
  const antesDrop = await berrys(page);
  await page.click("#btn-bau");
  await page.waitForTimeout(950);
  const drop = await page.evaluate(() => ({
    legenda: document.getElementById("dropLegend").textContent,
    raridade: document.getElementById("dropItem").dataset.raridade,
  }));
  const depoisDrop = await berrys(page);
  const ganho = depoisDrop - antesDrop;
  check(
    "item inédito paga o bônus de descoberta da raridade",
    ganho === BONUS[drop.raridade],
    `${drop.raridade}: ganhou ${ganho}, esperado ${BONUS[drop.raridade]}`
  );
  check(
    "a legenda do drop mostra o ganho",
    drop.legenda.includes(`+${BONUS[drop.raridade]}`),
    drop.legenda
  );

  // --- Sem duplicata, sem venda ---
  await page.click('.nav-item[data-tela="mochila"]');
  await page.waitForTimeout(400);
  check(
    "sem duplicata, o botão de vender todas não aparece",
    await page.$eval("#btn-vender-duplicatas", (e) => e.hidden)
  );
  await page.click("#mochila-itens li.slot[data-idx]");
  await page.waitForTimeout(400);
  check(
    "cópia única não oferece venda no modal",
    await page.$eval("#btnVenderItem", (e) => e.hidden)
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  // --- Forçar uma duplicata pelo estado, para o teste ser determinístico ---
  await page.evaluate(async () => {
    const estado = await import("./javascript/estado.js");
    const primeiro = estado.obter().mochila[0];
    estado.adicionarItem({ ...primeiro });
  });
  await page.waitForTimeout(400);

  const nomeDup = await page.evaluate(async () => {
    const estado = await import("./javascript/estado.js");
    return estado.obter().mochila[0].nome;
  });
  const raridadeDup = await page.evaluate(async () => {
    const estado = await import("./javascript/estado.js");
    return estado.obter().mochila[0].raridade;
  });

  check(
    "com 2 cópias, o botão de vender todas aparece",
    await page.$eval("#btn-vender-duplicatas", (e) => !e.hidden)
  );

  // --- Venda individual ---
  const antesVenda = await berrys(page);
  const copiasAntes = await page.evaluate(
    (n) => document.querySelectorAll("#mochila-itens li.slot[data-idx]").length,
    nomeDup
  );
  await page.click("#mochila-itens li.slot[data-idx]");
  await page.waitForTimeout(400);
  const rotulo = await page.textContent("#btnVenderItem");
  check(
    "o modal oferece venda pelo valor da raridade",
    rotulo.includes(String(VALOR_VENDA[raridadeDup])),
    `${raridadeDup}: ${rotulo}`
  );
  await page.click("#btnVenderItem");
  await page.waitForTimeout(500);
  const depoisVenda = await berrys(page);
  const copiasDepois = await page.evaluate(
    () => document.querySelectorAll("#mochila-itens li.slot[data-idx]").length
  );
  check(
    "vender credita o valor certo",
    depoisVenda - antesVenda === VALOR_VENDA[raridadeDup],
    `ganhou ${depoisVenda - antesVenda}, esperado ${VALOR_VENDA[raridadeDup]}`
  );
  check("vender remove uma cópia", copiasDepois === copiasAntes - 1, `${copiasAntes} -> ${copiasDepois}`);

  // --- A coleção não encolhe ---
  const aindaObtido = await page.evaluate(async (n) => {
    const estado = await import("./javascript/estado.js");
    return estado.nomesObtidos().has(n);
  }, nomeDup);
  check("o item vendido continua marcado como obtido", aindaObtido, nomeDup);

  check(
    "após vender a duplicata, o botão some de novo",
    await page.$eval("#btn-vender-duplicatas", (e) => e.hidden)
  );

  // --- Vender todas ---
  await page.evaluate(async () => {
    const estado = await import("./javascript/estado.js");
    const m = estado.obter().mochila;
    estado.adicionarItem({ ...m[0] });
    estado.adicionarItem({ ...m[0] });
  });
  await page.waitForTimeout(400);
  const antesTudo = await berrys(page);
  const previsto = await page.evaluate(async () => {
    const estado = await import("./javascript/estado.js");
    return { quantas: estado.duplicatasNaMochila().length, total: estado.valorDasDuplicatas() };
  });
  await page.click("#btn-vender-duplicatas");
  await page.waitForTimeout(500);
  const depoisTudo = await berrys(page);
  check(
    "vender todas credita o total previsto",
    depoisTudo - antesTudo === previsto.total,
    `ganhou ${depoisTudo - antesTudo}, previsto ${previsto.total} (${previsto.quantas} duplicatas)`
  );
  const sobraram = await page.evaluate(async () => {
    const estado = await import("./javascript/estado.js");
    return estado.duplicatasNaMochila().length;
  });
  check("não sobra duplicata na mochila", sobraram === 0, `sobraram ${sobraram}`);

  // --- A Busca usa o mesmo modal e não pode oferecer venda ---
  await page.click("#btn-buscar");
  await page.waitForTimeout(400);
  await page.click("#busca-resultados li.slot");
  await page.waitForTimeout(400);
  check(
    "a Busca não oferece venda no modal compartilhado",
    await page.$eval("#btnVenderItem", (e) => e.hidden)
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  // --- A economia não trava nos primeiros baús ---
  await page.click('.nav-item[data-tela="config"]');
  await page.waitForTimeout(300);
  await page.click("#btn-resetar");
  await page.waitForTimeout(400);
  await page.click('.nav-item[data-tela="bau"]');
  await page.waitForTimeout(350);

  let abertos = 0;
  for (let i = 0; i < 60 && abertos < 12; i++) {
    const semBau = await page.$eval("#btn-bau", (e) => e.disabled);
    if (semBau) {
      // sem baú: tenta recomprar com o que a torneira rendeu
      await page.click("#container-carrinho");
      await page.waitForTimeout(300);
      const comprou = await page.$$eval("#loja-pacotes button[data-pacote]", (els) => {
        const livre = els.find((e) => !e.disabled);
        if (livre) livre.click();
        return Boolean(livre);
      });
      await page.click('.nav-item[data-tela="bau"]');
      await page.waitForTimeout(300);
      if (!comprou) break;
      continue;
    }
    if (await ganharItem(page)) abertos++;
  }
  check(
    "a torneira sustenta bem mais que os 4 baús do desenho sem bônus",
    abertos >= 8,
    `abriu ${abertos} baús reinvestindo o que ganhou`
  );

  check("sem erro de JS", erros.length === 0, erros.slice(0, 2).join(" | "));
  check("sem resposta 4xx/5xx", respostasRuins.length === 0, respostasRuins.slice(0, 2).join(" | "));

  await ctx.close();
  return resultados;
}
