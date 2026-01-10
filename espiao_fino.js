const puppeteer = require('puppeteer');

(async () => {
  console.log('🔬 Iniciando Espião FINO (Biópsia do HTML)...');

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'] 
  });

  const page = await browser.newPage();
  
  // 1. Acessar e Clicar em SP (Igual ao anterior)
  await page.goto('https://www.brzempreendimentos.com/busca', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 5000));

  console.log('🖱️ Clicando em SP...');
  await page.evaluate(() => {
    const elementos = Array.from(document.querySelectorAll('div, span, li, option, button'));
    const botaoSP = elementos.find(el => el.innerText.trim() === 'São Paulo');
    if (botaoSP) botaoSP.click();
  });
  
  await new Promise(r => setTimeout(r, 5000)); // Espera carregar

  // 2. BIÓPSIA
  console.log('🧬 Analisando o código ao redor de "LAZER COMPLETO"...');
  
  const biopsia = await page.evaluate(() => {
    // Procura todos os elementos que contêm exatamente esse texto
    // (Usamos o texto que o seu último teste revelou)
    const spans = Array.from(document.querySelectorAll('*'))
        .filter(el => el.innerText && el.innerText.includes('LAZER COMPLETO E CONVENIÊNCIAS'));

    // Pega o primeiro que achar para analisar
    if (spans.length > 0) {
        const alvo = spans[0]; // O elemento do texto
        
        // Vamos subir na árvore genealógica até achar o container do Card inteiro
        // Vamos tentar subir 6 níveis e imprimir as classes de cada nível
        let estrutura = [];
        let atual = alvo;
        
        for (let i = 0; i < 7; i++) {
            if (atual && atual.parentElement) {
                atual = atual.parentElement;
                estrutura.push({
                    nivel: i + 1,
                    tag: atual.tagName,
                    classe: atual.className,
                    // Pega um pedaço do texto para sabermos se o título está aqui
                    texto_amostra: atual.innerText.replace(/\n/g, ' | ').substring(0, 150)
                });
            }
        }
        return estrutura;
    }
    return null;
  });

  console.log('\n--- RESULTADO DA BIÓPSIA ---');
  if (biopsia) {
      console.log('Encontrei a estrutura do card! Veja onde está o título:');
      biopsia.forEach(nivel => {
          console.log(`\n🔼 Nível ${nivel.nivel} (${nivel.tag}.${nivel.classe}):`);
          console.log(`📝 Conteúdo: "${nivel.texto_amostra}..."`);
      });
  } else {
      console.log('❌ Não encontrei o texto "LAZER COMPLETO". O site pode ter mudado.');
  }
  console.log('\n----------------------------');

  await browser.close();
})();