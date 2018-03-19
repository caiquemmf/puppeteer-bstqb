const puppeteer = require('puppeteer');
const Certificado = require("./certificado.js");
const Usuario = require("./usuario.js");

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

  await page.goto('http://www.bstqb.org.br/?q=pt-br/base-de-certificados');
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

  const quantidade = await page.$$eval('table[class="views-table cols-3"]', tables => tables.length);

  for(var i=1; i<6; i++){
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

    console.log(usuario.nome);
    console.log(usuario.certificados);

  }
  //await browser.close();
})()
