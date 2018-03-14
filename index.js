const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(500000);

  await page.setCookie({
    'name': 'has_js',
    'value': '1',
    'domain': 'www.bstqb.org.br',
    'path': '/',
    'expires': 1539302400
  });

  await page.setCookie({
    'name': 'SESSc2958d4f7fc020f2dedc156ae16b83e8',
    'value': 'skCSoSRWF8o-XqdxCy-iOGhhVpldy1J1Hf3ZFmByudo',
    'domain': '.bstqb.org.br',
    'path': '/',
    'expires': 1528086242
  });

  await page.goto('http://www.bstqb.org.br/?q=pt-br/base-de-certificados');

  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => {
    if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg'))
      interceptedRequest.abort();
    else
      interceptedRequest.continue();
  });

  await page.focus('#edit-title');
  await page.keyboard.type('a');
  await page.click('#edit-submit-buscar-certificados');
  await page.waitForNavigation({'waitUntil': 'load'});

  const nomes = await page.evaluate(() => {
    const captions = Array.from(document.querySelectorAll('table[class="views-table cols-3"] > caption'))
    return captions.map(caption => caption.innerText)
  })
  console.log(nomes)

  await browser.close();
})()
