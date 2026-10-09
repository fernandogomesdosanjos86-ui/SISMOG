import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TrocaPosto } from '../types';

interface GerarRelatorioTrocaPostoPDFParams {
    empresa: 'TODAS' | 'FEMOG' | 'SEMOG';
    dataInicio: string; // YYYY-MM-DD
    dataFim: string; // YYYY-MM-DD
    funcionarioNomeFiltro?: string;
}

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

export const gerarRelatorioTrocaPostoPDF = async (
    trocas: TrocaPosto[],
    params: GerarRelatorioTrocaPostoPDFParams
): Promise<void> => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Corpo da tabela
    const body = trocas.map((t, index) => {
        const rowFillColor = index % 2 === 0 ? [255, 255, 255] : [245, 245, 245];

        const dataStr = formatBrDate(t.data);
        const funcionarioNome = extractNome(t.funcionario).toUpperCase();
        const empresaStr = t.empresa;
        const postoOriginalStr = extractNome(t.posto_original).toUpperCase();
        const postoCoberturaStr = extractNome(t.posto_cobertura).toUpperCase();
        const solicitanteStr = extractNome(t.solicitante);
        const observacoesStr = t.observacoes ? t.observacoes : '-';

        return [
            { content: dataStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
            { content: funcionarioNome, styles: { halign: 'left', valign: 'middle', fontStyle: 'bold', fillColor: rowFillColor } },
            { content: empresaStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
            { content: postoOriginalStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
            { content: postoCoberturaStr, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: rowFillColor } },
            { content: solicitanteStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
            { content: observacoesStr, styles: { halign: 'left', valign: 'middle', fillColor: rowFillColor } },
        ];
    });

    const foot = [
        [
            {
                content: `TOTAL DE TROCAS DE POSTO: ${trocas.length} registro(s)`,
                colSpan: 7,
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

    // 2. Cabeçalho
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
    const repTitle = 'RELATÓRIO DE DESLOCAMENTO / TROCA DE POSTO';
    doc.text(repTitle, (pageWidth - doc.getTextWidth(repTitle)) / 2, currentY);
    currentY += 13;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const [anoIni, mesIni, diaIni] = params.dataInicio.split('-');
    const [anoFim, mesFim, diaFim] = params.dataFim.split('-');
    const periodoStr = `Período: ${diaIni}/${mesIni}/${anoIni} até ${diaFim}/${mesFim}/${anoFim}`;
    const empresaStr = `Empresa: ${params.empresa === 'TODAS' ? 'Todas' : params.empresa}`;
    const funcStr = `Funcionário: ${params.funcionarioNomeFiltro || 'Todos'}`;
    const infoLine = `${periodoStr}   |   ${empresaStr}   |   ${funcStr}`;
    doc.text(infoLine, (pageWidth - doc.getTextWidth(infoLine)) / 2, currentY);
    currentY += 15;

    // 3. Render Table
    autoTable(doc, {
        startY: currentY,
        head: [
            [
                { content: 'DATA', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'FUNCIONÁRIO', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'EMPRESA', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'POSTO ORIGINAL (DE)', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'POSTO COBERTURA (PARA)', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'SOLICITANTE', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'OBSERVAÇÕES', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
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
            0: { cellWidth: 65, halign: 'center' },
            1: { cellWidth: 145, halign: 'left' },
            2: { cellWidth: 55, halign: 'center' },
            3: { cellWidth: 125, halign: 'center' },
            4: { cellWidth: 125, halign: 'center' },
            5: { cellWidth: 95, halign: 'center' },
            6: { cellWidth: 181.89, halign: 'left' },
        },
        margin: { left: 25, right: 25, top: 25, bottom: 35 },
        showHead: 'everyPage',
        showFoot: 'lastPage',
    });

    // 4. Rodapés numerados
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

    // 5. Download
    const empresaNomeArquivo = params.empresa.toLowerCase();
    const inicioStr = params.dataInicio.replace(/-/g, '');
    const fimStr = params.dataFim.replace(/-/g, '');
    doc.save(`Relatorio_Trocas_Posto_${empresaNomeArquivo}_${inicioStr}_a_${fimStr}.pdf`);
};
