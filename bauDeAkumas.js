document.addEventListener("DOMContentLoaded", function () {
  const btnAbrir = document.getElementById("abrirBau");
  const contBau = document.getElementById("containerBau");
  const qtdAtualEl = document.getElementById("qtdAtual");
  const qtdTotalEl = document.getElementById("qtdTotal");
  const inventarioEl = document.getElementById("inventario");
  const textoBauEl = document.getElementById("textoBau");

  const total = 5;
  let atual = 5;
  let aberto = false;
  let busy = false;

  const bauDeAkumas = {
    paramecia: [
      {
        nome: "Gomu Gomu no Mi",
        tipo: "Paramecia",
        img: "imagens/gomu-gomu.webp",
        desc: "Concede ao usuário um corpo elástico, imune a impactos rombudos.",
      },
      {
        nome: "Ope Ope no Mi",
        tipo: "Paramecia",
        img: "imagens/gomu-gomu.webp",
        desc: "Permite criar uma sala esférica onde o usuário manipula tudo livremente.",
      },
      {
        nome: "Bara Bara no Mi",
        tipo: "Paramecia",
        img: "imagens/gomu-gomu.webp",
        desc: "Permite dividir o corpo em partes independentes e controlá-las.",
      },
      {
        nome: "Awa Awa no Mi",
        tipo: "Paramecia",
        img: "imagens/gomu-gomu.webp",
        desc: "Cria bolhas que limpam e reduzem atrito, enfraquecendo inimigos.",
      },
      {
        nome: "Gura Gura no Mi",
        tipo: "Paramecia",
        img: "imagens/gomu-gomu.webp",
        desc: "Cria terremotos e ondas sísmicas, considerada uma das mais destrutivas.",
      },
    ],
    logia: [
      {
        nome: "Mera Mera no Mi",
        tipo: "Logia",
        img: "imagens/gomu-gomu.webp",
        desc: "Permite criar, controlar e se transformar em fogo.",
      },
      {
        nome: "Suna Suna no Mi",
        tipo: "Logia",
        img: "imagens/gomu-gomu.webp",
        desc: "Permite controlar e se tornar areia, drenando umidade do ambiente.",
      },
      {
        nome: "Hie Hie no Mi",
        tipo: "Logia",
        img: "imagens/gomu-gomu.webp",
        desc: "Permite criar e controlar gelo, congelando vastas áreas.",
      },
      {
        nome: "Yami Yami no Mi",
        tipo: "Logia",
        img: "imagens/gomu-gomu.webp",
        desc: "Permite manipular a escuridão e anular poderes de outras Akumas.",
      },
    ],
    zoan: [
      {
        nome: "Hito Hito no Mi",
        tipo: "Zoan",
        img: "imagens/gomu-gomu.webp",
        desc: "Transforma um animal em humanoide com inteligência superior.",
      },
      {
        nome: "Tori Tori no Mi [Modelo: Fênix]",
        tipo: "Zoan Mítica",
        img: "imagens/gomu-gomu.webp",
        desc: "Permite se transformar em uma fênix, com chamas azuis que curam ferimentos.",
      },
      {
        nome: "Ushi Ushi no Mi [Modelo: Bisonte]",
        tipo: "Zoan",
        img: "imagens/gomu-gomu.webp",
        desc: "Permite se transformar em um bisonte ou híbrido.",
      },
      {
        nome: "Hito Hito no Mi [Modelo: Daibutsu]",
        tipo: "Zoan Mítica",
        img: "imagens/gomu-gomu.webp",
        desc: "Transforma o usuário em um grande Buda dourado com poderes místicos.",
      },
    ],
  };

  const inventario = [];

  // contador inicial
  qtdTotalEl.textContent = total;
  qtdAtualEl.textContent = atual;

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

  function atualizarContador() {
    qtdAtualEl.textContent = atual;
    if (atual === 0 && !aberto) {
      btnAbrir.disabled = true;
      btnAbrir.textContent = "Sem Baús";
    }
  }

  // sorteio unificado
  function sortearAkuma() {
    const todas = [
      ...bauDeAkumas.paramecia,
      ...bauDeAkumas.logia,
      ...bauDeAkumas.zoan,
    ];
    const i = Math.floor(Math.random() * todas.length);
    return todas[i];
  }

  // texto do baú (formatação legível)
  function mostrarTexto(fruta) {
    textoBauEl.innerHTML = `<strong>${fruta.nome}</strong> — <em>${fruta.tipo}</em><br>${fruta.desc}`;
  }

  const SLOT_COUNT = 12;

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
  function dropFruta() {
    const fruta = sortearAkuma();
    inventario.push(fruta);
    renderInventario();
    mostrarTexto(fruta);
  }

  btnAbrir.addEventListener("click", function () {
    if (busy) return;

    if (!aberto && atual <= 0) {
      btnAbrir.disabled = true;
      btnAbrir.textContent = "Sem Baús";
      return;
    }

    busy = true;

    if (!aberto) {
      atual -= 1;
      atualizarContador();
    }

    aberto = !aberto;
    contBau.classList.toggle("open", aberto);
    btnAbrir.textContent = aberto ? "Fechar Baú" : "Abrir Baú";

    const ANIM_MS = 380;

    if (aberto) {
      setTimeout(dropFruta, ANIM_MS);
    }

    setTimeout(function () {
      busy = false;
    }, ANIM_MS);
  });
});
