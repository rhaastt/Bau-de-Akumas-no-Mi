import { bauDeAkumas } from "./akumasNoMi.js";

document.addEventListener("DOMContentLoaded", function () {
  const btnAbrirBau = document.getElementById("abrirBauDeAkumas");
  const contBau = document.getElementById("containerBau");
  const qtdAtualDeBausEl = document.getElementById("qtdAtualDeBaus");
  const qtdTotalDeBausEl = document.getElementById("qtdTotalDeBaus");
  const inventarioEl = document.getElementById("inventario");
  const textoBauEl = document.getElementById("textoBau");
  const dropAkumaEl = document.getElementById("dropAkuma");
  const dropImgEl = document.getElementById("dropImg");
  const dropLegendEl = document.getElementById("dropLegend");
  const SLOT_COUNT = 12;

  function exige(id, el) {
    if (!el) throw new Error(`Elemento com id "${id}" não encontrado no DOM.`);
  }
  exige("abrirBauDeAkumas", btnAbrirBau);
  exige("containerBau", contBau);
  exige("qtdAtualDeBaus", qtdAtualDeBausEl);
  exige("qtdTotalDeBaus", qtdTotalDeBausEl);
  exige("inventario", inventarioEl);
  exige("textoBau", textoBauEl);
  exige("dropAkuma", dropAkumaEl);
  exige("dropImg", dropImgEl);
  exige("dropLegend", dropLegendEl);

  const totalDeBaus = 10;
  let atualDeBaus = 7;
  let aberto = false;
  let busy = false;

  const inventario = [];

  // contador inicial
  qtdTotalDeBausEl.textContent = totalDeBaus;
  qtdAtualDeBausEl.textContent = atualDeBaus;
  atualizarBotao();
  renderInventario();

  // preload util
  function preload(src) {
    const im = new Image();
    im.decoding = "async";
    im.loading = "eager";
    im.src = src;
  }

  // Pré-carregar imagens do baú
  preload("imagens/bau-fechado.webp");
  preload("imagens/bau-aberto.webp");

  // Pré-carregar imagem das frutas (todas apontam para a mesma temporária)
  [...bauDeAkumas.paramecia, ...bauDeAkumas.logia, ...bauDeAkumas.zoan].forEach(
    (f) => preload(f.img)
  );

  function esc(s) {
    return String(s).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );
  }

  function atualizarContador() {
    qtdAtualDeBausEl.textContent = atualDeBaus;
    atualizarBotao();
  }

  function atualizarBotao() {
    if (atualDeBaus === 0 && !aberto) {
      btnAbrirBau.disabled = true;
      btnAbrirBau.textContent = "Sem Baús";
      return;
    }
    btnAbrirBau.textContent = aberto ? "Abrir Outro" : "Abrir Baú";
    btnAbrirBau.disabled = busy || (!aberto && atualDeBaus <= 0);
  }

  // sorteio unificado
  function sortearAkuma() {
    const todasAkumasNoMi = [
      ...bauDeAkumas.paramecia,
      ...bauDeAkumas.logia,
      ...bauDeAkumas.zoan,
    ];
    const i = Math.floor(Math.random() * todasAkumasNoMi.length);
    return todasAkumasNoMi[i];
  }

  function dropFruta() {
    const fruta = sortearAkuma();
    inventario.push(fruta);
    renderInventario();
    mostrarTexto(fruta);

    // imagem e legenda do drop
    dropImgEl.src = fruta.img;
    dropImgEl.alt = fruta.nome;
    dropLegendEl.textContent = `${fruta.nome}`;

    // reinicia a animação
    dropAkumaEl.classList.remove("show");
    // força reflow para reiniciar
    // eslint-disable-next-line no-unused-expressions
    dropAkumaEl.offsetWidth;
    dropAkumaEl.classList.remove("hidden");
    dropAkumaEl.classList.add("show");
    // some após um tempo
    const VISIBLE_MS = 1400;
    clearTimeout(dropFruta._t);
    dropFruta._t = setTimeout(() => {
      dropAkumaEl.classList.remove("show");
      dropAkumaEl.classList.add("hidden");
    }, VISIBLE_MS);
  }

  // texto do baú (formatação legível)
  function mostrarTexto(fruta) {
    textoBauEl.innerHTML = `<strong>${esc(fruta.nome)}</strong> — <em>${esc(
      fruta.tipo
    )}</em><br>${fruta.desc}`;
  }

  function renderInventario() {
    const itens = [...inventario];
    while (itens.length < SLOT_COUNT) itens.push(null);

    inventarioEl.innerHTML = itens
      .map((f) => {
        if (!f) {
          // slot vazio com área .pad para centralizar o "+"
          return `<li class="slot vazio">
                <div class="pad"></div>
              </li>`;
        }
        // slot preenchido: imagem na .pad + legenda em faixa
        return `<li class="slot">
              <div class="pad">
                <img src="${f.img}" alt="${f.nome}"
                     title="${f.nome} — ${f.tipo}\n${f.desc}" decoding="async">
              </div>
              <span class="label">${f.nome}</span>
            </li>`;
      })
      .join("");
  }

  btnAbrirBau.addEventListener("click", function () {
    if (busy) return;

    if (!aberto && atualDeBaus <= 0) {
      atualizarBotao();
      return;
    }

    busy = true;
    atualizarBotao();

    if (!aberto) {
      atualDeBaus -= 1;
      atualizarContador();
    }

    aberto = !aberto;
    contBau.classList.toggle("open", aberto);
    atualizarBotao();

    const ANIM_MS = 380;

    if (aberto) {
      setTimeout(dropFruta, ANIM_MS);
    }

    setTimeout(function () {
      busy = false;
      atualizarBotao();
    }, ANIM_MS);
  });
});
