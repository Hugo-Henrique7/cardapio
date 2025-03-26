$(document).ready(function () {
  cardapio.eventos.init();
});

var cardapio = {};
var MEU_CARRINHO = [];
var ADICIONAIS = [];
var ITEMIDATUAL = null;
var MEU_ENDERECO = null;
var VALOR_CARRINHO = 0;
var VALOR_ENTREGA = 5;
var CELULAR_EMPRESA = "5599981969893"

cardapio.eventos = {
  init: () => {
    cardapio.metodos.obterItensCardapio();
    cardapio.metodos.carregarBotaoLigar()
    cardapio.metodos.carregarBotaoReserva();
  }
};

cardapio.metodos = {
  // Obtém a lista de itens do cardápio
  obterItensCardapio: (categoria = 'Shawarma', vermais = false) => {
    var filtro = MENU[categoria];
    console.log(filtro);

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
      if (vermais && i >= 8 && i < 12) {
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
    let qntdAtual = parseInt($("#qntd-" + id).text());

    if (qntdAtual > 0) {
      $("#qntd-" + id).text(qntdAtual - 1);
    }
  },

  // Aumentar a quantidade do item no cardápio
  aumentarQuantidade: (id) => {
    let qntdAtual = parseInt($("#qntd-" + id).text());

    if (qntdAtual >= 0) {
      $("#qntd-" + id).text(qntdAtual + 1);
    }
  },

  //Adiciona ao Carrinho o item do cardápio
  adicionarAoCarrinho: (id) => {
    id = ITEMIDATUAL;
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
    cardapio.metodos.fecharModalAdicionais();
  },

  abrirModalAdicionais: (id) => {
    console.log("Abrindo modal para o tem com ID:" + id)
    let qntd = parseInt($("#qntd-" + id).text())
    if(qntd > 0){
      let adicionaisHtml = '';
      $.each(MENU["Adicionais"], (i, e) => {
        let temp = cardapio.templates.itemAdicional.replace(/\${nome}/g, e.name)
          .replace(/\${preco}/g, e.price.toFixed(2).replace(".", ","))
          .replace(/\${id}/g, e.id)
        adicionaisHtml += temp;
      })
      $("#modalAdicionaisLista").html(adicionaisHtml);
      $("#modalAdicionais").removeClass("hidden");
      ITEMIDATUAL = id; // Armazena o ID do item atual
    }else{
      alert("Você ainda não escolheu a quantidade!!!")
    }
  },
 
  fecharModalAdicionais: () => {
    $("#modalAdicionais").addClass("hidden");
    ITEMIDATUAL = null;
    console.log("Fechando modal de adicionais")
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
      $("#lblTituloEtapa").text("Endereço de entrega: ");
      $("#itensCarrinho").addClass("hidden");
      $("#localEntrega").removeClass("hidden");
      $("#resumoCarrinho").addClass("hidden")

      $(".etapa").removeClass("active");
      $(".etapa1").addClass("active");
      $(".etapa2").addClass("active");

      $("#btnEtapaPedido").addClass("hidden");
      $("#btnEtapaEndereco").removeClass("hidden");
      $("#btnEtapaResumo").addClass("hidden");
      $("#btnVoltar").removeClass("hidden");
    }

    if(etapa == 3){
      $("#lblTituloEtapa").text("Resumo do Pedido:");
      $("#itensCarrinho").addClass("hidden");
      $("#localEntrega").addClass("hidden");
      $("#resumoCarrinho").removeClass("hidden")

      $(".etapa").removeClass("active");
      $(".etapa1").addClass("active");
      $(".etapa2").addClass("active");
      $(".etapa3").addClass("active");

      $("#btnEtapaPedido").addClass("hidden");
      $("#btnEtapaEndereco").addClass("hidden");
      $("#btnEtapaResumo").removeClass("hidden");
      $("#btnVoltar").removeClass("hidden");
    }
  },

  //botão de voltar etapa
  voltarEtapa: () => {
    let etapa = $(".etapa.active").length; 
    cardapio.metodos.carregarEtapa(etapa - 1);
  },

  //carrega a lista de itens do carrinho
  carregarCarrinho: () => {

    cardapio.metodos.carregarEtapa(1)

    if(MEU_CARRINHO.length > 0){

      $("#itensCarrinho").html("");

      $.each(MEU_CARRINHO, (i, e) => {
        let temp = cardapio.templates.itemCarrinho.replace(/\${img}/g, e.img)
        .replace(/\${nome}/g, e.name)
        .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
        .replace(/\${id}/g, e.id)
        .replace(/\${qntd}/g, e.qntd);

        $("#itensCarrinho").append(temp);

        // Último item
        if((i + 1) == MEU_CARRINHO.length){
          cardapio.metodos.carregarValores();
        }
      })
    }else{$("#itensCarrinho").html('<p class="carrinho-vazio"><i class="fa fa-shopping-bag"></i> Seu Carrinho está vazio</p>')
      
    }
  },

  //Diminuir Quantidade do Item no carrinho
  diminuirQuantidadeCarrinho: (id) => {
    let qntdAtual = parseInt($("#qntd-carrinho-" + id).text());

    if (qntdAtual > 1) {
      $("#qntd-carrinho-" + id).text(qntdAtual - 1);
      cardapio.metodos.atualizarCarrinho(id, qntdAtual - 1)
    }else{
      cardapio.metodos.removerItemCarrinho(1)
    }
  },

  //Diminuir quantidade do item no carrinho
  aumentarQuantidadeCarrinho: (id) => {
    let qntdAtual = parseInt($("#qntd-carrinho-" + id).text());
    $("#qntd-carrinho-" + id).text(qntdAtual + 1);
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
    $("#lblValorEntrega").text("+ R$ 0,00");
    $("#lblValorTotal").text("R$ 0,00");

    $.each(MEU_CARRINHO, (i, e) => {
      VALOR_CARRINHO += parseFloat(e.price * e.qntd);

      if((i + 1) == MEU_CARRINHO.length){
        $("#lblSubTotl").text(`R$ ${VALOR_CARRINHO.toFixed(2).replace(".", ",")}`);
        $("#lblValorEntrega").text(`R$ ${VALOR_ENTREGA.toFixed(2).replace(".", ",")}`);
        $("#lblValorTotal").text(`R$ ${(VALOR_CARRINHO + VALOR_ENTREGA).toFixed(2).replace(".", ",")}`);
      }
    })
    
  },

  carregarEndereco: () => {
    if(MEU_CARRINHO.length <= 0){
      cardapio.metodos.mensagem("Seu Carrinho está vazio");
      return;
    }
    cardapio.metodos.carregarEtapa(2);
  },

  // API ViaCEP
  buscarCep: () => {
    // Cria uma váriável com o valor do cep
    var cep = $("#txtCEP").val().trim().replace(/\D/g, '');

    // Verifica se o cep possui valor informado
    if(cep != ""){
      var validacep = /^[0-9]{8}$/;

      if(validacep.test(cep)){
        $.getJSON(`https://viacep.com.br/ws/${cep}/json/?callback=?`, (dados) => {
          if(!("erro" in dados)){
            //Atualiza campos e valores retornados
            $("#txtEndereco").val(dados.logradouro)
            $("#txtBairro").val(dados.bairro)
            $("#txtCidade").val(dados.localidade)
            $("#txtUf").val(dados.uf)
            $("#txtNumero").focus()

          }else{
            cardapio.metodos.mensagem("CEP não envontrado. Preencha as informações manualmente")
            $("#txtEndereco").focus();
          }
        })
      }else{
        cardapio.metodos.mensagem("Formato do CEP inválido.")
        $("#txtCEP").focus();
      }
    }else{
      cardapio.metodos.mensagem("Informe o CEP, por favor!");
      $("#txtCEP").focus();
    }
  },

  // Validação antes de prosseguir para etapa 3
  resumoPedido: () => {
    let cep = $("#txtCEP").val().trim();
    let endereco = $("#txtEndereco").val().trim();
    let bairro = $("#txtBairro").val().trim();
    let cidade = $("#txtCidade").val().trim();
    let uf = $("#ddlUf").val().trim();
    let numero = $("#txtNumero").val().trim();
    let complemento = $("#txtComplemento").val().trim();

    if(cep.length <= 0 ){
      cardapio.metodos.mensagem("Informe o CEP, por favor")
      $("#txtCEP").focus();
      return;
    }

    if(endereco.length <= 0 ){
      cardapio.metodos.mensagem("Informe o Endereço, por favor")
      $("#txtEndereco").focus();
      return;
    }

    
    if(bairro.length <= 0 ){
      cardapio.metodos.mensagem("Informe o Bairro, por favor")
      $("#txtBairro").focus();
      return;
    }

    
    if(cidade.length <= 0 ){
      cardapio.metodos.mensagem("Informe a Cidade, por favor")
      $("#txtCidade").focus();
      return;
    }

    
    if(uf == "-1" ){
      cardapio.metodos.mensagem("Informe a UF, por favor")
      $("#ddlUf").focus();
      return;
    }

    
    if(numero.length <= 0 ){
      cardapio.metodos.mensagem("Informe o Número, por favor")
      $("#txtNumero").focus();
      return;
    }

    MEU_ENDERECO = {
      cep: cep,
      endereco: endereco,
      bairro: bairro,
      cidade: cidade,
      uf: uf,
      numero: numero,
      complemento: complemento
    }

    cardapio.metodos.carregarEtapa(3);
    cardapio.metodos.carregarResumo()
  },

  //Carrega a etapa de Resumo do pedido
  carregarResumo: () => {
    $("#listaItensResumo").html("");

    $.each(MEU_CARRINHO, (i, e) => {
      let temp = cardapio.templates.itemResumo.replace(/\${img}/g, e.img)
        .replace(/\${nome}/g, e.name)
        .replace(/\${preco}/g, e.price.toFixed(2).replace('.', ','))
        .replace(/\${qntd}/g, e.qntd);

      $("#listaItensResumo").append(temp);
    });

    $("#resumoEndereco").html(`${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro}`)
    $("#cidadeEndereco").html(`${MEU_ENDERECO.cidade}-${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento}`)

    cardapio.metodos.finalizarPedido()
  },

  //Atualiza o link do botão do whatsApp
  finalizarPedido: () => {
    if (MEU_CARRINHO.length > 0 && MEU_ENDERECO != null) {
        // Inicializa o texto do pedido
        let texto = "Olá, gostaria de fazer um pedido:";
        texto += `\n*Itens do pedido:*\n\n`;

        // Monta a lista de itens
        let itens = '';
        $.each(MEU_CARRINHO, (i, e) => {
            itens += `*${e.qntd}x* ${e.name} ....... R$ ${e.price.toFixed(2).replace('.', ',')} \n`;
        });

        texto += itens; // Adiciona os itens ao texto

        // Adiciona o endereço e o total ao texto
        texto += `\n*Endereço de entrega:*`;
        texto += `\n${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro}`;
        texto += `\n${MEU_ENDERECO.cidade}-${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento}`;
        texto += `\n\n*Total (com entrega):* R$ ${(VALOR_CARRINHO + VALOR_ENTREGA).toFixed(2).replace('.', ',')}`;

        // Converte o texto em uma URL para o WhatsApp
        let encode = encodeURIComponent(texto);
        let URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;

        // Atualiza o atributo href do botão
        $("#btnEtapaResumo").attr("href", URL).removeClass("hidden");
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
        <span class="btn-menos" onclick="cardapio.metodos.diminuirQuantidade('\${id}')"><i class="fas fa-minus"></i></span>
        <span class="add-numero-itens" id="qntd-\${id}">0</span>
        <span class="btn-mais" onclick="cardapio.metodos.aumentarQuantidade('\${id}')"><i class="fas fa-plus"></i></span>
        <span class="btn btn-add" onclick="cardapio.metodos.abrirModalAdicionais('\${id}')"><i class="fa fa-shopping-bag"></i></span>
      </div>
    </div>
  </div>
  `,

  itemAdicional:`
    <div class="d-flex justify-content-between align-items-center border-bottom adicional-item">
      <label class="d-flex flex-column" for="\${id}">
        <span><strong>\${nome}</strong></span>
        <small>&#43;\${preco}</small>
      </label>
      <input class="bg-tertiary check-input" type="checkbox" name="\${id}" id="\${id}">
    </div>
  `,

  itemCarrinho: `
    <div class="col-12 item-carrinho">
      <div class="img-produto">
        <img src="\${img}"/>
      </div>
      <div class="dados-produto">
        <p class="title-produto"><b>\${nome}</b></p>
        <p class="price-produto"><b>\${nome}</b></p>
      </div>
      <div class="add-carrinho">
      <span class="btn-menos" onclick="cardapio.metodos.diminuirQuantidadeCarrinho('\${id}')"><i class="fas fa-minus"></i></span>
        <span class="add-numero-itens" id="qntd-carrinho-\${id}">\${qntd}</span>
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
          x <b>\${qntd}</b>
        </p>
        <small>Bacon, Catupiry</small>
      </div>
   `
};
