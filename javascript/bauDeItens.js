import { bauDeItens } from "./akumasNoMi.js";

document.addEventListener("DOMContentLoaded", function () {
  const btnAbrirBau = document.getElementById("abrirBauDeItens");
  const contBau = document.getElementById("containerBau");
  const qtdAtualDeBausEl = document.getElementById("qtdAtualDeBaus");
  const qtdTotalDeBausEl = document.getElementById("qtdTotalDeBaus");
  const cardInventarioEl = document.getElementById("card-inventario");
  const inventarioEl = document.getElementById("inventario");

  const textoBauEl = document.getElementById("textoBau");
  const dropItemEl = document.getElementById("dropItem");
  const dropImgEl = document.getElementById("dropImg");
  const dropLegendEl = document.getElementById("dropLegend");
  const abrirInventarioBtn = document.getElementById("abrirInventarioBtn");

  const SLOT_COUNT = 12;

  function exige(id, el) {
    if (!el) throw new Error(`Elemento com id "${id}" não encontrado no DOM.`);
  }
  exige("abrirBauDeItens", btnAbrirBau);
  exige("containerBau", contBau);
  exige("qtdAtualDeBaus", qtdAtualDeBausEl);
  exige("qtdTotalDeBaus", qtdTotalDeBausEl);
  exige("card-inventario", cardInventarioEl);
  exige("inventario", inventarioEl);
  exige("textoBau", textoBauEl);
  exige("dropItem", dropItemEl);
  exige("dropImg", dropImgEl);
  exige("dropLegend", dropLegendEl);
  exige("abrirInventarioBtn", abrirInventarioBtn);

  const totalDeBaus = 10;
  let atualDeBaus = 7;
  let aberto = false;
  let busy = false;

  const inventario = [];

  // ===== MODAL DO ITEM (mantendo ids/variáveis) =====
  const inventarioItem = document.getElementById("inventarioItem");
  const inventarioItemCard = document.getElementById("inventarioItemCard");
  const inventarioItemImg = document.getElementById("inventarioItemImg");
  const inventarioItemNome = document.getElementById("inventarioItemNome");
  const inventarioItemDescricao = document.getElementById("inventarioItemDescricao");;
  const btnFecharCardItemIventario = document.getElementById("btnFecharCardItemIventario");
  
  function showItemInventario(item) {
    inventarioItemImg.src = item.img;
    inventarioItemImg.alt = item.nome;
    inventarioItemNome.textContent = item.nome;
    inventarioItemDescricao.textContent = item.desc;
    inventarioItem.classList.add("active");
    document.body.style.overflow = "hidden";
  }
  function closeItemInventario() {
    const modal = document.getElementById("inventarioItem");
    const card = document.getElementById("inventarioItemCard");

    modal.classList.add("closing");
  
    card.addEventListener("animationend", () => {
      modal.classList.remove("active", "closing");
      document.body.style.overflow = "";
    }, { once: true });
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

  // ===== Hidratar slots pós-render (NÃO altera renderInventario) =====
  function hidratarInventarioSlots() {
    // Marca cada slot preenchido com data-idx de acordo com a ordem do array
    const lis = Array.from(inventarioEl.querySelectorAll("li.slot"));
    let idxItem = 0;
    for (const li of lis) {
      const isVazio = li.classList.contains("vazio");
      if (isVazio) {
        li.removeAttribute("data-idx");
        continue;
      }
      li.dataset.idx = String(idxItem);
      idxItem += 1;
    }
  }

  // Abrir modal ao clicar em slot preenchido
  inventarioEl.addEventListener("click", (e) => {
    const li = e.target.closest("li.slot");
    if (!li || !li.dataset.idx) return;
    const idx = Number(li.dataset.idx);
    const item = inventario[idx];
    if (item) showItemInventario(item);
  });

  // contador inicial
  qtdTotalDeBausEl.textContent = totalDeBaus;
  qtdAtualDeBausEl.textContent = atualDeBaus;
  atualizarBotao();
  renderInventario();
  hidratarInventarioSlots();

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
    return String(s).replace(/[&<>"']/g, (m) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
    ));
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
  function sortearItem() {
    const todosItens = [
      ...bauDeItens.paramecia,
      ...bauDeItens.logia,
      ...bauDeItens.zoan,
    ];
    const i = Math.floor(Math.random() * todosItens.length);
    return todosItens[i];
  }

  // === Inventário (helpers de abrir/fechar/toggle) ===
  const AUTO_ABRIR_inventario_NO_1_DROP = true;
  let abriuAutomatico = false;

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
    abrirInventarioBtn.textContent = "Fechar inventário";
    if (!prefersReducedMotion()) {
      restartAnimation(cardInventarioEl, "show"); // espera classe .show no CSS
    } else {
      cardInventarioEl.style.opacity = "1";
      cardInventarioEl.style.transform = "none";
    }
  }

  function renderInventario() {
  const slots = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const item = inventario[i];
    if (item) {
      slots.push(
        `<li class="slot">
          <div class="pad">
            <img src="${item.img}" alt="${esc(item.nome)}">
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
  inventarioEl.innerHTML = slots.join("");
}


  function fecharInventario() {
    if (getComputedStyle(cardInventarioEl).display === "none") return;
    if (prefersReducedMotion()) {
      cardInventarioEl.style.display = "none";
      abrirInventarioBtn.textContent = "Abrir inventário";
      return;
    }
    cardInventarioEl.classList.add("hiding");
    abrirInventarioBtn.textContent = "Abrir inventário";

    const onEnd = () => {
      cardInventarioEl.classList.remove("hiding", "show");
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

  abrirInventarioBtn.addEventListener("click", toggleInventario);

  let dropTimeoutId = null;
  const VISIBLE_MS = 1400;

  function dropItem() {
    const item = sortearItem();
    inventario.push(item);

    renderInventario();          // mantém sua função
    hidratarInventarioSlots();   // marca data-idx após render
    mostrarTexto(item);

    // imagem e legenda do drop
    dropImgEl.src = item.img;
    dropImgEl.alt = item.nome;
    dropLegendEl.textContent = `${item.nome}`;

    // reinicia a animação
    dropItemEl.classList.remove("show");
    dropItemEl.offsetWidth; // força reflow
    dropItemEl.classList.remove("hidden");
    dropItemEl.classList.add("show");

    // some após um tempo
    clearTimeout(dropTimeoutId);
    dropTimeoutId = setTimeout(() => {
      dropItemEl.classList.remove("show");
      dropItemEl.classList.add("hidden");
    }, VISIBLE_MS);

    if (AUTO_ABRIR_inventario_NO_1_DROP && !abriuAutomatico) {
      abrirInventario();
      abriuAutomatico = true;
    }
  }

  // texto do baú (formatação legível)
  function mostrarTexto(item) {
    textoBauEl.innerHTML = `<strong>${esc(item.nome)}</strong> — <em>${esc(item.tipo)}</em><br>${esc(item.desc)}`;
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
