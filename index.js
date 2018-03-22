const puppeteer = require('puppeteer');
const Certificado = require("./certificado.js");
const Usuario = require("./usuario.js");
const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var usuarios = [];
var dados;

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(500000);

  await page.setCookie({
    'name': 'SESSc2958d4f7fc020f2dedc156ae16b83e8',
    'value': 'SKtS197U10B9Omd2M1WjwF2sOAomiz_xlOxMMS01f4w',
    'domain': '.bstqb.org.br',
    'path': '/'
  });

  await page.goto('http://www.bstqb.org.br/base-de-certificados');
  console.log('Acessou a página de certificados.')

  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => {
    if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg'))
      interceptedRequest.abort();
    else
      interceptedRequest.continue();
  });

  await page.focus('#edit-title');
  await page.keyboard.type('" "');
  await page.click('#edit-submit-buscar-certificados');

  console.log('Realização da busca por certificados.')

  await page.waitForNavigation({'waitUntil': 'load'});
  console.log('Página carregada.');

  await page.click('li[class="pager-last last"] > a');
  await page.waitForSelector('li[class="pager-current last');

  console.log('Carregou ultima pagina')

  const quantidadeDePaginas = await page.evaluate(() => document.querySelector('li[class="pager-current last').innerText);

  console.log('qtd: %s', quantidadeDePaginas);

  for(var x=2;x>=1;x--){
    await page.waitForSelector('table[class="views-table cols-3"]', {visible: true, timeout: 500000});
    const quantidadeDePessoas = await page.$$eval('table[class="views-table cols-3"]', tables => tables.length);

    for(var i=1; i<=quantidadeDePessoas; i++){
      const nomes = await page.evaluate((i) => {
          const captions = Array.from(document.querySelectorAll('table[class="views-table cols-3"]:nth-child('+ i +') > caption'))
          return captions.map(caption => caption.innerText)
        }, i);

      var usuario = new Usuario(nomes[0]);

      const quantidadeCertificados = await page.$$eval('table[class="views-table cols-3"]:nth-child('+ i +') > tbody > tr', trs => trs.length);

      for(var j=1; j<=quantidadeCertificados; j++){

        const certificados = await page.evaluate(({i, j}) => {
          const captions = Array.from(document.querySelectorAll('table[class="views-table cols-3"]:nth-child('+ i +') > tbody > tr:nth-child('+ j +') > td.views-field.views-field-field-certificacao'))
          return captions.map(caption => caption.innerText)
        }, {i, j})

        const numeros = await page.evaluate(({i, j}) => {
          const captions = Array.from(document.querySelectorAll('table[class="views-table cols-3"]:nth-child('+ i +') > tbody > tr:nth-child('+ j +') > td.views-field.views-field-field-certificado-numero'))
          return captions.map(caption => caption.innerText)
        }, {i, j})

        const data = await page.evaluate(({i, j}) => {
          const captions = Array.from(document.querySelectorAll('table[class="views-table cols-3"]:nth-child('+ i +') > tbody > tr:nth-child('+ j +') > td.views-field.views-field-field-certificacao-data'))
          return captions.map(caption => caption.innerText)
        }, {i, j})

        var certificado = new Certificado(certificados[0], numeros[0], data[0]);
        usuario.adicionarCertificado(certificado);

      }

      usuario.calcularTotalDeCertificados();
      usuarios.push(usuario);

    }

    console.log('Página: %s', x);

    if(x!=quantidadeDePaginas){
      await page.waitForSelector('li[class="pager-previous');
      await page.click('li[class="pager-previous"]');
    }

  }

  function comparador(a,b) {
    return parseInt(b.certificados.length, 10) - parseInt(a.certificados.length, 10);
  }

  usuarios.sort(comparador);

  var leituraRecursiva = function () {
    rl.question("Escolha uma opção:\n"
        + "1) Imprimir 10 primeiros por nome e quantidade de certificados\n"
        + "2) Total de usuários e de certificados emitidos\n"
        + "3) Exportar todos os usuários para arquivo (usuarios-full.json)\n"
        + "4) Exportar apenas nome e quantidade de certificados de todos os usuários (usuarios-restricted.json)\n"
        + "5) Exit\n"
        + "--------------------------------------------------------\n"
        , function (line) {

            switch (line){
                case "1":
                    listar10PrimeirosPorNomeEQuantidade();
                    break;
                case "2":
                    imprimirTotais();
                    break;
                case "3":
                    exportarTodosOsUsuarios(false);
                    break;
                case "4":
                    exportarTodosOsUsuarios(true);
                    break;
                case "5":
                    return rl.close();
                    break;
                default:
                    console.log("No such option. Please enter another: ");
            }
    leituraRecursiva(); //Calling this function again to ask new question
    });
  };

  leituraRecursiva();

  function listar10PrimeirosPorNomeEQuantidade(){
    var dezPrimeiros = usuarios.slice(0,10);
    var contador = 0;

    console.log('----------------- RANKING 10 PRIMEIROS -----------------\n');

    dezPrimeiros.forEach(function(u){
        console.log('%d. Nome: %s', ++contador, u.nome);
        console.log('   Quantidade de Certificados: %s', u.totalCertificados);
        console.log('');
    });

    console.log('-------------------------  FIM  ------------------------\n');
  }

  function imprimirTotais(){
    console.log('------------------------ TOTAIS ------------------------\n');
    console.log('Total de usuários: %s', usuarios.length);
    console.log('Total de certificados emitidos: %s', obterTotalDeCertificados());
    console.log('');
    console.log('-------------------------  FIM  ------------------------\n');
  }

  function obterTotalDeCertificados(){
    var totalDeCertificados = 0;

    usuarios.forEach(function(c) {
      totalDeCertificados += c.totalCertificados;
    })

    return totalDeCertificados;
  }

  function exportarTodosOsUsuarios(restrito){
    var nomeDoArquivo;
    var dados;

    if(restrito){
      nomeDoArquivo = "usuarios-restricted.json";
      dados = JSON.stringify(usuarios.map(x => users = {
                            nome: x.nome,
                            totalDeCertificados: x.totalCertificados
                            }), null, 2);
    } else {
      nomeDoArquivo = "usuarios-full.json";
      dados = JSON.stringify(usuarios, null, 2);
    }

    fs.writeFile(nomeDoArquivo, dados , 'utf8', function (err) {
      if (err) {
          console.log('Erro de escrita!');
          return console.log(err);
      }
      console.log("O arquivo foi salvo!");
    });
  }

  await browser.close();
})()
