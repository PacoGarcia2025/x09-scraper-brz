const puppeteer = require('puppeteer');

(async () => {
  console.log('🎣 Iniciando Espião de CLASSES (Alvo: QUARTOS)...');

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'] 
  });

  const page = await browser.newPage();
  
  // 1. Acessar
  await page.goto('https://www.brzempreendimentos.com/busca', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 5000));

  // 2. Clicar em SP (Sabemos que funciona)
  console.log('🖱️ Clicando em SP...');
  await page.evaluate(() => {
    const elementos = Array.from(document.querySelectorAll('div, span, li, option, button'));
    const botaoSP = elementos.find(el => el.innerText.trim() === 'São Paulo');
    if (botaoSP) botaoSP.click();
  });
  
  console.log('⏳ Esperando 8 segundos para carregar lista...');
  await new Promise(r => setTimeout(r, 8000));

  // 3. RASTREAMENTO REVERSO
  console.log('🧬 Rastreando a origem dos "QUARTOS"...');
  
  const arvoreGenealogica = await page.evaluate(() => {
    // Procura elementos que tenham "QUARTOS" e não tenham filhos (são a ponta do código)
    const elementos = Array.from(document.querySelectorAll('*'))
        .filter(el => el.innerText && el.innerText.includes('QUARTOS') && el.children.length === 0);

    // Pega os 3 primeiros que achar para analisar
    return elementos.slice(0, 3).map((alvo, index) => {
        let familia = [];
        let atual = alvo;
        
        // Sobe 6 níveis para cima
        for (let i = 0; i < 6; i++) {
            if (atual && atual.parentElement) {
                atual = atual.parentElement;
                familia.push({
                    nivel: i + 1,
                    tag: atual.tagName,
                    classe: atual.className || 'SEM_CLASSE', // Mostra se não tiver classe
                    id: atual.id || '',
                    // Mostra um pedacinho do texto desse container
                    texto_amostra: atual.innerText.replace(/\n/g, ' | ').substring(0, 60) + '...'
                });
            }
        }
        return { id_elemento: index + 1, familia: familia };
    });
  });

  console.log('\n--- 🧬 RESULTADO DA GENÉTICA ---');
  if (arvoreGenealogica.length > 0) {
      arvoreGenealogica.forEach(item => {
          console.log(`\n🔎 Analisando Elemento ${item.id_elemento} ("QUARTOS"):`);
          item.familia.forEach(parente => {
              console.log(`   🔼 Nível ${parente.nivel}: <${parente.tag}> class="${parente.classe}"`);
              // Se tiver "Portal" ou nome de prédio no texto, é esse o container que queremos!
              if (parente.texto_amostra.includes('Portal') || parente.texto_amostra.includes('Residencial')) {
                  console.log(`      🎯 ALERTA: Esse parece ser o CARD! Texto: "${parente.texto_amostra}"`);
              }
          });
      });
  } else {
      console.log('❌ Não achei a palavra "QUARTOS". O site pode estar carregando vazio.');
  }
  console.log('\n--------------------------------');

  await browser.close();
})();