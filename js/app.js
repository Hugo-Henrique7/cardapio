$(document).ready(function () {
  cardapio.eventos.init();
});

var cardapio = {};
var MEU_CARRINHO = [];
var ITEM_ATUAL_ID = []
var ADICIONAIS = [];
var VALOR_CARRINHO = 0;
var CELULAR_EMPRESA = "5599985118697"

cardapio.eventos = {
  init: () => {
    cardapio.metodos.obterItensCardapio();
    cardapio.metodos.carregarBotaoLigar()
    cardapio.metodos.carregarBotaoReserva();
    cardapio.metodos.controlItensBolo();
  }
};

cardapio.metodos = {
  // Obtém a lista de itens do cardápio
  obterItensCardapio: (categoria = 'Salgados', vermais = false) => {
    var filtro = MENU[categoria];

    if (!vermais) {
      $("#itensCardapio").html('');

      if(filtro.length > 8){
        $("#btnVerMais").removeClass("hidden");
      }else{
        $("#btnVerMais").addClass("hidden");
      }
    }

    $.each(filtro, (i, e) => {
      let temp = cardapio.templates.item.replace(/\${img}/g, e.img)
                                        .replace(/\${nome}/g, e.name)
                                        .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
                                        .replace(/\${id}/g, e.id);

      // Botão "Ver Mais" foi clicado (12 itens)
      if (vermais && i >= 8 && i < 18) {
        $("#itensCardapio").append(temp);
      }

      // Paginação inicial (8 itens)
      if (!vermais && i < 8) {
        $("#itensCardapio").append(temp);
      }
    });
    // Remove o ativo
    $('.container-menu a').removeClass('active');

    // Seta o menu para ativo
    $("#menu-" + categoria).addClass('active');
  },

  // Clique no botão de "Ver Mais"
  verMais: () => {
    var ativo = $(".container-menu a.active").attr('id').split('menu-')[1];
    cardapio.metodos.obterItensCardapio(ativo, true);

    $("#btnVerMais").addClass("hidden");
  },

  // Diminuir a quantidade do item no cardápio
  diminuirQuantidade: (id) => {
    // Busca o item no MENU
    let item = null;
    $.each(MENU, (categoria, itens) => {
      itens.forEach(e => { if(e.id == id) item = e; });
    });

    let min = item && item.min ? item.min : 0;
    let qntdAtual = parseInt($("#qntd-" + id).text());

    if (qntdAtual > min) {
      let unidade = cardapio.metodos.getUnidade(item);
      $("#qntd-" + id).text((qntdAtual - 1) + unidade);
    } else if (min > 0) {
      cardapio.metodos.mensagem(`Já está no valor mínimo (${min}) para este item.`, "red");
    }
  },

  // Aumentar a quantidade do item no cardápio
  aumentarQuantidade: (id) => {
    // Busca o item no MENU
    let item = null;
    $.each(MENU, (categoria, itens) => {
      itens.forEach(e => { if(e.id == id) item = e; });
    });

    let qntdAtual = parseInt($("#qntd-" + id).text());
    let unidade = cardapio.metodos.getUnidade(item);
    if (qntdAtual >= 0) {
      $("#qntd-" + id).text((qntdAtual + 1) + unidade);
    }
  },

  openInfoProduct: (id) => {
    $(".infoProduct").removeClass("hidden")
    ITEM_ATUAL_ID.push(id)
    let itemEncontrado = null;
    let isBolo = false
    let isCento = false
    $.each(MENU, (categoria, itens) => {
      $.each(itens, (i, e) => {
        if(e.id === id){
          itemEncontrado = e;
          if(categoria === "Bolos") isBolo = true;
          if(categoria === "KitSalgados" || categoria === "KitDoces") isCento = true;
          return false
        }
      })
      if(itemEncontrado){
        return false
      }
    })
    if(itemEncontrado){
      $("#info-product-img").css(({
        "background-image": `url(${itemEncontrado.img})`,
        "background-size": "cover",
        "background-position": "center",
        "background-repeat": "no-repeat",
        "width": "90%",
        "height": "90%"
      }))
      $(".info-product-price").text("R$ " + itemEncontrado.price.toFixed(2));
      let unidade = "und";
      let dsc = (itemEncontrado.dsc || "").toLowerCase();
      if (dsc.includes("litro")) unidade = "L";
      else if (dsc.includes("kg") || dsc.includes("quilo")) unidade = "kg";

      let tempButtons = cardapio.templates.buttonsItem
        .replace(/\${id}/g, itemEncontrado.id)
        .replace(/\${unidade}/g,unidade);
      $(".info-product-qntd").html(tempButtons)
      if(isBolo){
        cardapio.metodos.pegarTemplateBolo()
        $(document).off("click", ".btn-adiconar-info").on("click", ".btn-adiconar-info", function () {
           cardapio.metodos.adicionarBoloAoCarrinho();
        });
        $(".info-product-qntd").addClass("hidden");
        $(".btn-adiconar-info").addClass("centralizar-bolo");
      }else if(isCento){
        cardapio.metodos.pegarTemplateCento(itemEncontrado)
        $(".info-product-qntd").removeClass("hidden");
        $(".btn-adiconar-info").removeClass("centralizar-bolo");
        $(document).off("click", ".btn-adiconar-info").on("click", ".btn-adiconar-info", function () {
          cardapio.metodos.adicionarAoCarrinho();
        });
      }
      else {
        let nome = (itemEncontrado.name || "").toLowerCase();
        let dsc = (itemEncontrado.dsc || "").toLowerCase();

        // Detecta unidade pelo texto da descrição
        let isLitro = dsc.includes("litro") || /\b\d+\s*l\b/.test(dsc);
        let isKg = dsc.includes("kg") || dsc.includes("quilo");
        let isCreme = nome.includes("creme") || nome.includes("caldo") || isLitro;
        
        let unidade = isLitro ? "L" : isKg ? "Kg" : "unidades";
        let avisoMinimo = itemEncontrado.min
          ? `<span class="info-obs">Obs: Mínimo ${itemEncontrado.min} ${unidade}</span>`
          : "";

        let obsMsg = isLitro
          ? "<span class='info-obs'>Obs: Escolha a quantidade de litros abaixo!</span>"
          : isKg
            ? "<span class='info-obs'>Obs: Escolha a quantidade de Kg abaixo!</span>"
            : "<span class='info-obs'>Obs: Escolha a quantidade que deseja abaixo!</span>";

        let item = `
          <h2 class="info-product-name">${itemEncontrado.name}</h2>
          ${itemEncontrado.dsc ? `<p class="info-product-dsc">${itemEncontrado.dsc}</p>` : ""}
          <span class="info-price">${"R$ " + itemEncontrado.price.toFixed(2)}</span><br>
          ${itemEncontrado.min ? avisoMinimo : obsMsg}
        `
        $(".info-product-qntd").removeClass("hidden");
        $(".btn-adiconar-info").removeClass("centralizar-bolo");
        $(".content-scrollable").html(item)
        $(document).off("click", ".btn-adiconar-info").on("click", ".btn-adiconar-info", function () {
          if (isCreme || isLitro) {
            cardapio.metodos.adicionarCremeAoCarrinho();
          } else {
            cardapio.metodos.adicionarAoCarrinho();
          }
        });
        if(itemEncontrado.min){
          $("#qntd-" + itemEncontrado.id).text(itemEncontrado.min + cardapio.metodos.getUnidade(itemEncontrado));
        }
      }
    }
  },

  getUnidade: (item) => {
    let dsc = (item.dsc || "").toLowerCase();
    if (dsc.includes("litro")) return "L";
    if (dsc.includes("kg") || dsc.includes("quilo")) return "kg";
    return "und";
  },

  pegarTemplateBolo: () => {
      let recheiosTradiconais = MENU["BoloRecheiosTradicionais"]
      let recheios = MENU["BoloRecheios"]
      let decoracao = MENU["Decoracao"]
      $(".content-scrollable").html("");
      $(".content-scrollable").append(`<div class="mb-2">
        <small class="info-obs">Escolha até 2 Recheios</small><br>
        <strong class="titleAdicionalBolo">Recheios Tradicionais:</strong>
        </div>`);
      $.each(recheiosTradiconais, (i, e) => {
      let temp = cardapio.templates.recheiosTradiconais.replace(/\${nometradicional}/g, e.name)
                                                        .replace(/\${precotradicional}/g, e.price.toFixed(2).replace('.', ','))
                                                        .replace(/\${id}/g, e.id);

      $(".content-scrollable").append(temp);
      })

      $(".content-scrollable").append(`<div class="mb-2 mt-2"><strong class="titleAdicionalBolo">Recheios:</strong></div>`);
      $.each(recheios, (i, e) => {
      let temp = cardapio.templates.recheios.replace(/\${nomerecheio}/g, e.name)
                                            .replace(/\${precorecheio}/g, e.price.toFixed(2).replace('.', ','))
                                            .replace(/\${id}/g, e.id);

      $(".content-scrollable").append(temp);
      })

      $(".content-scrollable").append(`<div class="mb-2 mt-2"><strong class="titleAdicionalBolo">Decorações:</strong></div>`);
      $.each(decoracao, (i, e) => {
      let temp =  cardapio.templates.decoracao.replace(/\${nomedecoracao}/g, e.name)
                                              .replace(/\${precodecoracao}/g, e.price.toFixed(2).replace('.', ','))
                                              .replace(/\${id}/g, e.id);
      $(".content-scrollable").append(temp);

      })

      $(".content-scrollable").append(cardapio.templates.qntdbrigadeiro);
  },

  itensBolosSelecionados: () => {
    let boloItens = [];
    
    // Recheios Tradicionais
    $(".recheiotradicionais input[type='checkbox']:checked").each(function() {
        let id = $(this).attr("id");
        let adicional = MENU["BoloRecheiosTradicionais"].find(a => a.id === id);
        if (adicional) {
            boloItens.push({
                name: adicional.name,
                price: adicional.price
            });
        }
    });

    // Recheios Normais
    $(".recheios input[type='checkbox']:checked").each(function() {
        let id = $(this).attr("id");
        let adicional = MENU["BoloRecheios"].find(a => a.id === id);
        if (adicional) {
            boloItens.push({
                name: adicional.name,
                price: adicional.price
            });
        }
    });

    // Decorações
    $(".decoracao input[type='checkbox']:checked").each(function() {
        let id = $(this).attr("id");
        let adicional = MENU["Decoracao"].find(a => a.id === id);
        if(adicional){
          if (id === "Brigadeiros" && $(".decoracao-select#Brigadeiros").is(":checked")) {
            let qntd = parseInt($("#qntd-brigadeiros").text());
              if (qntd > 0) {
                  boloItens.push({
                      name: `Brigadeiros (${qntd} un)`,
                      price: adicional.price * qntd
                  });
              }
          }
        }else{
          boloItens.push({
              name: adicional.name,
              price: adicional.price
          });
        }
    });
    return boloItens
  },

  controlItensBolo: () => {
    const LIMITE_SELECTS = 2;

    $(document).off("change", ".recheio-select").on("change", ".recheio-select", function () {
      let totalSelecionados = $(".recheio-select:checked").length;
      if (totalSelecionados >= LIMITE_SELECTS) {
        $(".recheio-select:not(:checked)").prop("disabled", true).addClass("checkbox-desativado");
      } else {
        $(".recheio-select").prop("disabled", false).removeClass("checkbox-desativado");
      }
    });

    $(document).off("change", ".decoracao-select").on("change", ".decoracao-select", function () {
      if ($(this).attr("id") === "Brigadeiros"){
        let marcado = $(this).prop("checked");

        if (marcado) {
          $(".qntd-brigadeiro").prop("disabled", false).removeClass("hidden");
          $("#qntd-brigadeiros").text("1");
        } else {
          $(".qntd-brigadeiro").prop("disabled", true).addClass("hidden");
          $("#qntd-brigadeiros").text("0");
        }
      }
    });
  },

  diminuirQuantidadeBrigadeiros: () => {
    let qntdAtual = parseInt($("#qntd-brigadeiros").text());
    if (qntdAtual > 0) {
      $("#qntd-brigadeiros").text(qntdAtual - 1);
    }
  },

  aumentarQuantidadeBrigadeiros: () => {
    let qntdAtual = parseInt($("#qntd-brigadeiros").text());
    $("#qntd-brigadeiros").text(qntdAtual + 1);
  },

  pegarTemplateCento: (item) => {
    $(".content-scrollable").html("")
    let obsQtd = "100 unidades";
    // Verifica se é meio cento ou 50 salgados
    if(item.name.toLowerCase().includes("meio cento")){
      obsQtd = "50 unidades";
    }
    let html = `
      <h2 class="info-product-name">${item.name}</h2>
      <div class="itens-cento-container">
        <p class="info-product-dsc">${item.dsc}</p>
        <span class="info-price">${"R$ " + item.price.toFixed(2)}</span>
        </br>
        <span class="info-obs">Obs: Escolha a quantidade que deseja abaixo!</br>
              Obs: 1 quantidade igual a ${obsQtd}!
        </span>
      </div>
    `
    $(".content-scrollable").html(html);
  },

  closeInfoProduct: () => {
    $(".infoProduct").addClass("hidden")
    ITEM_ATUAL_ID = []
  },

  adicionarBoloAoCarrinho: () => {
    let id = ITEM_ATUAL_ID;
    let adicionaisBolo = cardapio.metodos.itensBolosSelecionados()
    let totalAdicionais = adicionaisBolo.reduce((soma, atual) => soma + atual.price, 0);
    let categoria = $(".container-menu a.active").attr("id").split("menu-")[1];
    let filtro = MENU[categoria]

    if(adicionaisBolo.length === 0){
      return alert("Você não escolheu nenhum item para o bolo")
    }

    let item = filtro.find(e => e.id == id);

    let newBolo ={
      id: item.id,
      name: item.name,
      qntd: 1,
      price: totalAdicionais,
      img: item.img,
      tipo: "bolo",
      adicionais: adicionaisBolo
    }

    MEU_CARRINHO.push(newBolo)
    console.log("Bolo adicionado ao carrinho:", newBolo);
    cardapio.metodos.atualizarBadgeTotal();
    cardapio.metodos.closeInfoProduct();
  },

  adicionarCremeAoCarrinho: () => {
    let id = ITEM_ATUAL_ID;
    let qntdAtual = parseInt($("#qntd-" + id).text());
    let categoria = $(".container-menu a.active").attr("id").split("menu-")[1];
    let filtro = MENU[categoria];
    let item = filtro.find(e => e.id == id);

    if (qntdAtual > 0 && item) {
      // Cria um novo objeto para cada adição, com id único
      let novoCreme = {
        ...item,
        qntd: qntdAtual,
        id: item.id + '-' + Date.now(), // id único para cada adição
        tipo: "creme"
      };
      MEU_CARRINHO.push(novoCreme);
      cardapio.metodos.mensagem("Item adicionado ao carrinho", "green");
      $("#qntd-" + id).text(item.min || 0);
      cardapio.metodos.atualizarBadgeTotal();
    }
    cardapio.metodos.closeInfoProduct();
  },

  //Adiciona ao Carrinho o item do cardápio
  adicionarAoCarrinho: () => {
    id = ITEM_ATUAL_ID;
    console.log("Adicionando ao carrinho o item com ID:", id);
    let qntdAtual = parseInt($("#qntd-" + id).text());

    console.log("Quantidade atual:", qntdAtual);
    if(qntdAtual > 0){
      var categoria = $(".container-menu a.active").attr("id").split("menu-")[1];
      console.log("Categoria ativa:", categoria); 
      //obtem a lista de itens
      let filtro = MENU[categoria];

      let item = $.grep(filtro, (e, i) => {return e.id == id});

      if(item.length > 0){

        let existe = $.grep(MEU_CARRINHO, (elem, index) => {return elem.id == id})

        // caso já exista o item no carrinho, só altera a quantidade
        if(existe.length > 0){
          let objIndex = MEU_CARRINHO.findIndex((obj => obj.id == id));
          MEU_CARRINHO[objIndex].qntd += qntdAtual;
          console.log("Quantidade atualizada no carrinho:", MEU_CARRINHO[objIndex].qntd);
        }
        // caso ainda não exista o item no carrinho, adiciona ele
        else{
          item[0].qntd = qntdAtual
          MEU_CARRINHO.push(item[0])
          console.log("Item adicionado ao carrinho:", item[0]);
        }
        
        cardapio.metodos.mensagem("Item adicionado ao carrinho", "green")
        $("#qntd-" + id).text(0)

        cardapio.metodos.atualizarBadgeTotal();
      }
    }
    cardapio.metodos.closeInfoProduct();
  },

  //Atualizar o badge de totals dos botões "Meu carrinho"
  atualizarBadgeTotal: () => {

    var total = 0;

    $.each(MEU_CARRINHO, (i, e) => {
      total += e.qntd
    })

    if (total > 0) {
      $(".botao-carrinho").removeClass("hidden");
      $(".container-total-carrinho").removeClass("hidden");
    }
    else{
      $(".botao-carrinho").addClass("hidden");
      $(".container-total-carrinho").addClass("hidden");
    }

    $(".badge-total-carrinho").html(total);
  },

  //Abrir a modal de carrinho
  abrirCarrinho: (abrir) => {
    event.preventDefault()
    if(abrir){
      $("#modalcarrinho").removeClass("hidden");
      cardapio.metodos.carregarCarrinho()
    }else{
      $("#modalcarrinho").addClass("hidden");
    }
  },

  //Altera os textos e exibe botões das etapas
  carregarEtapa: (etapa) => {
    if(etapa == 1){
      $("#lblTituloEtapa").text("Seu carrinho:");
      $("#itensCarrinho").removeClass("hidden");
      $("#localEntrega").addClass("hidden");
      $("#resumoCarrinho").addClass("hidden")

      $(".etapa").removeClass("active");
      $(".etapa1").addClass("active");

      $("#btnEtapaPedido").removeClass("hidden");
      $("#btnEtapaEndereco").addClass("hidden");
      $("#btnEtapaResumo").addClass("hidden");
      $("#btnVoltar").addClass("hidden");
    }

    if(etapa == 2){
      $("#lblTituloEtapa").text("Resumo do Pedido:");
      $("#itensCarrinho").addClass("hidden");
      $("#localEntrega").addClass("hidden");
      $("#resumoCarrinho").removeClass("hidden")

      $(".etapa").removeClass("active");
      $(".etapa1").addClass("active");
      $(".etapa2").addClass("active");

      $("#btnEtapaPedido").addClass("hidden");
      $("#btnEtapaEndereco").addClass("hidden");
      $("#btnEtapaResumo").removeClass("hidden");
      $("#btnVoltar").removeClass("hidden");

      cardapio.metodos.carregarResumo();
    }
  },

  //botão de voltar etapa
  voltarEtapa: () => {
    let etapa = $(".etapa.active").length; 
    cardapio.metodos.carregarEtapa(etapa - 1);
  },

  //carrega a lista de itens do carrinho
  carregarCarrinho: () => {
  cardapio.metodos.carregarEtapa(1);

  if (MEU_CARRINHO.length > 0) {
    $("#itensCarrinho").html("");

    $.each(MEU_CARRINHO, (i, e) => {
      let adicionaisHtml = "";
      let tempAdicionais = "";

      // Se o item for um bolo com adicionais
      if (e.tipo === "bolo" && e.adicionais && e.adicionais.length > 0) {
        // Cria os itens do dropdown
        adicionaisHtml = e.adicionais.map(adicional => `
          <li><a class="dropdown-item" href="#">${"+" + adicional.name + " R$" + adicional.price.toFixed(2).replace('.', ',')}</a></li>
        `).join("");

        // Monta o dropdown com os adicionais
        tempAdicionais = `
          <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown">
              Adicionais do Bolo
            </button>
            <ul class="dropdown-menu">
              ${adicionaisHtml}
            </ul>
          </div>`;
      }

      // Exemplo para carregarCarrinho e carregarResumo
      let unidade = "und";
      let dsc = (e.dsc || "").toLowerCase();
      if (dsc.includes("litro")) unidade = "L";
      else if (dsc.includes("kg") || dsc.includes("quilo")) unidade = "kg";

      // Renderiza o item no carrinho usando o template
      let temp = cardapio.templates.itemCarrinho
        .replace(/\${img}/g, e.img)
        .replace(/\${nome}/g, e.name)
        .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
        .replace(/\${id}/g, e.id)
        .replace(/\${qntd}/g, e.qntd)
        .replace(/\${unidade}/g, unidade)
        .replace(/\${adicionais}/g, tempAdicionais);

      $("#itensCarrinho").append(temp);

      if ((i + 1) === MEU_CARRINHO.length) {
        cardapio.metodos.carregarValores();
      }
    });
  } else {
    $("#itensCarrinho").html('<p class="carrinho-vazio"><i class="fa fa-shopping-bag"></i> Seu Carrinho está vazio</p>');
  }
  },

  //Diminuir Quantidade do Item no carrinho
  diminuirQuantidadeCarrinho: (id) => {
    let qntdAtual = parseInt($("#qntd-carrinho-" + id).text());
    let item = MEU_CARRINHO.find(e => e.id === id);
    let unidade = cardapio.metodos.getUnidade(item);
    if (qntdAtual > 1) {
      $("#qntd-carrinho-" + id).text((qntdAtual - 1) + unidade);
      cardapio.metodos.atualizarCarrinho(id, qntdAtual - 1)
    }else{
      cardapio.metodos.removerItemCarrinho(1)
    }
  },

  //Diminuir quantidade do item no carrinho
  aumentarQuantidadeCarrinho: (id) => {
    let qntdAtual = parseInt($("#qntd-carrinho-" + id).text());
    let item = MEU_CARRINHO.find(e => e.id === id);
    let unidade = cardapio.metodos.getUnidade(item);
    $("#qntd-carrinho-" + id).text((qntdAtual + 1) + unidade);
    cardapio.metodos.atualizarCarrinho(id, qntdAtual + 1)
  },

  // Botão de remover item do carrinho
  removerItemCarrinho: (id) => {
    MEU_CARRINHO = $.grep(MEU_CARRINHO, (e, i) => {return e.id != id});
    cardapio.metodos.carregarCarrinho();

    //Atualiza o botão carrinho com a quantidade atualizada
    cardapio.metodos.atualizarBadgeTotal();
    cardapio.metodos.carregarValores()
  },

  //Atualiza o carrinho com a quantidade atual
  atualizarCarrinho: (id, qntd) => {
    let objIndex = MEU_CARRINHO.findIndex((obj => obj.id == id))
    MEU_CARRINHO[objIndex].qntd = qntd;

    // Atualiza o botão carrinho com a quantidade atualizada
    cardapio.metodos.atualizarBadgeTotal()

    // Atualiza os valores de SubTotal, Entrega e Total
    cardapio.metodos.carregarValores()
  },

  //carrega os valores de subTotal, Entrga e Total
  carregarValores: () => {
    VALOR_CARRINHO = 0

    $("#lblSubTotl").text("R$ 0,00");
    $("#lblValorTotal").text("R$ 0,00");

    $.each(MEU_CARRINHO, (i, e) => {
      VALOR_CARRINHO += parseFloat(e.price * e.qntd);

      if((i + 1) == MEU_CARRINHO.length){
        $("#lblSubTotl").text(`R$ ${VALOR_CARRINHO.toFixed(2).replace(".", ",")}`);
        $("#lblValorTotal").text(`R$ ${VALOR_CARRINHO.toFixed(2).replace(".", ",")}`);
      }
    })
  },

  //Carrega a etapa de Resumo do pedido
  carregarResumo: () => {
    $("#listaItensResumo").html("");

    $.each(MEU_CARRINHO, (i, e) => {
    let unidade = "und";
    let dsc = (e.dsc || "").toLowerCase();
    if (dsc.includes("litro")) unidade = "L";
    else if (dsc.includes("kg") || dsc.includes("quilo")) unidade = "kg";

      let temp = cardapio.templates.itemResumo.replace(/\${img}/g, e.img)
        .replace(/\${nome}/g, e.name)
        .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
        .replace(/\${qntd}/g, e.qntd)
        .replace(/\${unidade}/g, unidade);

      $("#listaItensResumo").append(temp);
    });

    cardapio.metodos.finalizarPedido()
  },

  //Atualiza o link do botão do whatsApp
  finalizarPedido: () => {
  if (MEU_CARRINHO.length > 0) {
    let texto = "🛒 *PEDIDO - katedral eventos * 🛒\n\n";
    texto += "📋 *DETALHES DO PEDIDO*\n\n";
    texto += "⏱️ *Data/Hora:* " + new Date().toLocaleString() + "\n\n";
    texto += "🍱 *ITENS:*\n";
    texto += "════════════════════════\n";
    
    $.each(MEU_CARRINHO, (i, e) => {
      // Detecta se é cento ou meio cento
      let typeProduct = cardapio.metodos.getUnidade(e);
      let nome = (e.name || "").toLowerCase();
      let qtdTexto = "";
      if (
        nome.includes("meio cento") ||
        nome.includes("50 salgados") ||
        (nome.includes("50") && !nome.includes("100"))
      ) {
        qtdTexto = " (50 unidades)";
      } else if (
        nome.includes("cento") ||
        nome.includes("100")
      ) {
        qtdTexto = " (100 unidades)";
      }
      texto += `\n🍽️ *${e.qntd}${typeProduct} ${e.name}${qtdTexto}* - R$ ${(e.price * e.qntd).toFixed(2).replace('.', ',')}\n`;
      if (e.adicionais && e.adicionais.length > 0) {
        texto += `   ┌───────────────────\n`;
        e.adicionais.forEach(adicional => {
          texto += `   │ ✨ ${adicional.name} (+ R$ ${adicional.price.toFixed(2).replace('.', ',')})\n`;
        });
        texto += `   └───────────────────\n`;
      } else {
        texto += `   └ *Sem adicionais*\n`;
      }
    });

    texto += "\n💰 *VALORES*\n";
    texto += "════════════════════════\n";
    texto += `   Subtotal: R$ ${VALOR_CARRINHO.toFixed(2).replace('.', ',')}\n`;
    texto += `   *TOTAL: R$ ${VALOR_CARRINHO.toFixed(2).replace('.', ',')}*\n\n`;

    texto += "\n📝 *OBSERVAÇÕES:*\n";
    texto += "   (Por favor, informe qualquer observação adicional)\n\n";
    texto += "🔄 *Caso precise alterar algo, por favor avise!*\n";

    let encode = encodeURIComponent(texto);
    let URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;

    $("#btnEtapaResumo").attr("href", URL).removeClass("hidden");
    console.log("URL do WhatsApp:", URL);
  }
},

  abrirDepoimento: (depoimento) => {

    $("#depoimento-1").addClass("hidden");
    $("#depoimento-2").addClass("hidden");
    $("#depoimento-3").addClass("hidden");

    $("#btnDepoimento-1").removeClass("active");
    $("#btnDepoimento-2").removeClass("active");
    $("#btnDepoimento-3").removeClass("active");

    $("#depoimento-" + depoimento).removeClass("hidden");
    $("#btnDepoimento-" + depoimento).addClass("active");
  },

  //Carrega o link do botão reserva
  carregarBotaoReserva: () => {
    var texto = "Olá! gostaria de fazer uma *reserva*";

    let encode = encodeURI(texto)
    let URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;

    $("#btnReserva").attr("href", URL);
  },

  //carrega o botão de ligar
  carregarBotaoLigar: () => {
    $("#btnLigar").attr("href", `tel:${CELULAR_EMPRESA}`)
  },

  //mensagens
  mensagem: (texto, cor = "red", tempo = 3500) => {
    let id = Math.floor(Date.now() * Math.random()).toString()

    let msg = `<div id="msg-${id}" class="animated fadeInDown toast ${cor}">${texto}</div>`

    $("#container_mensagens").append(msg);

    setTimeout(() => {
      $("#msg-" + id).removeClass("fadeInDown");
      $("#msg-" + id).addClass("fadeOutUp");
      setTimeout(()=>{
        $("#msg-" + id).remove();
      }, 800);
    }, tempo);
  }
};

