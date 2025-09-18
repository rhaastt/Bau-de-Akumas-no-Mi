import { bauDeAkumas } from "./akumasNoMi.js";

document.addEventListener("DOMContentLoaded", function () {
  const btnAbrirBau = document.getElementById("abrirBauDeAkumas");
  const contBau = document.getElementById("containerBau");
  const qtdAtualDeBausEl = document.getElementById("qtdAtualDeBaus");
  const qtdTotalDeBausEl = document.getElementById("qtdTotalDeBaus");
  const cardInventarioEl = document.getElementById("card-inventario");
  const inventarioEl = document.getElementById("inventario");
  const textoBauEl = document.getElementById("textoBau");
  const dropAkumaEl = document.getElementById("dropAkuma");
  const dropImgEl = document.getElementById("dropImg");
  const dropLegendEl = document.getElementById("dropLegend");
  const abrirMochilaBtn = document.getElementById("abrirMochilaBtn");
  const SLOT_COUNT = 12;

  function exige(id, el) {
    if (!el) throw new Error(`Elemento com id "${id}" não encontrado no DOM.`);
  }
  exige("abrirBauDeAkumas", btnAbrirBau);
  exige("containerBau", contBau);
  exige("qtdAtualDeBaus", qtdAtualDeBausEl);
  exige("qtdTotalDeBaus", qtdTotalDeBausEl);
  exige("card-inventario", cardInventarioEl);
  exige("inventario", inventarioEl);
  exige("textoBau", textoBauEl);
  exige("dropAkuma", dropAkumaEl);
  exige("dropImg", dropImgEl);
  exige("dropLegend", dropLegendEl);
  exige("abrirMochilaBtn", abrirMochilaBtn);

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

  // === Inventário (helpers de abrir/fechar/toggle) ===
  const AUTO_ABRIR_MOCHILA_NO_1_DROP = true;
  let abriuAutomaticoJa = false;

  function restartAnimation(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // força reflow
    el.classList.add(cls);
  }
  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }

  function abrirInventario() {
    if (getComputedStyle(cardInventarioEl).display !== "none") return; // já aberto
    cardInventarioEl.style.display = "grid";
    abrirMochilaBtn.textContent = "Fechar Mochila";
    if (!prefersReducedMotion()) {
      restartAnimation(cardInventarioEl, "show"); // usa @keyframes showMochila
    } else {
      cardInventarioEl.style.opacity = "1";
      cardInventarioEl.style.transform = "none";
    }
  }

  function fecharInventario() {
    if (getComputedStyle(cardInventarioEl).display === "none") return;
    if (prefersReducedMotion()) {
      cardInventarioEl.style.display = "none";
      abrirMochilaBtn.textContent = "Abrir Mochila";
      return;
    }
    cardInventarioEl.classList.remove("show");
    cardInventarioEl.classList.add("hiding");
    abrirMochilaBtn.textContent = "Abrir Mochila";

    const onEnd = () => {
      cardInventarioEl.classList.remove("hiding");
      cardInventarioEl.style.display = "none";
      cardInventarioEl.removeEventListener("animationend", onEnd);
    };
    cardInventarioEl.addEventListener("animationend", onEnd, { once: true });
  }

  function toggleInventario() {
    const fechado = getComputedStyle(cardInventarioEl).display === "none";
    if (fechado) abrirInventario();
    else fecharInventario();
  }

  abrirMochilaBtn.addEventListener("click", toggleInventario);

  let dropTimeoutId = null;
  const VISIBLE_MS = 1400;

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

    clearTimeout(dropTimeoutId);
    dropTimeoutId = setTimeout(() => {
      dropAkumaEl.classList.remove("show");
      dropAkumaEl.classList.add("hidden");
    }, VISIBLE_MS);

    if (AUTO_ABRIR_MOCHILA_NO_1_DROP && !abriuAutomaticoJa) {
      abrirInventario();
      abriuAutomaticoJa = true;
    }
  }

  // texto do baú (formatação legível)
  function mostrarTexto(fruta) {
    textoBauEl.innerHTML = `<strong>${esc(fruta.nome)}</strong> — <em>${esc(
      fruta.tipo
    )}</em><br>${esc(fruta.desc)}`;
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
                <img src="${f.img}" alt="${esc(f.nome)}"
                     title="${esc(f.nome)} — ${esc(f.tipo)}&#10;${esc(
          f.desc
        ).replace(/\n/g, " ")}"decoding="async">
              </div>
              <span class="label">${esc(f.nome)}</span>
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
