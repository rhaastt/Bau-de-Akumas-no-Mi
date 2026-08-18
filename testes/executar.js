/* Runner da suíte.
 *
 * Sobe um servidor estático numa porta livre, roda cada grupo de casos num
 * contexto próprio do navegador, resume e sai com código != 0 se algo falhar.
 *
 * Usa a biblioteca `playwright` direto em vez de `@playwright/test` para a
 * suíte não depender de um runner extra: `npm install && npm test` basta.
 */

import { chromium } from "playwright";
import { subir } from "./servidor.js";

import * as dados from "./casos/dados.js";
import * as jogo from "./casos/jogo.js";
import * as telas from "./casos/telas.js";
import * as layout from "./casos/layout.js";

const CASOS = [dados, jogo, telas, layout];

async function principal() {
  const servidor = await subir();
  const navegador = await chromium.launch();
  const todos = [];

  try {
    for (const caso of CASOS) {
      console.log(`\n── ${caso.nome} ${"─".repeat(Math.max(0, 50 - caso.nome.length))}`);
      todos.push(...(await caso.executar({ navegador, url: `${servidor.url}/index.html` })));
    }
  } finally {
    await navegador.close();
    await servidor.parar();
  }

  const falhas = todos.filter((r) => !r.passou);
  console.log(`\n${"═".repeat(56)}`);
  console.log(`${todos.length - falhas.length}/${todos.length} verificações passaram`);

  if (falhas.length > 0) {
    console.log("\nFalhas:");
    for (const f of falhas) {
      console.log(`  · [${f.area}] ${f.nome}${f.detalhe ? ` :: ${f.detalhe}` : ""}`);
    }
    process.exitCode = 1;
  }
}

principal().catch((erro) => {
  console.error("\nA suíte não pôde ser executada:");
  console.error(erro.message);
  if (/Cannot find module 'playwright'/.test(erro.message)) {
    console.error("\nRode `npm install` antes.");
  }
  process.exitCode = 1;
});
