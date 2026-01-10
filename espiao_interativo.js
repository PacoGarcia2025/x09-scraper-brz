const puppeteer = require('puppeteer');

(async () => {
  console.log('👆 Iniciando Espião INTERATIVO (O Clicador)...');

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'] 
  });

  const page = await browser.newPage();
  
  // 1. Acessar
  console.log('🌍 Entrando no site...');
  await page.goto('https://www.brzempreendimentos.com/busca', { waitUntil: 'domcontentloaded', timeout: 90000 });
  
  console.log('⏳ Esperando 5 segundos...');
  await new Promise(r => setTimeout(r, 5000));

  // 2. TENTATIVA DE CLIQUE EM "SÃO PAULO"
  console.log('🖱️ Procurando botão de "São Paulo"...');
  
  const clicou = await page.evaluate(async () => {
    // Procura elementos que contenham o texto exato "São Paulo"
    const elementos = Array.from(document.querySelectorAll('div, span, li, option, button'));
    const botaoSP = elementos.find(el => el.innerText.trim() === 'São Paulo');

    if (botaoSP) {
        botaoSP.click();
        return true;
    }
    return false;
  });

  if (clicou) {
      console.log('✅ CLIQUEI em "São Paulo"! Esperando resultados carregarem...');
      await new Promise(r => setTimeout(r, 5000)); // Espera o site reagir
  } else {
      console.log('⚠️ Não achei o botão escrito "São Paulo" exato. Vou tentar rolar a página mesmo assim.');
  }

  // 3. Rolar a página para forçar carregamento das imagens
  console.log('📜 Rolando para revelar cards...');
  await page.evaluate(async () => {
      await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 400;
          let scrolls = 0;
          const timer = setInterval(() => {
              window.scrollBy(0, distance);
              totalHeight += distance;
              scrolls++;
              if (scrolls >= 10) { clearInterval(timer); resolve(); }
          }, 500);
      });
  });

  // 4. EXTRAÇÃO BASEADA EM IMAGENS (A técnica mais segura)
  console.log('🔍 Procurando Cards através das FOTOS...');
  
  const imoveisEncontrados = await page.evaluate(() => {
    // Pega todas as imagens grandes (provavelmente fachadas de prédios)
    const imgs = Array.from(document.querySelectorAll('img'));
    
    // Filtra logos e ícones pequenos
    const fotosFachada = imgs.filter(img => img.naturalWidth > 300 || img.width > 300);

    return fotosFachada.map(img => {
        // Tenta achar o container pai que tem o texto (Nome do prédio)
        // Sobe 3 níveis na árvore do HTML (Geralmente a imagem tá dentro de uma div, que tá dentro do card)
        const pai1 = img.parentElement;
        const pai2 = pai1 ? pai1.parentElement : null;
        const pai3 = pai2 ? pai2.parentElement : null;
        
        // Pega o texto desse container
        let textoCard = '';
        if (pai3) textoCard = pai3.innerText;
        else if (pai2) textoCard = pai2.innerText;
        
        return {
            srcImagem: img.src,
            textoPossivel: textoCard.replace(/\n/g, ' | ').substring(0, 100) // Limpa o texto
        };
    });
  });

  console.log('\n--- RESULTADO DO CLIQUE ---');
  if (imoveisEncontrados.length > 0) {
      console.log(`✅ Achei ${imoveisEncontrados.length} possíveis imóveis! Exemplos:`);
      imoveisEncontrados.slice(0, 5).forEach((item, i) => {
          console.log(`\n🏢 Imóvel ${i+1}:`);
          console.log(`🖼️ Foto: ${item.srcImagem.substring(0, 50)}...`);
          console.log(`📝 Texto ao redor: "${item.textoPossivel}"`);
      });
  } else {
      console.log('❌ Ainda não consegui identificar os cards. O site é bem protegido!');
  }
  console.log('---------------------------\n');
  
  // Tira foto para vermos se a lista apareceu
  await page.screenshot({ path: 'resultado_clique.png' });
  console.log('📸 Veja a imagem "resultado_clique.png" na pasta.');

  await browser.close();
})();