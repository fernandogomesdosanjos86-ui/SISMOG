import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Apontamento } from '../types';

interface GerarRelatorioApontamentosPDFParams {
    empresa: 'TODAS' | 'FEMOG' | 'SEMOG';
    dataInicio: string; // YYYY-MM-DD
    dataFim: string; // YYYY-MM-DD
    funcionarioNomeFiltro?: string;
    tipoApontamentoFiltro?: string;
}

interface FuncionarioApontamentoGroup {
    funcionarioId: string;
    funcionarioNome: string;
    items: Apontamento[];
    totalFrequencia: number;
    totalBeneficios: number;
}

const extractPostoNome = (posto: unknown): string => {
    if (!posto) return '-';
    if (typeof posto === 'string') return posto;
    if (Array.isArray(posto)) return (posto[0] as { nome?: string })?.nome || '-';
    return (posto as { nome?: string }).nome || '-';
};

const extractFuncionarioNome = (func: unknown): string => {
    if (!func) return '-';
    if (typeof func === 'string') return func;
    if (Array.isArray(func)) return (func[0] as { nome?: string })?.nome || '-';
    return (func as { nome?: string }).nome || '-';
};

const loadLogoImage = (): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = '/logo-pdf.png';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
    });
};

export const gerarRelatorioApontamentosPDF = async (
    apontamentos: Apontamento[],
    params: GerarRelatorioApontamentosPDFParams
): Promise<void> => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Agrupar por funcionário
    const groupsMap = new Map<string, FuncionarioApontamentoGroup>();

    apontamentos.forEach((item) => {
        const fId = item.funcionario_id || 'sem_id';
        const fNome = extractFuncionarioNome(item.funcionario).trim() || 'DESCONHECIDO';
        if (!groupsMap.has(fId)) {
            groupsMap.set(fId, {
                funcionarioId: fId,
                funcionarioNome: fNome,
                items: [],
                totalFrequencia: 0,
                totalBeneficios: 0,
            });
        }
        const group = groupsMap.get(fId)!;
        group.items.push(item);
        group.totalFrequencia += Number(item.frequencia_pts || 0);
        group.totalBeneficios += Number(item.beneficios_pts || 0);
    });

    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) =>
        a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR')
    );

    sortedGroups.forEach((group) => {
        group.items.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    });

    // 2. Construir corpo do autotable
    const body: unknown[] = [];

    sortedGroups.forEach((group, groupIndex) => {
        const rowCount = group.items.length;
        const rowFillColor = groupIndex % 2 === 0 ? [255, 255, 255] : [245, 245, 245];
        const freqTotalSign = group.totalFrequencia > 0 ? `+${group.totalFrequencia}` : `${group.totalFrequencia}`;
        const benefTotalSign = group.totalBeneficios > 0 ? `+${group.totalBeneficios}` : `${group.totalBeneficios}`;
        const totaisFormatados = `Freq: ${freqTotalSign} pts\nBenef: ${benefTotalSign} pts`;

        group.items.forEach((item, index) => {
            const dataParts = (item.data || '').split('-');
            const dataStr = dataParts.length === 3 ? `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}` : item.data;
            const postoStr = extractPostoNome(item.posto).toUpperCase();
            const tipoStr = (item.apontamento || '').toUpperCase();
            const obsStr = item.observacao ? item.observacao : '-';
            const freqStr = item.frequencia_pts > 0 ? `+${item.frequencia_pts}` : `${item.frequencia_pts}`;
            const benefStr = item.beneficios_pts > 0 ? `+${item.beneficios_pts}` : `${item.beneficios_pts}`;

            if (index === 0) {
                body.push([
                    {
                        content: group.funcionarioNome.toUpperCase(),
                        rowSpan: rowCount,
                        styles: {
                            valign: 'middle',
                            halign: 'left',
                            fontStyle: 'bold',
                            textColor: [0, 0, 0],
                            fillColor: rowFillColor,
                        },
                    },
                    { content: dataStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: item.empresa, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: postoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: tipoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: freqStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: benefStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: obsStr, styles: { halign: 'left', valign: 'middle', fillColor: rowFillColor } },
                    {
                        content: totaisFormatados,
                        rowSpan: rowCount,
                        styles: {
                            valign: 'middle',
                            halign: 'center',
                            fontStyle: 'bold',
                            textColor: [0, 0, 0],
                            fillColor: rowFillColor,
                        },
                    },
                ]);
            } else {
                body.push([
                    { content: dataStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: item.empresa, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: postoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: tipoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: freqStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: benefStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: obsStr, styles: { halign: 'left', valign: 'middle', fillColor: rowFillColor } },
                ]);
            }
        });
    });

    // Totais gerais
    const grandTotalFrequencia = apontamentos.reduce((acc, curr) => acc + Number(curr.frequencia_pts || 0), 0);
    const grandTotalBeneficios = apontamentos.reduce((acc, curr) => acc + Number(curr.beneficios_pts || 0), 0);
    const grandFreqSign = grandTotalFrequencia > 0 ? `+${grandTotalFrequencia}` : `${grandTotalFrequencia}`;
    const grandBenefSign = grandTotalBeneficios > 0 ? `+${grandTotalBeneficios}` : `${grandTotalBeneficios}`;

    const foot = [
        [
            {
                content: `TOTAL GERAL (${apontamentos.length} apontamento(s))`,
                colSpan: 5,
                styles: {
                    halign: 'right',
                    valign: 'middle',
                    fontStyle: 'bold',
                    fillColor: [225, 225, 225],
                    textColor: [0, 0, 0],
                    fontSize: 8.5,
                },
            },
            {
                content: `${grandFreqSign} pts`,
                styles: {
                    halign: 'center',
                    valign: 'middle',
                    fontStyle: 'bold',
                    fillColor: [225, 225, 225],
                    textColor: [0, 0, 0],
                    fontSize: 8.5,
                },
            },
            {
                content: `${grandBenefSign} pts`,
                styles: {
                    halign: 'center',
                    valign: 'middle',
                    fontStyle: 'bold',
                    fillColor: [225, 225, 225],
                    textColor: [0, 0, 0],
                    fontSize: 8.5,
                },
            },
            {
                content: '-',
                styles: {
                    halign: 'center',
                    valign: 'middle',
                    fillColor: [225, 225, 225],
                    textColor: [120, 120, 120],
                    fontSize: 8.5,
                },
            },
            {
                content: `Freq: ${grandFreqSign}\nBenef: ${grandBenefSign}`,
                styles: {
                    halign: 'center',
                    valign: 'middle',
                    fontStyle: 'bold',
                    fillColor: [225, 225, 225],
                    textColor: [0, 0, 0],
                    fontSize: 8,
                },
            },
        ],
    ];

    // 3. Cabeçalho do documento
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
    const repTitle = 'RELATÓRIO DE APONTAMENTOS DE FREQUÊNCIA';
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
    const tipoStr = `Tipo: ${params.tipoApontamentoFiltro || 'Todos'}`;
    const infoLine = `${periodoStr}   |   ${empresaStr}   |   ${funcStr}   |   ${tipoStr}`;
    doc.text(infoLine, (pageWidth - doc.getTextWidth(infoLine)) / 2, currentY);
    currentY += 15;

    // 4. Tabela
    autoTable(doc, {
        startY: currentY,
        head: [
            [
                { content: 'FUNCIONÁRIO', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'DATA', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'EMPRESA', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'POSTO', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'APONTAMENTO', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'PTS FREQ.', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'PTS BENEF.', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'OBSERVAÇÃO', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'TOTAIS FUNC.', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
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
            0: { cellWidth: 140 },
            1: { cellWidth: 60, halign: 'center' },
            2: { cellWidth: 55, halign: 'center' },
            3: { cellWidth: 120, halign: 'center' },
            4: { cellWidth: 85, halign: 'center' },
            5: { cellWidth: 55, halign: 'center' },
            6: { cellWidth: 55, halign: 'center' },
            7: { cellWidth: 135, halign: 'left' },
            8: { cellWidth: 85, halign: 'center' },
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
    doc.save(`Relatorio_Apontamentos_${empresaNomeArquivo}_${inicioStr}_a_${fimStr}.pdf`);
};
