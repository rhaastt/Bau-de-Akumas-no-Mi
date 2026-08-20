/* Desafio: trilha, risco/recompensa e a persistência que ele exigiu. */

import { criarColetor, vigiar, telasVisiveis, ganharItem } from "../auxiliar.js";

export const nome = "Desafio";

// Grand Line paga o dobro de East Blue, e a 3ª posição paga baús em vez de
// Berrys: 200 + 400 + [2 baús] + 800 + 1000.
const GRAND_LINE = { berrys: 2400, baus: 2 };

const lerEstado = (page) =>
  page.evaluate(async () => {
    const e = await import("./javascript/estado.js");
    const s = e.obter();
    return {
      berrys: s.berrys,
      baus: s.baus.atual,
      mochila: s.mochila.length,
      quiz: s.quiz,
      rodada: s.rodada,
    };
  });

/** Responde a pergunta atual, escolhendo de propósito a certa ou uma errada. */
async function responder(page, certo) {
  const idx = await page.evaluate(async (c) => {
    const e = await import("./javascript/estado.js");
    const r = e.obter().rodada;
    const q = e.perguntasDe(r.categoria)[r.posicao];
    return c ? q.correta : (q.correta + 1) % q.opcoes.length;
  }, certo);
  await page.click(`#quiz-opcoes button[data-opcao="${idx}"]`);
  await page.waitForTimeout(220);
}

const acoes = (page) =>
  page.$$eval("#quiz-acoes button", (els) => els.map((e) => e.dataset.acao));

