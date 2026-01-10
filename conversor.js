const fs = require('fs');
const { create } = require('xmlbuilder2');

// --- CONFIGURAÇÃO ---
const NOME_ARQUIVO_JSON = 'brz_imoveis.json';
const NOME_ARQUIVO_XML = 'brz_imoveis_wp.xml';

// Lista de estados para EXCLUIR (O site trouxe alguns "intrusos")
const ESTADOS_IGNORAR = [' MG', ' RJ', 'Minas Gerais', 'Rio de Janeiro', ' MT', ' PR', ' SC'];
// Lista de cidades para FORÇAR a inclusão (caso o endereço esteja vazio mas a cidade seja de SP)
const CIDADES_SP = ['Hortolândia', 'Sumaré', 'Campinas', 'Paulínia', 'São Paulo', 'Ribeirão Preto', 'Mogi Guaçu', 'Mogi Mirim', 'Tatuí', 'Araras', 'Limeira', 'Araraquara', 'Barretos', 'Leme'];

try {
  // 1. LER O JSON
  const rawData = fs.readFileSync(NOME_ARQUIVO_JSON, 'utf8');
  const imoveis = JSON.parse(rawData);

  console.log(`📦 Lendo ${imoveis.length} imóveis do JSON...`);

  // 2. INICIAR XML
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('imoveis');

  let contagemSP = 0;
  let contagemIgnorados = 0;

  // 3. PROCESSAR CADA IMÓVEL
  imoveis.forEach(imovel => {
    
    // --- FILTRO DE ESTADO (SP APENAS) ---
    // Verifica se no endereço ou cidade tem indícios de outros estados
    const textoParaChecar = (imovel.endereco + ' ' + imovel.cidade).toUpperCase();
    const ehIntruso = ESTADOS_IGNORAR.some(sigla => textoParaChecar.includes(sigla.toUpperCase()));
    
    // Se for intruso, mas a cidade for garantida de SP, a gente salva
    const ehCidadeSP = CIDADES_SP.some(cidade => imovel.cidade.includes(cidade));

    if (ehIntruso && !ehCidadeSP) {
        contagemIgnorados++;
        // console.log(`   🚫 Ignorando imóvel de fora de SP: ${imovel.cidade}`);
        return; 
    }

    contagemSP++;

    const item = root.ele('imovel');
    
    // ID Único
    item.ele('codigo').txt(imovel.id).up();
    
    // Título e Descrição
    item.ele('titulo').txt(imovel.titulo).up();
    item.ele('descricao').txt(imovel.descricao).up();

    // Endereço e Localização
    item.ele('rua').txt(imovel.endereco).up();
    item.ele('cidade').txt(imovel.cidade).up();
    item.ele('estado').txt('SP').up(); // Forçamos SP pois já filtramos
    item.ele('bairro').txt('').up(); // BRZ não fornece bairro separado fácil

    // Dados Técnicos (Ficha)
    // Limpa a área para ficar só número (ex: "55.5" em vez de "55.5m²")
    const areaLimpa = imovel.area.replace(/[^\d.]/g, '');
    item.ele('area_util').txt(areaLimpa).up();
    item.ele('quartos').txt(imovel.quartos).up();
    item.ele('vagas').txt('1').up(); // Padrão BRZ é 1 vaga
    item.ele('banheiros').txt('1').up(); // Padrão

    // Preço (Sempre Sob Consulta)
    item.ele('preco').txt('0').up();
    item.ele('mostrar_preco').txt('nao').up();

    // Status da Obra (Taxonomia)
    let statusWp = 'Em Construção';
    if (imovel.status === 'Pronto para Morar') statusWp = 'Pronto para Morar';
    if (imovel.status === 'Lançamento') statusWp = 'Lançamento';
    item.ele('status_obra').txt(statusWp).up();

    // Tipo (Taxonomia)
    item.ele('tipo_imovel').txt('Apartamento').up();

    // URL original (para referência)
    item.ele('url_origem').txt(imovel.url).up();

    // --- GALERIA DE FOTOS ---
    const galeria = item.ele('fotos');
    if (imovel.fotos && imovel.fotos.length > 0) {
        imovel.fotos.forEach(fotoUrl => {
            // Limpa parâmetros de URL da BRZ que podem quebrar o WP (?sv=...)
            const urlLimpa = fotoUrl.split('?')[0]; 
            // Se a extensão for .webp (comum na BRZ), o WP aceita, mas é bom garantir
            galeria.ele('foto').txt(urlLimpa).up();
        });
    }
  });

  // 4. SALVAR ARQUIVO FINAL
  const xmlString = root.end({ prettyPrint: true });
  fs.writeFileSync(NOME_ARQUIVO_XML, xmlString);

  console.log(`\n✅ CONVERSÃO CONCLUÍDA!`);
  console.log(`📊 Total Processado: ${imoveis.length}`);
  console.log(`🚫 Ignorados (MG/RJ/Outros): ${contagemIgnorados}`);
  console.log(`💾 Salvos no XML (Apenas SP): ${contagemSP}`);
  console.log(`\n📂 Arquivo pronto para importação: ${NOME_ARQUIVO_XML}`);

} catch (error) {
  console.error('❌ Erro na conversão:', error);
  if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️ Falta instalar o criador de XML. Rode: npm install xmlbuilder2');
  }
}