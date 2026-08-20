/* Fluxo do jogo: abrir baú, drop, mochila, modal, loja e ajustes. */

import { criarColetor, vigiar, telasVisiveis, ganharItem, irAoBau } from "../auxiliar.js";

export const nome = "Jogo";

export async function executar({ navegador, url }) {
  const { check, resultados } = criarColetor(nome);
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const { erros, respostasRuins } = vigiar(page);

  await page.goto(url);
  await page.waitForTimeout(1000);

  // --- Abrir o baú ---
  // O jogo abre no Desafio; a tela do Baú é um clique de distância.
  check("o jogo abre no Desafio", (await telasVisiveis(page))[0] === "tela-quiz", (await telasVisiveis(page))[0]);
  await irAoBau(page);

  const antes = await page.$eval("#bau-fechado", (e) => getComputedStyle(e).opacity);
  await page.click("#btn-bau");
  await page.waitForTimeout(900);
  const depois = await page.evaluate(() => ({
    fechado: getComputedStyle(document.getElementById("bau-fechado")).opacity,
    aberto: getComputedStyle(document.getElementById("bau-aberto")).opacity,
    drop: document.getElementById("dropItem").classList.contains("show"),
    legenda: document.getElementById("dropLegend").textContent,
    raridade: document.getElementById("dropItem").dataset.raridade,
    corLegenda: getComputedStyle(document.querySelector("#dropItem .drop-legend")).color,
    corBordaImg: getComputedStyle(document.getElementById("dropImg")).borderTopColor,
    qtd: document.getElementById("qtd-atual").textContent,
  }));

  check(
    "crossfade fechado -> aberto",
    antes === "1" && depois.aberto === "1" && depois.fechado === "0",
    JSON.stringify({ f: depois.fechado, a: depois.aberto })
  );
  check("drop aparece com legenda", depois.drop && depois.legenda.length > 0, depois.legenda);
  check("contador decrementa 2 -> 1", depois.qtd === "1", depois.qtd);

  const CORES = {
    Comum: "rgb(17, 17, 17)",
    Incomum: "rgb(27, 127, 59)",
    Raro: "rgb(26, 95, 180)",
    "Épico": "rgb(115, 38, 168)",
    "Lendário": "rgb(163, 90, 0)",
  };
  check(
    "legenda do drop assume a cor da raridade",
    depois.corLegenda === CORES[depois.raridade],
    `${depois.raridade}: ${depois.corLegenda}`
  );
  check(
    "borda da imagem do drop assume a cor da raridade",
    depois.corBordaImg === CORES[depois.raridade],
    `${depois.raridade}: ${depois.corBordaImg} (esperado ${CORES[depois.raridade]})`
  );

  // Esperar 1.200 ms fixos falharia nos 3% em que sai um Lendário, que agora
  // fica 3.400 ms na tela. A espera sai da própria raridade sorteada.
  const tempo = await page.evaluate(async (r) => {
    const { tempoDoDrop } = await import("./javascript/telas/bau.js");
    return tempoDoDrop(r);
  }, depois.raridade);
  await page.waitForTimeout(tempo + 400);
  check(
    "drop some depois do tempo da raridade",
    await page.$eval("#dropItem", (e) => e.classList.contains("hidden")),
    `${depois.raridade}: ${tempo}ms`
  );

  // --- Mochila e modal ---
  await page.click('.nav-item[data-tela="mochila"]');
  await page.waitForTimeout(400);
  check("item entra na mochila", (await page.$$eval("#mochila-itens li.slot[data-idx]", (e) => e.length)) === 1);
  check(
    "slot da mochila carrega a raridade",
    (await page.$$eval("#mochila-itens li.slot[data-idx]", (e) => e.filter((x) => x.dataset.raridade).length)) === 1
  );

  await page.click("#mochila-itens li.slot[data-idx]");
  await page.waitForTimeout(400);
  const modal = await page.evaluate(() => ({
    ativo: document.getElementById("inventarioItem").classList.contains("active"),
    nome: document.getElementById("inventarioItemNome").textContent,
    tipo: document.getElementById("inventarioItemTipo").textContent,
    selo: document.getElementById("inventarioItemRaridade").textContent,
    desc: document.getElementById("inventarioItemDescricao").textContent.length,
    largura: document.getElementById("inventarioItemCard").getBoundingClientRect().width,
  }));
  check("modal abre com nome, tipo e descrição", modal.ativo && !!modal.nome && !!modal.tipo && modal.desc > 10);
  check("selo diz a raridade por escrito", !!modal.selo, modal.selo);
  check("modal cabe na largura do celular", modal.largura <= 390, `w=${modal.largura}`);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(450);
  check("modal fecha com Esc", await page.$eval("#inventarioItem", (e) => !e.classList.contains("active")));

  await page.click("#mochila-itens li.slot[data-idx]");
  await page.waitForTimeout(400);
  await page.mouse.click(5, 5);
  await page.waitForTimeout(450);
  check("modal fecha clicando fora", await page.$eval("#inventarioItem", (e) => !e.classList.contains("active")));

  await page.click("#mochila-itens li.slot[data-idx]");
  await page.waitForTimeout(400);
  await page.click("#btnFecharCardItemIventario");
  await page.waitForTimeout(450);
  check("modal fecha pelo botão", await page.$eval("#inventarioItem", (e) => !e.classList.contains("active")));
  check("rolagem do body é restaurada", await page.evaluate(() => document.body.style.overflow === ""));

  // --- Loja ---
  await page.click("#container-carrinho");
  await page.waitForTimeout(400);
  const saldoAntes = await page.textContent("#qtd-berrys");
  const bausAntes = Number(await page.textContent("#qtd-atual"));
  await page.click('#loja-pacotes button[data-pacote="p5"]');
  await page.waitForTimeout(400);
  const posCompra = await page.evaluate(() => ({
    saldo: document.getElementById("qtd-berrys").textContent,
    aviso: document.getElementById("loja-aviso").textContent,
  }));
  await page.click('.nav-item[data-tela="bau"]');
  await page.waitForTimeout(350);
  const bausDepois = Number(await page.textContent("#qtd-atual"));
  check("compra debita Berrys no topo", posCompra.saldo !== saldoAntes, `${saldoAntes} -> ${posCompra.saldo}`);
  check("compra credita 5 baús", bausDepois === bausAntes + 5, `${bausAntes} -> ${bausDepois}`);
  check("loja responde ao usuário", /comprado/i.test(posCompra.aviso), posCompra.aviso);

  // Pacote inacessível fica desabilitado e o rótulo diz o porquê — checar só
  // o `disabled` passaria pelo motivo errado (saldo em vez de limite).
  await page.click("#container-carrinho");
  await page.waitForTimeout(350);
  const p10 = await page.$eval('#loja-pacotes button[data-pacote="p10"]', (e) => ({
    desabilitado: e.disabled,
    rotulo: e.textContent.trim(),
  }));
  check(
    "pacote inacessível fica desabilitado com motivo",
    p10.desabilitado && /Berrys insuficientes|Limite de baús/.test(p10.rotulo),
    JSON.stringify(p10)
  );

  // --- Ajustes ---
  await page.click('.nav-item[data-tela="config"]');
  await page.waitForTimeout(350);
  const animAntes = await page.evaluate(() => document.documentElement.dataset.animacoes);
  await page.click("#cfg-animacoes");
  await page.waitForTimeout(300);
  const animDepois = await page.evaluate(() => ({
    attr: document.documentElement.dataset.animacoes,
    aria: document.getElementById("cfg-animacoes").getAttribute("aria-checked"),
  }));
  check(
    "toggle de animações altera o documento",
    animAntes === "on" && animDepois.attr === "off" && animDepois.aria === "false",
    JSON.stringify(animDepois)
  );
  await page.click("#cfg-animacoes");
  await page.waitForTimeout(300);

  await page.click("#cfg-ir-mochila");
  await page.waitForTimeout(300);
  await page.click('.nav-item[data-tela="bau"]');
  await page.waitForTimeout(350);
  await ganharItem(page);
  check(
    'toggle "ir para a mochila" leva à mochila ao ganhar',
    (await telasVisiveis(page))[0] === "tela-mochila",
    (await telasVisiveis(page))[0]
  );

  await page.click('.nav-item[data-tela="config"]');
  await page.waitForTimeout(300);
  await page.click("#cfg-ir-mochila");
  await page.waitForTimeout(250);
  await page.click("#btn-resetar");
  await page.waitForTimeout(400);
  await page.click('.nav-item[data-tela="mochila"]');
  await page.waitForTimeout(350);
  check("reset limpa a mochila", (await page.$$eval("#mochila-itens li.slot[data-idx]", (e) => e.length)) === 0);
  check("reset restaura os Berrys", (await page.textContent("#qtd-berrys")) === "1.000,00");

  // --- Baús esgotados ---
  await page.click('.nav-item[data-tela="bau"]');
  await page.waitForTimeout(350);
  for (let i = 0; i < 40; i++) {
    if (await page.$eval("#btn-bau", (e) => e.disabled)) break;
    await page.click("#btn-bau");
    await page.waitForTimeout(430);
  }
  const fim = await page.evaluate(() => ({
    qtd: document.getElementById("qtd-atual").textContent,
    texto: document.getElementById("btn-bau").textContent,
    desabilitado: document.getElementById("btn-bau").disabled,
  }));
  check("baús chegam a zero", fim.qtd === "0", fim.qtd);
  check('botão vira "SEM BAÚS" e desabilita', fim.desabilitado && /SEM BA/.test(fim.texto), fim.texto);

  check("sem erro de JS", erros.length === 0, erros.slice(0, 2).join(" | "));
  check("sem resposta 4xx/5xx", respostasRuins.length === 0, respostasRuins.slice(0, 2).join(" | "));

  await ctx.close();
  return resultados;
}
