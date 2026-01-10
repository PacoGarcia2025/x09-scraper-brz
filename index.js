const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('🚀 Iniciando ROBÔ BRZ - VERSÃO FINAL (Com Endereço Correto)...');

  const browser = await puppeteer.launch({ 
    headless: "new", 
    defaultViewport: null,
    args: ['--no-sandbox', '--start-maximized'] 
  });

  const page = await browser.newPage();
  
  // --- FUNÇÃO PARA PREPARAR A BUSCA (RESET) ---
  async function prepararBusca() {
      try {
        await page.goto('https://www.brzempreendimentos.com/busca', { waitUntil: 'domcontentloaded', timeout: 60000 });
      } catch (e) { console.log("   ⚠️ Refresh na busca..."); }
      await new Promise(r => setTimeout(r, 3000));

      // Clica no botão "São Paulo"
      const clicou = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('div, span, li, option, button'));
        const btn = els.find(el => el.innerText.trim() === 'São Paulo');
        if (btn) { btn.click(); return true; }
        return false;
      });

      if(clicou) await new Promise(r => setTimeout(r, 4000)); 

      // Rola a página para carregar os cards
      await page.evaluate(async () => {
          await new Promise((resolve) => {
              let dist = 500;
              let count = 0;
              const timer = setInterval(() => {
                  window.scrollBy(0, dist);
                  count++;
                  if (count >= 10) { clearInterval(timer); resolve(); } 
              }, 300);
          });
      });
      await new Promise(r => setTimeout(r, 2000));
  }

  // --- FASE 1: CONTAGEM ---
  console.log('📊 Contando imóveis...');
  await prepararBusca();

  const totalImoveis = await page.evaluate(() => {
      return document.querySelectorAll('.card-link').length;
  });
  
  console.log(`\n📋 Encontrei ${totalImoveis} imóveis. Iniciando extração...\n`);
  const listaFinal = [];

  // --- FASE 2: O LOOP DE VISITAÇÃO ---
  // DICA: Se quiser testar rápido, troque "totalImoveis" por "3" no loop abaixo
  for (let i = 0; i < totalImoveis; i++) {
      
      if (i > 0) {
          console.log('   🔙 Voltando para a lista...');
          await prepararBusca();
      }

      console.log(`➡️ (${i + 1}/${totalImoveis}) Entrando no imóvel...`);

      // Clica no card correspondente ao índice [i]
      const navegou = await page.evaluate((index) => {
          const cards = document.querySelectorAll('.card-link');
          if (cards[index]) {
              cards[index].click();
              return true;
          }
          return false;
      }, i);

      if (!navegou) { console.log('   ❌ Erro ao clicar.'); continue; }

      // Espera o título carregar
      try { await page.waitForSelector('h1', { timeout: 15000 }); } catch(e) {}
      await new Promise(r => setTimeout(r, 3000));

      // --- FASE 3: A EXTRAÇÃO DE DADOS ---
      const dadosImovel = await page.evaluate(() => {
          const dados = { url: window.location.href };
          const textFull = document.body.innerText;

          // 1. TÍTULO (H1)
          const h1 = document.querySelector('h1');
          dados.titulo = h1 ? h1.innerText.toUpperCase() : "SEM TÍTULO";
          // Cria um ID único baseado no nome
          dados.id = 'BRZ-' + dados.titulo.replace(/[^A-Z0-9]/g, '').slice(0, 20);

          // 2. CIDADE (Link de voltar)
          const elCidade = document.querySelector('a[href="/busca"].text-sub-3');
          dados.cidade = elCidade ? elCidade.innerText.trim() : 'São Paulo';
          dados.estado = 'SP';

          // 3. ENDEREÇO (A GRANDE DESCOBERTA!)
          // Procura spans brancos e maiúsculos que tenham palavras de rua
          const spansBrancos = Array.from(document.querySelectorAll('span.text-white.text-uppercase'));
          const spanEndereco = spansBrancos.find(el => 
            el.innerText.match(/(Rua|Av\.|Avenida|Estrada|Rodovia|Alameda|Marginal)/i)
          );

          if (spanEndereco) {
              dados.endereco = spanEndereco.innerText.trim();
          } else {
              // Plano B: Tenta achar no texto geral se falhar
              const matchEnd = textFull.match(/(Rua|Av\.|Avenida|Estrada).*?(\d+)?.*?(- SP|\d{5}-\d{3})/i);
              dados.endereco = matchEnd ? matchEnd[0].replace(/\n/g, ' ') : "Endereço a consultar";
          }

          // 4. BANNER (FOTO DE CAPA)
          let capa = '';
          const elBanner = document.querySelector('.banner-enterprise');
          if (elBanner) {
              const style = elBanner.getAttribute('style');
              const matchUrl = style && style.match(/url\(['"]?(.*?)['"]?\)/);
              if (matchUrl) capa = matchUrl[1];
          }

          // 5. PLANTA E QUARTOS (Box de planta)
          dados.area = '0';
          dados.quartos = '2';
          const boxPlantas = document.querySelector('.container-rooms-plant');
          if (boxPlantas) {
              const divArea = boxPlantas.querySelector('.fw-semibold');
              if (divArea) {
                  const matchArea = divArea.innerText.match(/(\d+[,.]?\d*)/);
                  if (matchArea) dados.area = matchArea[1].replace(',', '.');
              }
              const textoBox = boxPlantas.innerText;
              const matchQ = textoBox.match(/(\d+)\s*quartos/i);
              if (matchQ) dados.quartos = matchQ[1];
          }

          // 6. STATUS DA OBRA
          dados.status = 'Em Obras'; // Padrão
          const textUpper = textFull.toUpperCase();
          if (textUpper.includes('PRONTO PARA MORAR') || textUpper.includes('ENTREGUE')) dados.status = 'Pronto para Morar';
          else if (textUpper.includes('LANÇAMENTO')) dados.status = 'Lançamento';

          // 7. FOTOS E DESCRIÇÃO
          const imgs = Array.from(document.querySelectorAll('img'))
              .filter(img => img.naturalWidth > 400 && !img.src.includes('logo'))
              .map(img => img.src);
          
          if (capa) imgs.unshift(capa); // Coloca a capa no início
          dados.fotos = [...new Set(imgs)].slice(0, 20);
          
          const paragrafos = Array.from(document.querySelectorAll('p'))
              .map(p => p.innerText)
              .filter(t => t.length > 50 && !t.includes('meramente'));
          dados.descricao = paragrafos.length > 0 ? paragrafos[0] : `Conheça o ${dados.titulo} em ${dados.cidade}.`;

          return dados;
      });

      console.log(`   ✅ ${dadosImovel.titulo}`);
      console.log(`      📍 ${dadosImovel.endereco} (${dadosImovel.cidade})`);
      console.log(`      📐 ${dadosImovel.area}m² | 🛏️ ${dadosImovel.quartos} | 📸 ${dadosImovel.fotos.length} fotos`);
      
      listaFinal.push(dadosImovel);
  }

  // --- FASE 4: SALVAR ---
  fs.writeFileSync('brz_imoveis.json', JSON.stringify(listaFinal, null, 2));
  console.log(`\n💾 SUCESSO TOTAL! ${listaFinal.length} imóveis salvos em 'brz_imoveis.json'.`);
  
  await browser.close();
})();