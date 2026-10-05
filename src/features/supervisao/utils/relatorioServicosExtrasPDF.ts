import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ServicoExtra } from '../types';

interface GerarRelatorioPDFParams {
    empresa: 'TODAS' | 'FEMOG' | 'SEMOG';
    dataInicio: string; // YYYY-MM-DD
    dataFim: string; // YYYY-MM-DD
    funcionarioNomeFiltro?: string;
}

interface FuncionarioGroup {
    funcionarioId: string;
    funcionarioNome: string;
    items: ServicoExtra[];
    totalValor: number;
    totalHoras: number;
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

const extractCargoNome = (cargo: unknown): string => {
    if (!cargo) return '-';
    if (typeof cargo === 'string') return cargo;
    if (Array.isArray(cargo)) return (cargo[0] as { cargo?: string })?.cargo || '-';
    return (cargo as { cargo?: string }).cargo || '-';
};

const loadLogoImage = (): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = '/logo-pdf.png';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
    });
};

export const gerarRelatorioServicosExtrasPDF = async (
    servicos: ServicoExtra[],
    params: GerarRelatorioPDFParams
): Promise<void> => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Group services by Employee
    const groupsMap = new Map<string, FuncionarioGroup>();

    servicos.forEach((item) => {
        const fId = item.funcionario_id || 'sem_id';
        const fNome = extractFuncionarioNome(item.funcionario).trim() || 'DESCONHECIDO';
        if (!groupsMap.has(fId)) {
            groupsMap.set(fId, {
                funcionarioId: fId,
                funcionarioNome: fNome,
                items: [],
                totalValor: 0,
                totalHoras: 0,
            });
        }
        const group = groupsMap.get(fId)!;
        group.items.push(item);
        group.totalValor += Number(item.valor || 0);
        group.totalHoras += Number(item.duracao || 0);
    });

    // Sort groups alphabetically by employee name
    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) =>
        a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR')
    );

    // Within each group, sort services chronologically by entrada
    sortedGroups.forEach((group) => {
        group.items.sort((a, b) => new Date(a.entrada).getTime() - new Date(b.entrada).getTime());
    });

    // 2. Build autotable body
    const body: unknown[] = [];

    sortedGroups.forEach((group, groupIndex) => {
        const rowCount = group.items.length;
        const totalFuncionarioFormatted = `R$ ${group.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const rowFillColor = groupIndex % 2 === 0 ? [255, 255, 255] : [245, 245, 245];

        group.items.forEach((item, index) => {
            const dEntrada = new Date(item.entrada);
            const dSaida = new Date(item.saida);

            const dia = String(dEntrada.getDate()).padStart(2, '0');
            const mes = String(dEntrada.getMonth() + 1).padStart(2, '0');
            const ano = dEntrada.getFullYear();
            const dataStr = `${dia}/${mes}/${ano}`;

            const horaEntrada = dEntrada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const horaSaida = dSaida.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const horarioStr = `${horaEntrada} - ${horaSaida}`;

            const postoStr = extractPostoNome(item.posto).toUpperCase();
            const cargoStr = extractCargoNome(item.cargo).toUpperCase();
            const turnoStr = (item.turno || '').toUpperCase();
            const duracaoStr = `${Number(item.duracao)}H`;
            const valorStr = `R$ ${Number(item.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            if (index === 0) {
                // First row for this employee: includes FUNCIONÁRIO (rowSpan) and TOTAL (rowSpan)
                body.push([
                    {
                        content: group.funcionarioNome.toUpperCase(),
                        rowSpan: rowCount,
                        styles: {
                            valign: 'middle',
                            halign: 'center',
                            fontStyle: 'bold',
                            textColor: [0, 0, 0],
                            fillColor: rowFillColor,
                        },
                    },
                    { content: dataStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: postoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: cargoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: turnoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: horarioStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: duracaoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: valorStr, styles: { halign: 'right', valign: 'middle', fillColor: rowFillColor } },
                    {
                        content: totalFuncionarioFormatted,
                        rowSpan: rowCount,
                        styles: {
                            valign: 'middle',
                            halign: 'right',
                            fontStyle: 'bold',
                            textColor: [0, 0, 0],
                            fillColor: rowFillColor,
                        },
                    },
                ]);
            } else {
                // Subsequent rows: only middle 7 columns (cols 0 and 8 are covered by rowSpan)
                body.push([
                    { content: dataStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: postoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: cargoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: turnoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: horarioStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: duracaoStr, styles: { halign: 'center', valign: 'middle', fillColor: rowFillColor } },
                    { content: valorStr, styles: { halign: 'right', valign: 'middle', fillColor: rowFillColor } },
                ]);
            }
        });
    });

    // Grand totals
    const grandTotalValor = servicos.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
    const grandTotalHoras = servicos.reduce((acc, curr) => acc + Number(curr.duracao || 0), 0);

    const foot = [
        [
            {
                content: 'TOTAL GERAL',
                colSpan: 6,
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
                content: `${grandTotalHoras.toFixed(1)}H`,
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
                content: `R$ ${grandTotalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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

    // 3. Render Header
    const logoImg = await loadLogoImage();
    let currentY = 20;

    if (logoImg) {
        const imgWidth = 50;
        const imgHeight = 50;
        const logoX = (pageWidth - imgWidth) / 2;
        doc.addImage(logoImg, 'PNG', logoX, currentY, imgWidth, imgHeight);
        currentY += 70; // Adds comfortable line space below the logo
    } else {
        currentY += 15;
    }

    // Company Title (Only when a specific company is selected; omit if TODAS)
    if (params.empresa !== 'TODAS') {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        const empTitle = params.empresa === 'FEMOG' ? 'FEMOG' : 'SEMOG';
        doc.text(empTitle, (pageWidth - doc.getTextWidth(empTitle)) / 2, currentY);
        currentY += 14;
    }

    // Report Title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    const repTitle = 'RELATÓRIO DE SERVIÇOS EXTRAS';
    doc.text(repTitle, (pageWidth - doc.getTextWidth(repTitle)) / 2, currentY);
    currentY += 13;

    // Filters Metadata Line
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

    // 4. Render Table
    autoTable(doc, {
        startY: currentY,
        head: [
            [
                { content: 'FUNCIONÁRIO', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'DATA', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'POSTO', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'CARGO', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'TURNO', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'ENTRADA/SAÍDA', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'DURAÇÃO', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'VALOR', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
                { content: 'TOTAL', styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 } },
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
            1: { cellWidth: 65, halign: 'center' },
            2: { cellWidth: 130, halign: 'center' },
            3: { cellWidth: 110, halign: 'center' },
            4: { cellWidth: 65, halign: 'center' },
            5: { cellWidth: 85, halign: 'center' },
            6: { cellWidth: 55, halign: 'center' },
            7: { cellWidth: 70, halign: 'right' },
            8: { cellWidth: 71.89, halign: 'right' },
        },
        margin: { left: 25, right: 25, top: 25, bottom: 35 },
        showHead: 'everyPage',
        showFoot: 'lastPage',
    });

    // 5. Render Page Numbers & Footer on each page
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

    // 6. Save PDF
    const empresaNomeArquivo = params.empresa.toLowerCase();
    const inicioStr = params.dataInicio.replace(/-/g, '');
    const fimStr = params.dataFim.replace(/-/g, '');
    doc.save(`Relatorio_Servicos_Extras_${empresaNomeArquivo}_${inicioStr}_a_${fimStr}.pdf`);
};
