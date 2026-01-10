const puppeteer = require('puppeteer');

(async () => {
  console.log('🕵️ Iniciando Espião FINAL (Rastreamento por Imagem)...');

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'] 
  });

  const page = await browser.newPage();
  
  // 1. Acessar
  await page.goto('https://www.brzempreendimentos.com/busca', { waitUntil: 'domcontentloaded', timeout: 90000 });
  
  console.log('⏳ Esperando 5 segundos...');
  await new Promise(r => setTimeout(r, 5000));

  // 2. CLICAR EM SP
  console.log('🖱️ Clicando em SP...');
  await page.evaluate(() => {
    const elementos = Array.from(document.querySelectorAll('div, span, li, option, button'));
    const botaoSP = elementos.find(el => el.innerText.trim() === 'São Paulo');
    if (botaoSP) botaoSP.click();
  });

  console.log('⏳ Esperando 8 segundos o carregamento...');
  await new Promise(r => setTimeout(r, 8000));

  // 3. ANÁLISE REVERSA
  console.log('🧬 Analisando a família das imagens...');
  
  const estrutura = await page.evaluate(() => {
    // Pega as imagens de fachada (grandes)
    const imgs = Array.from(document.querySelectorAll('img'))
        .filter(img => img.naturalWidth > 300);

    // Pega as 3 primeiras para analisar
    return imgs.slice(0, 3).map((img, index) => {
        let parentes = [];
        let atual = img;
        
        // Sobe 5 níveis
        for(let i=1; i<=5; i++) {
            if(atual.parentElement) {
                atual = atual.parentElement;
                parentes.push({
                    nivel: i,
                    tag: atual.tagName,
                    classe: atual.className || 'SEM_CLASSE', // O segredo está aqui
                    texto_inicio: atual.innerText.replace(/\n/g, ' ').substring(0, 30) + '...'
                });
            }
        }
        return { id: index, parentes: parentes };
    });
  });

  console.log('\n--- 🎯 ALVO ENCONTRADO ---');
  if (estrutura.length > 0) {
      estrutura.forEach(item => {
        console.log(`\n🖼️ Imagem ${item.id + 1}:`);
        item.parentes.forEach(p => {
            console.log(`   🔼 Nível ${p.nivel} (<${p.tag}>): class="${p.classe}"`);
            // Verifica se achou algo clicável
            if (p.classe.includes('card') || p.classe.includes('item') || p.classe.includes('link') || p.tag === 'A') {
                console.log(`      ✨ POTENCIAL CLIQUE AQUI!`);
            }
        });
      });
  } else {
      console.log('❌ Nenhuma imagem grande encontrada. O filtro de SP funcionou?');
  }
  console.log('\n--------------------------');

  await browser.close();
})();