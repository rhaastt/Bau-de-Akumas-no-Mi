import { bauDeItens } from "./akumasNoMi.js";

document.addEventListener("DOMContentLoaded", function () {
  const btnAbrirBau = document.getElementById("btn-bau");
  const contBau = document.getElementById("container-bau");
  const qtdAtualDeBausEl = document.getElementById("qtd-atual");
  const qtdTotalDeBausEl = document.getElementById("qtd-limite");
  const containerMochilaEl = document.getElementById("container-mochila");
  const mochilaItensEl = document.getElementById("mochila-itens");
  const btnMochila = document.getElementById("btn-mochila");

  const dropItemEl = document.getElementById("dropItem");
  const dropImgEl = document.getElementById("dropImg");
  const dropLegendEl = document.getElementById("dropLegend");

  const SLOT_COUNT = 12;

  function exige(id, el) {
    if (!el) throw new Error(`Elemento com id "${id}" não encontrado no DOM.`);
  }
  exige("btn-bau", btnAbrirBau);
  exige("container-bau", contBau);
  exige("qtd-atual", qtdAtualDeBausEl);
  exige("qtd-limite", qtdTotalDeBausEl);
  exige("container-mochila", containerMochilaEl);
  exige("mochila-itens", mochilaItensEl);
  exige("btn-mochila", btnMochila);
  exige("dropItem", dropItemEl);
  exige("dropImg", dropImgEl);
  exige("dropLegend", dropLegendEl);

  const totalDeBaus = 20;
  let atualDeBaus = 6;
  let aberto = false;
  let busy = false;

  const mochila = [];

  // ===== MODAL DO ITEM =====
  const inventarioItem = document.getElementById("inventarioItem");
  const inventarioItemCard = document.getElementById("inventarioItemCard");
  const inventarioItemImg = document.getElementById("inventarioItemImg");
  const inventarioItemNome = document.getElementById("inventarioItemNome");
  const inventarioItemTipo = document.getElementById("inventarioItemTipo");
  const inventarioItemDescricao = document.getElementById(
    "inventarioItemDescricao"
  );
  const btnFecharCardItemIventario = document.getElementById(
    "btnFecharCardItemIventario"
  );
  exige("inventarioItem", inventarioItem);
  exige("inventarioItemCard", inventarioItemCard);
  exige("inventarioItemImg", inventarioItemImg);
  exige("inventarioItemNome", inventarioItemNome);
  exige("inventarioItemTipo", inventarioItemTipo);
  exige("inventarioItemDescricao", inventarioItemDescricao);
  exige("btnFecharCardItemIventario", btnFecharCardItemIventario);

  function showItemInventario(item) {
    inventarioItemImg.src = item.img;
    inventarioItemImg.alt = item.nome;
    inventarioItemNome.textContent = item.nome;
    inventarioItemTipo.textContent = item.tipo;
    inventarioItemDescricao.textContent = item.desc;
    inventarioItem.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeItemInventario() {
    inventarioItem.classList.add("closing");

    inventarioItemCard.addEventListener(
      "animationend",
      () => {
        inventarioItem.classList.remove("active", "closing");
        document.body.style.overflow = "";
      },
      { once: true }
    );
  }

  btnFecharCardItemIventario.addEventListener("click", closeItemInventario);
  inventarioItem.addEventListener("click", (e) => {
    if (!inventarioItemCard.contains(e.target)) closeItemInventario();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && inventarioItem.classList.contains("active")) {
      closeItemInventario();
    }
  });

  // ===== Hidratar slots pós-render =====
  function hidratarMochilaSlots() {
    // Marca cada slot preenchido com data-idx de acordo com a ordem do array
    const lis = Array.from(mochilaItensEl.querySelectorAll("li.slot"));
    let idxItem = 0;
    for (const li of lis) {
      if (li.classList.contains("vazio")) {
        li.removeAttribute("data-idx");
        continue;
      }
      li.dataset.idx = String(idxItem);
      idxItem += 1;
    }
  }

  // Abrir modal ao clicar em slot preenchido
  mochilaItensEl.addEventListener("click", (e) => {
    const li = e.target.closest("li.slot");
    if (!li || !li.dataset.idx) return;
    const item = mochila[Number(li.dataset.idx)];
    if (item) showItemInventario(item);
  });

  // contador inicial
  qtdTotalDeBausEl.textContent = totalDeBaus;
  qtdAtualDeBausEl.textContent = atualDeBaus;
  atualizarBotao();
  renderMochila();
  hidratarMochilaSlots();

  // ===== util =====
  function preload(src) {
    const im = new Image();
    im.decoding = "async";
    im.loading = "eager";
    im.src = src;
  }

  // Pré-carregar imagens do baú
  preload("imagens/bau-fechado.webp");
  preload("imagens/bau-aberto.webp");

  // Pré-carregar imagens dos itens
  [...bauDeItens.paramecia, ...bauDeItens.logia, ...bauDeItens.zoan].forEach(
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
      btnAbrirBau.textContent = "SEM BAÚS";
      return;
    }
    btnAbrirBau.textContent = aberto ? "ABRIR OUTRO" : "ABRIR BAÚ";
    btnAbrirBau.disabled = busy || (!aberto && atualDeBaus <= 0);
  }

  // sorteio unificado
  function sortearItem() {
    const todosItens = [
      ...bauDeItens.paramecia,
      ...bauDeItens.logia,
      ...bauDeItens.zoan,
    ];
    const i = Math.floor(Math.random() * todosItens.length);
    return todosItens[i];
  }

  // === Mochila (helpers de abrir/fechar/toggle) ===
  const autoAbrirMochilaNoPrimeiroDrop = true;
  let abriuAutomatico = false;

  function restartAnimation(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // força reflow
    el.classList.add(cls);
  }

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }

  function mochilaEstaAberta() {
    return getComputedStyle(containerMochilaEl).display !== "none";
  }

  function abrirMochila() {
    if (mochilaEstaAberta()) return;
    containerMochilaEl.style.display = "grid";
    btnMochila.setAttribute("aria-expanded", "true");
    btnMochila.setAttribute("aria-label", "Fechar mochila");
    if (!prefersReducedMotion()) {
      restartAnimation(containerMochilaEl, "show");
    } else {
      containerMochilaEl.style.opacity = "1";
      containerMochilaEl.style.transform = "none";
    }
  }

  function fecharMochila() {
    if (!mochilaEstaAberta()) return;
    btnMochila.setAttribute("aria-expanded", "false");
    btnMochila.setAttribute("aria-label", "Abrir mochila");

    if (prefersReducedMotion()) {
      containerMochilaEl.classList.remove("show");
      containerMochilaEl.style.display = "none";
      return;
    }

    containerMochilaEl.classList.add("hiding");
    containerMochilaEl.addEventListener(
      "animationend",
      () => {
        containerMochilaEl.classList.remove("hiding", "show");
        containerMochilaEl.style.display = "none";
      },
      { once: true }
    );
  }

  function toggleMochila() {
    if (mochilaEstaAberta()) fecharMochila();
    else abrirMochila();
  }

  btnMochila.addEventListener("click", toggleMochila);

  function renderMochila() {
    const slots = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const item = mochila[i];
      if (item) {
        slots.push(
          `<li class="slot">
            <div class="pad">
              <img src="${esc(item.img)}" alt="${esc(item.nome)}">
            </div>
            <div class="label">${esc(item.nome)}</div>
          </li>`
        );
      } else {
        slots.push(
          `<li class="slot vazio">
            <div class="pad"></div>
            <div class="label">Vazio</div>
          </li>`
        );
      }
    }
    mochilaItensEl.innerHTML = slots.join("");
  }

  let dropTimeoutId = null;
  const VISIBLE_MS = 1400;

  function dropItem() {
    const item = sortearItem();
    mochila.push(item);

    renderMochila();
    hidratarMochilaSlots();

    // imagem e legenda do drop
    dropImgEl.src = item.img;
    dropImgEl.alt = item.nome;
    dropLegendEl.textContent = item.nome;

    // reinicia a animação
    dropItemEl.classList.remove("show");
    void dropItemEl.offsetWidth; // força reflow
    dropItemEl.classList.remove("hidden");
    dropItemEl.classList.add("show");

    // some após um tempo
    clearTimeout(dropTimeoutId);
    dropTimeoutId = setTimeout(() => {
      dropItemEl.classList.remove("show");
      dropItemEl.classList.add("hidden");
    }, VISIBLE_MS);

    if (autoAbrirMochilaNoPrimeiroDrop && !abriuAutomatico) {
      abrirMochila();
      abriuAutomatico = true;
    }
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
      setTimeout(dropItem, ANIM_MS);
    }

    setTimeout(function () {
      busy = false;
      atualizarBotao();
    }, ANIM_MS);
  });
});