export async function executar({ navegador, url }) {
  const { check, resultados } = criarColetor(nome);
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const { erros, respostasRuins } = vigiar(page);

  await page.goto(url);
  await page.waitForTimeout(1000);

  // --- Trilha ---
  check(
    "o Desafio é a tela principal",
    (await telasVisiveis(page))[0] === "tela-quiz" &&
      (await page.textContent("#titulo-tela")) === "DESAFIO"
  );

  const trilha = await page.$$eval(".quiz-categoria", (els) =>
    els.map((e) => ({
      nome: e.querySelector(".titulo-painel").textContent,
      travada: e.classList.contains("travada"),
      apoio: e.querySelector(".texto-apoio").textContent,
      desabilitado: e.querySelector("button").disabled,
    }))
  );
  check(
    "só a primeira categoria começa liberada",
    trilha.length === 3 &&
      !trilha[0].travada &&
      trilha[1].travada &&
      trilha[2].travada,
    trilha.map((c) => `${c.nome}:${c.travada ? "travada" : "livre"}`).join(" ")
  );
  check(
    "categoria travada tem o botão desabilitado",
    trilha[1].desabilitado && trilha[2].desabilitado
  );
  // A opacidade sozinha não é informação: o texto tem de dizer o que falta.
  check(
    "a trava é dita por escrito, não só pela opacidade",
    /complete East Blue/i.test(trilha[1].apoio),
    trilha[1].apoio
  );

  // --- Acertar, acumular e arriscar ---
  await page.click('button[data-categoria="East Blue"]');
  await page.waitForTimeout(250);
  check(
    "começar abre a primeira pergunta com as opções",
    (await page.$eval("#quiz-enunciado", (e) => e.textContent.length)) > 5 &&
      (await page.$$eval("#quiz-opcoes button", (e) => e.length)) === 4
  );

  await responder(page, true);
  check(
    "acerto oferece GUARDAR e ARRISCAR",
    JSON.stringify(await acoes(page)) === JSON.stringify(["guardar", "arriscar"]),
    JSON.stringify(await acoes(page))
  );
  check(
    "o card mostra o que foi acumulado",
    (await page.textContent("#quiz-resultado-valor")).includes("100"),
    await page.textContent("#quiz-resultado-valor")
  );

  await page.click('button[data-acao="arriscar"]');
  await page.waitForTimeout(220);
  await responder(page, true);
  check(
    "arriscar acumula: 100 + 200 = 300",
    (await page.textContent("#quiz-resultado-valor")).includes("300"),
    await page.textContent("#quiz-resultado-valor")
  );

  // --- Errar arriscando ---
  const antesErro = await lerEstado(page);
  await page.click('button[data-acao="arriscar"]');
  await page.waitForTimeout(220);
  await responder(page, false);
  const depoisErro = await lerEstado(page);

  check("erro anuncia a resposta errada", /ERRADA/.test(await page.textContent("#quiz-resultado-titulo")));
  check(
    "o card diz quanto foi perdido, não zero",
    (await page.textContent("#quiz-resultado-valor")).includes("300"),
    await page.textContent("#quiz-resultado-valor")
  );
  check(
    "errar não credita nada",
    depoisErro.berrys === antesErro.berrys && depoisErro.baus === antesErro.baus,
    `${antesErro.berrys} -> ${depoisErro.berrys}`
  );
  check("errar zera o pote acumulado", depoisErro.rodada.pote.berrys === 0);
  check(
    "errar NÃO apaga o progresso das perguntas",
    depoisErro.quiz.progresso["East Blue"] === 3,
    `respondidas=${depoisErro.quiz.progresso["East Blue"]}`
  );
  check(
    "erro só oferece VOLTAR",
    JSON.stringify(await acoes(page)) === JSON.stringify(["voltar"]),
    JSON.stringify(await acoes(page))
  );

  await page.click('button[data-acao="voltar"]');
  await page.waitForTimeout(250);
  check(
    "VOLTAR devolve à trilha, que retoma de onde parou",
    (await page.$eval("#quiz-trilha", (e) => !e.hidden)) &&
      (await page.$$eval(".quiz-categoria .quiz-marcador.cheio", (e) => e.length)) === 3
  );

  // --- Completar a categoria e guardar ---
  await page.click('button[data-categoria="East Blue"]');
  await page.waitForTimeout(220);
  await responder(page, true); // 4ª
  await page.click('button[data-acao="arriscar"]');
  await page.waitForTimeout(220);
  await responder(page, true); // 5ª
  check(
    "a última pergunta não oferece ARRISCAR",
    JSON.stringify(await acoes(page)) === JSON.stringify(["guardar"]),
    JSON.stringify(await acoes(page))
  );

  const antesGuardar = await lerEstado(page);
  await page.click('button[data-acao="guardar"]');
  await page.waitForTimeout(300);
  const depoisGuardar = await lerEstado(page);

  // A sequência retomada cobre só as perguntas 4 e 5 (400 + 500). O baú da 3ª
  // ficou para trás com a resposta errada — é exatamente o que o erro custa.
  check(
    "a sequência retomada paga só o que foi respondido nela",
    depoisGuardar.berrys - antesGuardar.berrys === 900 &&
      depoisGuardar.baus - antesGuardar.baus === 0,
    `+${depoisGuardar.berrys - antesGuardar.berrys} Berrys, +${
      depoisGuardar.baus - antesGuardar.baus
    } baú`
  );
  check("guardar encerra a rodada", depoisGuardar.rodada === null);

  const trilha2 = await page.$$eval(".quiz-categoria", (els) =>
    els.map((e) => ({
      travada: e.classList.contains("travada"),
      botao: e.querySelector("button").textContent.trim(),
    }))
  );
  check(
    "completar as 5 libera a categoria seguinte",
    !trilha2[1].travada && trilha2[1].botao === "COMEÇAR" && trilha2[2].travada,
    JSON.stringify(trilha2)
  );
  check("categoria completa passa a oferecer rejogo", trilha2[0].botao === "REJOGAR");

  // --- Passada limpa numa categoria inteira ---
  const antesGL = await lerEstado(page);
  await page.click('button[data-categoria="Grand Line"]');
  await page.waitForTimeout(220);
  for (let i = 0; i < 5; i++) {
    await responder(page, true);
    if (i < 4) {
      await page.click('button[data-acao="arriscar"]');
      await page.waitForTimeout(220);
    }
  }
  await page.click('button[data-acao="guardar"]');
  await page.waitForTimeout(300);
  const depoisGL = await lerEstado(page);
  check(
    "acertar as 5 sem errar paga a categoria inteira, Berrys e baús",
    depoisGL.berrys - antesGL.berrys === GRAND_LINE.berrys &&
      depoisGL.baus - antesGL.baus === GRAND_LINE.baus,
    `+${depoisGL.berrys - antesGL.berrys} Berrys, +${
      depoisGL.baus - antesGL.baus
    } baús (esperado +${GRAND_LINE.berrys} e +${GRAND_LINE.baus})`
  );
  check(
    "completar a segunda categoria libera a terceira",
    await page.$$eval(".quiz-categoria", (els) => !els[2].classList.contains("travada"))
  );

  // --- Rejogo vale menos ---
  await page.click('button[data-categoria="East Blue"]');
  await page.waitForTimeout(220);
  await responder(page, true);
  check(
    "rejogar paga 20% do valor original (100 -> 20)",
    (await page.textContent("#quiz-resultado-valor")).includes("20"),
    await page.textContent("#quiz-resultado-valor")
  );
  await page.click('button[data-acao="guardar"]');
  await page.waitForTimeout(250);

  // --- Persistência ---
  await ganharItem(page);
  const antesReload = await lerEstado(page);
  await page.reload();
  await page.waitForTimeout(1000);
  const depoisReload = await lerEstado(page);
  check(
    "reload preserva Berrys, baús, mochila e progresso do Desafio",
    JSON.stringify(antesReload) === JSON.stringify(depoisReload),
    `antes=${JSON.stringify(antesReload.quiz)} depois=${JSON.stringify(depoisReload.quiz)}`
  );
  check("reload volta na tela principal", (await telasVisiveis(page))[0] === "tela-quiz");

  await page.click('.nav-item[data-tela="config"]');
  await page.waitForTimeout(300);
  await page.click("#btn-resetar");
  await page.waitForTimeout(300);
  await page.reload();
  await page.waitForTimeout(1000);
  const zerado = await lerEstado(page);
  check(
    "resetar apaga o save: o progresso não ressuscita no reload",
    zerado.berrys === 1000 &&
      zerado.mochila === 0 &&
      Object.keys(zerado.quiz.progresso).length === 0,
    JSON.stringify(zerado)
  );

  check("sem erro de JS", erros.length === 0, erros.slice(0, 2).join(" | "));
  check("sem resposta 4xx/5xx", respostasRuins.length === 0, respostasRuins.slice(0, 2).join(" | "));
  await ctx.close();

  // --- Storage indisponível não pode derrubar o jogo ---
  // localStorage lança em navegação privada e com cookies bloqueados; um throw
  // no caminho de salvar quebraria o jogo a cada ação.
  const ctxSemStorage = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const pageSS = await ctxSemStorage.newPage();
  const vigia = vigiar(pageSS);
  await pageSS.addInitScript(() => {
    const lancar = () => {
      throw new Error("SecurityError simulado");
    };
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: lancar,
    });
  });
  await pageSS.goto(url);
  await pageSS.waitForTimeout(1000);
  await pageSS.click('button[data-categoria="East Blue"]');
  await pageSS.waitForTimeout(250);
  await responder(pageSS, true);
  await pageSS.click('button[data-acao="guardar"]');
  await pageSS.waitForTimeout(300);
  const semStorage = await lerEstado(pageSS);
  check(
    "sem localStorage o jogo abre e joga normalmente, só não lembra",
    semStorage.berrys === 1100 && vigia.erros.length === 0,
    `berrys=${semStorage.berrys} erros=${vigia.erros.slice(0, 2).join(" | ")}`
  );
  await ctxSemStorage.close();

  return resultados;
}
