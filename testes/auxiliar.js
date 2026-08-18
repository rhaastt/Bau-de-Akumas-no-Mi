/* Utilitários compartilhados pelos casos de teste. */

/**
 * Ruído esperado, que não deve reprovar a suíte:
 * - favicon: o navegador pede sozinho e o projeto não tem um
 * - imagens/armas/: as artes das armas ainda não existem, e a degradação
 *   sem imagem é justamente o que um dos casos verifica
 */
export const RUIDO = /favicon\.ico|imagens\/armas\//i;

/** Coletor de verificações: acumula, imprime e sabe se algo falhou. */
export function criarColetor(area) {
  const resultados = [];
  const check = (nome, passou, detalhe) => {
    resultados.push({ area, nome, passou, detalhe });
    const marca = passou ? "  ok  " : " FALHA";
    console.log(`${marca} ${nome}${detalhe ? ` :: ${detalhe}` : ""}`);
  };
  return { check, resultados };
}

/** Liga a captura de erros de JS e respostas com falha numa página. */
export function vigiar(page) {
  const erros = [];
  const respostasRuins = [];
  page.on("pageerror", (e) => {
    if (!RUIDO.test(e.message)) erros.push(e.message);
  });
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const origem = (m.location() ?? {}).url ?? "";
    if (!RUIDO.test(m.text()) && !RUIDO.test(origem)) erros.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && !RUIDO.test(r.url())) {
      respostasRuins.push(`${r.status()} ${r.url()}`);
    }
  });
  return { erros, respostasRuins };
}

/** Telas visíveis no momento (só uma deve estar). */
export const telasVisiveis = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".tela")].filter((s) => !s.hidden).map((s) => s.id)
  );

/**
 * Abre baús até um item cair na mochila.
 *
 * ARMADILHA: o botão do baú alterna abrir/fechar e só o abrir consome um
 * baú — cada item custa dois cliques. Clicar uma vez só falha quando o baú
 * já estava aberto de uma interação anterior.
 */
export async function ganharItem(page) {
  const contar = () =>
    page.evaluate(
      () => document.querySelectorAll("#mochila-itens li.slot[data-idx]").length
    );
  const antes = await contar();
  for (let i = 0; i < 4; i++) {
    if (await page.$eval("#btn-bau", (b) => b.disabled)) return false;
    await page.click("#btn-bau");
    await page.waitForTimeout(900);
    if ((await contar()) > antes) return true;
  }
  return false;
}

/** Contraste de uma cor hex contra branco, pela fórmula da WCAG. */
export function contrasteComBranco(hex) {
  const canais = hex
    .replace("#", "")
    .match(/../g)
    .map((h) => {
      const v = parseInt(h, 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
  const luz = 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
  return 1.05 / (luz + 0.05);
}
