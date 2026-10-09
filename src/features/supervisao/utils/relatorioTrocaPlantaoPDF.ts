import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TrocaPlantao } from '../types';

interface GerarRelatorioTrocaPlantaoPDFParams {
    empresa: 'TODAS' | 'FEMOG' | 'SEMOG';
    dataInicio: string; // YYYY-MM-DD
    dataFim: string; // YYYY-MM-DD
    statusFiltro?: string;
}

const extractPostoNome = (posto: unknown): string => {
    if (!posto) return '-';
    if (typeof posto === 'string') return posto;
    if (Array.isArray(posto)) return (posto[0] as { nome?: string })?.nome || '-';
    return (posto as { nome?: string }).nome || '-';
};

const extractNome = (obj: unknown): string => {
    if (!obj) return '-';
    if (typeof obj === 'string') return obj;
    if (Array.isArray(obj)) return (obj[0] as { nome?: string })?.nome || '-';
    return (obj as { nome?: string }).nome || '-';
};

const formatBrDate = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
};

const loadLogoImage = (): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = '/logo-pdf.png';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
    });
};

export const gerarRelatorioTrocaPlantaoPDF = async (
    trocas: TrocaPlantao[],
    params: GerarRelatorioTrocaPlantaoPDFParams
): Promise<void> => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Montar corpo da tabela
    const body = trocas.map((t, index) => {
        const rowFillColor = index % 2 === 0 ? [255, 255, 255] : [245, 245, 245];

        const titularNome = extractNome(t.funcionario_troca).toUpperCase();
        const dataOriginalStr = formatBrDate(t.data_original);

        const reposicaoNome = extractNome(t.funcionario).toUpperCase();
        const dataReposicaoStr = formatBrDate(t.data_reposicao);

        const postoStr = extractPostoNome(t.posto).toUpperCase();
        const empresaStr = t.empresa;

        const dataSolicStr = formatBrDate(t.data_solicitacao);
        const solicitanteNome = extractNome(t.solicitante);

        let deAcordoStr = 'Pendente';
        if (t.de_acordo === true) deAcordoStr = 'Sim';
        if (t.de_acordo === false) deAcordoStr = 'Não';

        const statusStr = (t.status || 'Pendente').toUpperCase();
        const responsavelStr = extractNome(t.responsavel_analise);
        const analiseStr = t.data_analise ? `${responsavelStr} (${formatBrDate(t.data_analise)})` : responsavelStr;

        return [
            { content: `${postoStr}\n(${empresaStr})`, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
            { content: `${dataOriginalStr}\n${titularNome}`, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: rowFillColor } },
            { content: `${dataReposicaoStr}\n${reposicaoNome}`, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
            { content: `${dataSolicStr}\n${solicitanteNome}`, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
            { content: deAcordoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
            { content: statusStr, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: rowFillColor } },
            { content: analiseStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
        ];
    });

    // 2. Estatísticas de rodapé
    const total = trocas.length;
    const autorizadas = trocas.filter(t => t.status === 'Autorizado').length;
    const negadas = trocas.filter(t => t.status === 'Negado').length;
    const pendentes = trocas.filter(t => t.status === 'Pendente' || t.status === 'Em Análise').length;
    const canceladas = trocas.filter(t => t.status === 'Cancelado').length;

    const foot = [
        [
            {
                content: `TOTAL DE SOLICITAÇÕES: ${total}`,
                colSpan: 3,
                styles: {
                    halign: 'left',
                    valign: 'middle',
                    fontStyle: 'bold',
                    fillColor: [225, 225, 225],
                    textColor: [0, 0, 0],
                    fontSize: 8.5,
                },
            },
            {
                content: `Autorizadas: ${autorizadas}   |   Pendentes: ${pendentes}   |   Negadas: ${negadas}   |   Canceladas: ${canceladas}`,
                colSpan: 4,
                styles: {
                    halign: 'right',
                    valign: 'middle',
                    fontStyle: 'bold',
                    fillColor: [225, 225, 225],
                    textColor: [0, 0, 0],
                    fontSize: 8.5,
                },
            },
        ],
    ];

    // 3. Cabeçalho
    const logoImg = await loadLogoImage();
    let currentY = 20;

    if (logoImg) {
        const imgWidth = 50;
        const imgHeight = 50;
        const logoX = (pageWidth - imgWidth) / 2;
        doc.addImage(logoImg, 'PNG', logoX, currentY, imgWidth, imgHeight);
        currentY += 70;
    } else {
        currentY += 15;
    }

    if (params.empresa !== 'TODAS') {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        const empTitle = params.empresa === 'FEMOG' ? 'FEMOG' : 'SEMOG';
        doc.text(empTitle, (pageWidth - doc.getTextWidth(empTitle)) / 2, currentY);
        currentY += 14;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    const repTitle = 'RELATÓRIO DE TROCAS DE PLANTÃO';
    doc.text(repTitle, (pageWidth - doc.getTextWidth(repTitle)) / 2, currentY);
    currentY += 13;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const [anoIni, mesIni, diaIni] = params.dataInicio.split('-');
    const [anoFim, mesFim, diaFim] = params.dataFim.split('-');
    const periodoStr = `Período: ${diaIni}/${mesIni}/${anoIni} até ${diaFim}/${mesFim}/${anoFim}`;
    const empresaStr = `Empresa: ${params.empresa === 'TODAS' ? 'Todas' : params.empresa}`;
    const statusStr = `Status: ${params.statusFiltro || 'Todos'}`;
    const infoLine = `${periodoStr}   |   ${empresaStr}   |   ${statusStr}`;
    doc.text(infoLine, (pageWidth - doc.getTextWidth(infoLine)) / 2, currentY);
    currentY += 15;

    // 4. Render Table
    autoTable(doc, {
        startY: currentY,
        head: [
            [
                { content: 'POSTO / EMPRESA', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'DATA ORIGINAL / TITULAR', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'DATA REPOSIÇÃO / SUBSTITUTO', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'SOLICITAÇÃO / SOLICITANTE', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'DE ACORDO', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'STATUS', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'RESPONSÁVEL / ANÁLISE', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
            ],
        ],
        body: body as any,
        foot: foot as any,
        theme: 'grid',
        styles: {
            lineColor: [180, 180, 180],
            lineWidth: 0.5,
            font: 'helvetica',
            fontSize: 8,
            cellPadding: 4,
            valign: 'middle',
            textColor: [20, 20, 20],
        },
        columnStyles: {
            0: { cellWidth: 125, halign: 'center' },
            1: { cellWidth: 155, halign: 'center' },
            2: { cellWidth: 155, halign: 'center' },
            3: { cellWidth: 110, halign: 'center' },
            4: { cellWidth: 65, halign: 'center' },
            5: { cellWidth: 80, halign: 'center' },
            6: { cellWidth: 101.89, halign: 'center' },
        },
        margin: { left: 25, right: 25, top: 25, bottom: 35 },
        showHead: 'everyPage',
        showFoot: 'lastPage',
    });

    // 5. Rodapés numerados
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);

        const footerY = pageHeight - 15;
        doc.text('SISMOG - Sistema Integrado de Gestão', 25, footerY);

        const dataEmissao = `Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        doc.text(dataEmissao, (pageWidth - doc.getTextWidth(dataEmissao)) / 2, footerY);

        const paginaTexto = `Página ${i} de ${totalPages}`;
        doc.text(paginaTexto, pageWidth - 25 - doc.getTextWidth(paginaTexto), footerY);
    }

    // 6. Download
    const empresaNomeArquivo = params.empresa.toLowerCase();
    const inicioStr = params.dataInicio.replace(/-/g, '');
    const fimStr = params.dataFim.replace(/-/g, '');
    doc.save(`Relatorio_Trocas_Plantao_${empresaNomeArquivo}_${inicioStr}_a_${fimStr}.pdf`);
};