cardapio.templates = {
  item: `
  <div class="col-12 col-lg-3 col-md-3 col-sm-6 mb-5 animated fadeInUp">
    <div class="card card-item" id="\${id}">
      <div class="img-produto">
        <img src="\${img}"/>
      </div>
      <p class="title-produto text-center mt-4">
        <b>\${nome}</b>
      </p>
      <p class="price-produto text-center">
        <b>\${preco}</b>
      </p>
      <div class="add-carrinho">
        <span class="btn btn-add" onclick="cardapio.metodos.openInfoProduct('\${id}')">Eu quero</span>
      </div>
    </div>
  </div>
  `,

  buttonsItem: `
    <span class="btn-menos" onclick="cardapio.metodos.diminuirQuantidade('\${id}')"><i class="fas fa-minus"></i></span>
    <span class="add-numero-itens" id="qntd-\${id}">0\${unidade}</span>
    <span class="btn-mais" onclick="cardapio.metodos.aumentarQuantidade('\${id}')"><i class="fas fa-plus"></i></span>
  `,

  recheiosTradiconais: `
    <div class="recheiotradicionais bolo-recheios mt-0">
      <div class="d-flex justify-content-between align-items-center border-bottom adicional-item">
        <label class="d-flex flex-column" for="\${idtradicional}">
          <span><strong>\${nometradicional}</strong></span>
          <small class="price-adicional">&#43;\${precotradicional}</small>
        </label>
        <input class="bg-tertiary check-input recheio-select" type="checkbox" name="\${id}" id="\${id}">
      </div>
    </div>
  `,

  recheios: `
    <div class="recheios bolo-recheios">
        <div class="d-flex justify-content-between align-items-center border-bottom adicional-item">
          <label class="d-flex flex-column" for="\${idrecheio}">
            <span><strong>\${nomerecheio}</strong></span>
            <small class="price-adicional">&#43;\${precorecheio}</small>
          </label>
          <input class="bg-tertiary check-input recheio-select" type="checkbox" name="\${id}" id="\${id}">
        </div>
    </div>
  `,

  decoracao: `
    <div class="decoracao">
      <div class="d-flex justify-content-between align-items-center border-bottom adicional-item">
        <label class="d-flex flex-column" for="\${iddecoracao}">
          <span><strong>\${nomedecoracao}</strong></span>
          <small class="price-adicional">&#43;\${precodecoracao}</small>
        </label>
        <input class="bg-tertiary check-input decoracao-select" type="checkbox" name="\${iddecoracao}" id="\${id}">
      </div>
    </div>
  `,

  qntdbrigadeiro: `
    <div class="hidden qntd-brigadeiro mt-2 d-flex justify-content-around">
      <strong class="titleAdicionalBolo">Informe a Quantidade:</strong>
      <div>
        <span class="btn-menos" onclick="cardapio.metodos.diminuirQuantidadeBrigadeiros()"><i class="fas fa-minus"></i></span>
        <span class="add-numero-itens" id="qntd-brigadeiros">0</span>
        <span class="btn-mais" onclick="cardapio.metodos.aumentarQuantidadeBrigadeiros()"><i class="fas fa-plus"></i></span>
      </div>
    </div>
  `,

  itemCarrinho: `
    <div class="col-12 item-carrinho">
      <div class="img-produto">
        <img src="\${img}"/>
      </div>
      <div class="dados-produto">
        <p class="title-produto"><b>\${nome}</b></p>
        <p class="price-produto"><b>\${preco}</b></p>
        <div class="carrinho-item-adicionais">
         \${adicionais}
        </div>
      </div>
      <div class="add-carrinho">
      <span class="btn-menos" onclick="cardapio.metodos.diminuirQuantidadeCarrinho('\${id}')"><i class="fas fa-minus"></i></span>
      <span class="add-numero-itens" id="qntd-carrinho-\${id}">\${qntd}\${unidade}</span>
      <span class="btn-mais" onclick="cardapio.metodos.aumentarQuantidadeCarrinho('\${id}')"><i class="fas fa-plus"></i></span>
      <span class="btn btn-remove" onclick="cardapio.metodos.removerItemCarrinho('\${id}')"><i class="fa fa-times"></i></span>
      </div>
    </div>
  `,

  itemResumo: `
      <div class="col-12 item-carrinho resumo">
        <div class="img-produto-resumo">
          <img src="\${img}" alt="">
        </div>
        <div class="dados-produto">
          <p class="title-produto-resumo">
            <b>\${nome}</b>
          </p>
          <p class="price-produto-resumo">
            <b>R$ \${preco}</b>
          </p>
        </div>
        <p class="quantidade-produto-resumo">
          <b>\${qntd}\${unidade}</b>
        </p>
      </div>
   `
};