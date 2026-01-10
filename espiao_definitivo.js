const puppeteer = require('puppeteer');

(async () => {
  console.log('🕵️ Iniciando ESPIÃO DEFINITIVO (Combo: Click + Scroll + Class)...');

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

  // 3. ROLAGEM AGRESSIVA (O Segredo!)
  console.log('📜 Rolando a página para carregar a grade...');
  await page.evaluate(async () => {
      await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 500;
          let scrolls = 0;
          const timer = setInterval(() => {
              window.scrollBy(0, distance);
              totalHeight += distance;
              scrolls++;
              if (scrolls >= 8) { // Rola 8 vezes
                  clearInterval(timer);
                  resolve();
              }
          }, 800); // Rola a cada 0.8s
      });
  });
  
  console.log('⏳ Esperando itens carregarem...');
  await new Promise(r => setTimeout(r, 3000));

  // 4. ANÁLISE REVERSA
  console.log('🧬 Analisando a estrutura das imagens encontradas...');
  
  const estrutura = await page.evaluate(() => {
    // Pega imagens grandes
    const imgs = Array.from(document.querySelectorAll('img'))
        .filter(img => img.naturalWidth > 200);

    // Pega a 5ª imagem (para pular logos e destaques iniciais e pegar um item da grade)
    // Se tiver menos de 5, pega a última.
    const alvoIndex = imgs.length > 5 ? 4 : imgs.length - 1;
    
    if (imgs.length > 0) {
        const alvo = imgs[alvoIndex];
        let familia = [];
        let atual = alvo;
        
        // Sobe 6 níveis
        for(let i=1; i<=6; i++) {
            if(atual.parentElement) {
                atual = atual.parentElement;
                familia.push({
                    nivel: i,
                    tag: atual.tagName,
                    classe: atual.className || 'SEM_CLASSE',
                    // Pega o HTML completo para eu ver se tem links escondidos
                    html_amostra: atual.outerHTML.substring(0, 150) 
                });
            }
        }
        return { total_imgs: imgs.length, analise: familia };
    }
    return null;
  });

  console.log('\n--- 🎯 RESULTADO DEFINITIVO ---');
  if (estrutura) {
      console.log(`✅ Achei ${estrutura.total_imgs} imagens! Analisando uma do meio da lista:`);
      estrutura.analise.forEach(p => {
          console.log(`\n🔼 Nível ${p.nivel} (<${p.tag}>):`);
          console.log(`   🏷️ Classe: "${p.classe}"`);
          console.log(`   💻 HTML: "${p.html_amostra}..."`);
      });
  } else {
      console.log('❌ Algo deu errado. Nenhuma imagem carregou após o scroll.');
  }
  console.log('\n---------------------------------');

  await browser.close();
})();