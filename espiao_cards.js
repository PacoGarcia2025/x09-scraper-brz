const puppeteer = require('puppeteer');

(async () => {
  console.log('🩻 Iniciando RAIO-X do Site BRZ...');

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'] 
  });

  const page = await browser.newPage();
  
  // 1. Acessar
  console.log('🌍 Entrando na busca...');
  await page.goto('https://www.brzempreendimentos.com/busca', { waitUntil: 'domcontentloaded', timeout: 90000 });

  // 2. Esperar e Rolar (Crucial para sites pesados)
  console.log('⏳ Esperando 10 segundos para renderização total...');
  await new Promise(r => setTimeout(r, 10000));
  
  await page.evaluate(async () => {
      window.scrollBy(0, 500);
      await new Promise(r => setTimeout(r, 1000));
      window.scrollBy(0, 500);
  });

  // 3. ANÁLISE BRUTA
  console.log('🔍 Analisando estrutura...');

  const raioX = await page.evaluate(() => {
    // A. Vamos pegar TUDO que é link, não importa o nome
    const todosLinks = Array.from(document.querySelectorAll('a'))
        .map(a => a.href)
        .filter(href => href && href.length > 5); // Filtra vazios

    // B. Vamos pegar as Classes das DIVs que têm texto (para achar os cards)
    const divsComTexto = Array.from(document.querySelectorAll('div'))
        .filter(div => {
            // Pega divs que têm texto de tamanho médio (típico de um card)
            return div.innerText.length > 50 && div.innerText.length < 300;
        })
        .slice(0, 5) // Pega só as 5 primeiras para não poluir
        .map(div => ({
            classes: div.className,
            texto: div.innerText.replace(/\n/g, ' | ').substring(0, 100)
        }));

    return {
        totalLinks: todosLinks.length,
        exemplosLinks: todosLinks.slice(0, 10), // Mostra os 10 primeiros
        possiveisCards: divsComTexto
    };
  });

  console.log('\n--- 🩻 RELATÓRIO DO RAIO-X ---');
  console.log(`🔗 Total de Links encontrados: ${raioX.totalLinks}`);
  console.log('\n🔎 Exemplos de Links (Veja se aparece algum imóvel aqui):');
  console.log(raioX.exemplosLinks);
  
  console.log('\n📦 Possíveis Estruturas de Card (DIVs):');
  console.log(raioX.possiveisCards);
  console.log('-------------------------------\n');

  // Print de segurança
  await page.screenshot({ path: 'raio_x_brz.png' });
  console.log('📸 Foto tirada: raio_x_brz.png (Abra essa imagem para ver se o site carregou!)');

  await browser.close();
})();