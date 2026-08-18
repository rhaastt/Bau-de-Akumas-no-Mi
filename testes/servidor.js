/* Servidor estático mínimo.
 *
 * O projeto precisa ser servido por HTTP — módulos ES e fetch não funcionam
 * em file://. Serve também para `npm start`, sem depender de python3 nem de
 * nenhum pacote: quem roda os testes já tem Node.
 */

import http from "node:http";
import net from "node:net";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

/** Uma porta livre escolhida pelo sistema, para dois testes não colidirem. */
export function portaLivre() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on("error", reject);
    s.listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

export function criarServidor() {
  return http.createServer(async (req, res) => {
    const semQuery = decodeURIComponent(req.url.split("?")[0]);
    const relativo = semQuery === "/" ? "index.html" : semQuery.slice(1);

    // Impede sair da raiz do projeto via ../
    const alvo = path.resolve(RAIZ, relativo);
    if (!alvo.startsWith(RAIZ)) {
      res.writeHead(403).end("Fora da raiz");
      return;
    }

    try {
      const conteudo = await fs.readFile(alvo);
      res.writeHead(200, {
        "Content-Type": TIPOS[path.extname(alvo)] ?? "application/octet-stream",
      });
      res.end(conteudo);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Não encontrado");
    }
  });
}

/** Sobe o servidor e devolve { url, parar }. */
export async function subir(porta) {
  const p = porta ?? (await portaLivre());
  const servidor = criarServidor();
  await new Promise((r) => servidor.listen(p, r));
  return {
    url: `http://localhost:${p}`,
    parar: () => new Promise((r) => servidor.close(r)),
  };
}

// `npm start` — sobe numa porta fixa e fica de pé.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const porta = Number(process.env.PORTA ?? 8000);
  subir(porta).then(({ url }) => console.log(`Servindo em ${url}`));
}
