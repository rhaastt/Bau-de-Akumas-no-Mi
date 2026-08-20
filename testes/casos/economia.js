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
  // --- Cópia única: vende, mas com confirmação ---
  const antesUnica = await berrys(page);
  await page.click("#mochila-itens li.slot[data-idx]");
  await page.waitForTimeout(400);
  check(
    "cópia única oferece venda no modal",
    await page.$eval("#btnVenderItem", (e) => !e.hidden)
  );

  // primeiro clique só pede confirmação
  await page.click("#btnVenderItem");
  await page.waitForTimeout(300);
  const emConfirmacao = await page.evaluate(() => ({
    aberto: document.getElementById("inventarioItem").classList.contains("active"),
    rotulo: document.getElementById("btnVenderItem").textContent,
    berrys: document.getElementById("qtd-berrys").textContent,
  }));
  check(
    "primeiro clique na última cópia só pede confirmação",
    emConfirmacao.aberto && /CONFIRMAR/.test(emConfirmacao.rotulo),
    emConfirmacao.rotulo
  );
  check(
    "pedir confirmação ainda não credita nada",
    (await berrys(page)) === antesUnica
  );

  // fechar cancela e não vende
  await page.keyboard.press("Escape");
  await page.waitForTimeout(450);
  const aposCancelar = await page.evaluate(
    () => document.querySelectorAll("#mochila-itens li.slot[data-idx]").length
  );
  check("fechar sem confirmar não vende", aposCancelar === 1 && (await berrys(page)) === antesUnica);

  // reabrir não herda a confirmação pendente
  await page.click("#mochila-itens li.slot[data-idx]");
  await page.waitForTimeout(400);
  check(
    "reabrir não vem com a confirmação pendente",
    await page.$eval("#btnVenderItem", (e) => /VENDER POR/.test(e.textContent))
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
  // Duplicata vende no primeiro clique — sem confirmação.
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

  // Vender duplicata mantém o item na coleção: sobrou uma cópia.
  const aindaObtido = await page.evaluate(async (n) => {
    const estado = await import("./javascript/estado.js");
    return estado.nomesObtidos().has(n);
  }, nomeDup);
  check("vender duplicata mantém o item na coleção", aindaObtido, nomeDup);

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

  // --- Vender a última cópia tira o item da coleção ---
  const antesUltima = await page.evaluate(async () => {
    const estado = await import("./javascript/estado.js");
    const item = estado.obter().mochila[0];
    return {
      nome: item.nome,
      raridade: item.raridade,
      distintos: estado.nomesObtidos().size,
      berrys: estado.obter().berrys,
    };
  });

  await page.click("#mochila-itens li.slot[data-idx]");
  await page.waitForTimeout(400);
  await page.click("#btnVenderItem"); // pede confirmação
  await page.waitForTimeout(300);
  await page.click("#btnVenderItem"); // confirma
  await page.waitForTimeout(550);

  const depoisUltima = await page.evaluate(async (n) => {
    const estado = await import("./javascript/estado.js");
    return {
      naMochila: estado.obter().mochila.some((i) => i.nome === n),
      obtido: estado.nomesObtidos().has(n),
      distintos: estado.nomesObtidos().size,
      berrys: estado.obter().berrys,
      aindaDescoberto: estado.foiDescoberto(n),
    };
  }, antesUltima.nome);

  check(
    "confirmar vende a última cópia e credita o valor",
    !depoisUltima.naMochila &&
      Math.round(depoisUltima.berrys - antesUltima.berrys) ===
        VALOR_VENDA[antesUltima.raridade],
    `ganhou ${Math.round(depoisUltima.berrys - antesUltima.berrys)}, esperado ${
      VALOR_VENDA[antesUltima.raridade]
    }`
  );
  check(
    "a coleção encolhe: o item deixa de ser obtido",
    !depoisUltima.obtido && depoisUltima.distintos === antesUltima.distintos - 1,
    `${antesUltima.distintos} -> ${depoisUltima.distintos}`
  );

  // A Busca reflete o mesmo modelo
  await page.click("#btn-buscar");
  await page.waitForTimeout(400);
  await page.fill("#busca-campo", antesUltima.nome);
  await page.waitForTimeout(400);
  check(
    "a Busca volta a marcar o item como não obtido",
    await page.$eval("#busca-resultados li.slot", (e) =>
      e.classList.contains("nao-obtida")
    )
  );
  await page.fill("#busca-campo", "");
  await page.waitForTimeout(300);

  // --- Anti-brecha: reencontrar não paga o bônus de novo ---
  check(
    "o item vendido continua registrado como já descoberto",
    depoisUltima.aindaDescoberto,
    antesUltima.nome
  );

  const reencontro = await page.evaluate(async (n) => {
    const estado = await import("./javascript/estado.js");
    const item = estado.catalogo().find((i) => i.nome === n);
    const antes = estado.obter().berrys;
    const bonus = estado.adicionarItem({ ...item });
    return { bonus, delta: estado.obter().berrys - antes };
  }, antesUltima.nome);
  check(
    "reencontrar item já descoberto NÃO paga o bônus de novo",
    reencontro.bonus === 0 && Math.round(reencontro.delta) === 0,
    `bônus=${reencontro.bonus} delta=${reencontro.delta}`
  );

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

  // --- A cor da raridade fica no item, não na ação ---
  // Antes, o botão herdava --cor-raridade e ficava bronze num Lendário.
  // O modal carimba data-raridade no card, então a variável cascateia até o
  // botão: a checagem compara a cor computada nos dois extremos da tabela.
  const coresBotao = await page.evaluate(async () => {
    const estado = await import("./javascript/estado.js");
    const { abrirItem, fecharItem } = await import("./javascript/modalItem.js");
    const btn = document.getElementById("btnVenderItem");
    const ler = (raridade) => {
      const item = estado.catalogo().find((i) => i.raridade === raridade);
      abrirItem(item, { venda: { valor: 1, ultima: false, vender() {} } });
      const s = getComputedStyle(btn);
      const cor = { texto: s.color, borda: s.borderTopColor };
      fecharItem();
      return cor;
    };
    return { comum: ler("Comum"), lendario: ler("Lendário") };
  });
  await page.waitForTimeout(450);
  check(
    "o botão de vender é preto em qualquer raridade",
    coresBotao.comum.texto === coresBotao.lendario.texto &&
      coresBotao.comum.borda === coresBotao.lendario.borda &&
      coresBotao.lendario.texto === "rgb(0, 0, 0)" &&
      coresBotao.lendario.borda === "rgb(0, 0, 0)",
    JSON.stringify(coresBotao)
  );

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
