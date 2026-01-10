const puppeteer = require('puppeteer');

(async () => {
  console.log('🕵️ Iniciando ESPIÃO INTERNO (Analisando o Florença)...');

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'] 
  });

  const page = await browser.newPage();
  
  // 1. Acessar o Imóvel Cobaia
  const urlAlvo = 'https://www.brzempreendimentos.com/empreendimentos/portal-vista-de-florenca';
  console.log(`🌍 Entrando em: ${urlAlvo}`);
  
  await page.goto(urlAlvo, { waitUntil: 'domcontentloaded', timeout: 90000 });
  
  console.log('⏳ Esperando 5 segundos para garantir...');
  await new Promise(r => setTimeout(r, 5000));

  // 2. Extração de Teste
  console.log('🧬 Analisando o DNA da página...');
  
  const dados = await page.evaluate(() => {
    const info = {};

    // A. Tenta achar o Título (H1 ou H2)
    const h1 = document.querySelector('h1');
    info.titulo = h1 ? h1.innerText : "Não achei H1";
    
    // B. Tenta achar Endereço (Procura palavras chaves em todo o texto)
    const corpoTexto = document.body.innerText;
    const matchEndereco = corpoTexto.match(/(Rua|Av\.|Avenida|Estrada).*?(\d+)?.*?(- SP|São Paulo)/i);
    info.enderecoPossivel = matchEndereco ? matchEndereco[0] : "Endereço difícil de achar";

    // C. Tenta achar a Galeria
    // Pega imagens grandes que não sejam a logo
    const imgs = Array.from(document.querySelectorAll('img'))
        .filter(img => img.naturalWidth > 400 && !img.src.includes('logo'))
        .map(img => img.src);
    
    info.totalFotosGrandes = imgs.length;
    info.exemploFoto = imgs.length > 0 ? imgs[0] : "Sem fotos";

    // D. Descrição
    // Pega o maior parágrafo da página
    const paragrafos = Array.from(document.querySelectorAll('p'))
        .map(p => p.innerText)
        .filter(t => t.length > 50);
    
    // Ordena pelo tamanho (maior primeiro)
    paragrafos.sort((a, b) => b.length - a.length);
    info.descricaoLonga = paragrafos.length > 0 ? paragrafos[0].substring(0, 100) + "..." : "Sem texto longo";

    // E. Estrutura de Classes (Para usarmos no robô final)
    // Retorna as classes do H1 para sabermos como mirar nele
    if (h1) {
        info.classeTitulo = h1.className;
        info.paiTitulo = h1.parentElement ? h1.parentElement.className : "Sem pai";
    }

    return info;
  });

  console.log('\n--- 📝 RELATÓRIO DO IMÓVEL ---');
  console.log(`🏠 Título: "${dados.titulo}"`);
  console.log(`📍 Endereço (Tentativa): "${dados.enderecoPossivel}"`);
  console.log(`📝 Descrição: "${dados.descricaoLonga}"`);
  console.log(`📸 Fotos encontradas: ${dados.totalFotosGrandes}`);
  console.log(`🔗 Exemplo de foto: ${dados.exemploFoto}`);
  console.log('\n--- 🔧 DADOS TÉCNICOS (Para o Programador) ---');
  console.log(`🏷️ Classe do Título: "${dados.classeTitulo}"`);
  console.log(`🏷️ Classe do Pai do Título: "${dados.paiTitulo}"`);
  console.log('------------------------------');

  // Foto para checagem visual
  await page.screenshot({ path: 'imovel_interno.png' });
  console.log('📸 Foto tirada: imovel_interno.png');

  await browser.close();
})();