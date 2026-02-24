import React from 'react';
import jsPDF from 'jspdf';
import { Save, ChevronDown, ChevronRight, Download, Trash2 } from 'lucide-react';
import { useEscalas } from '../hooks/useEscalas';
import { getDaysInMonth, getWeekday } from '../utils/escalaLogics';
import type { PostoTrabalho } from '../types';
import { useModal } from '../../../context/ModalContext';
import EscalaRow from './EscalaRow';

interface EscalasGridProps {
    posto: PostoTrabalho;
    competencia: string;
    empresa: 'FEMOG' | 'SEMOG';
    onToggle: () => void;
    isExpanded: boolean;
}

const EscalasGrid: React.FC<EscalasGridProps> = ({ posto, competencia, empresa, onToggle, isExpanded }) => {
    const { openConfirmModal } = useModal();

    // Derived Date properties based on Context
    const year = parseInt(competencia.split('-')[0] || new Date().getFullYear().toString());
    const month = parseInt(competencia.split('-')[1] || (new Date().getMonth() + 1).toString());
    const totalDays = getDaysInMonth(year, month);
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

    // The Grid State Hook (fetches only when this component mounts)
    const {
        localEscalas,
        handleUpdateFuncionario,
        hasUnsavedChanges,
        isSaving,
        isDeleting,
        isLoading: isLoadingEscalas,
        saveEscala,
        deleteEscala
    } = useEscalas(posto.id, competencia, empresa);

    // Compute day headers (like Dom, Seg, Ter)
    const getWeekDayName = (day: number) => {
        const d = getWeekday(year, month, day);
        return ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d];
    };



    // Grid Interactivity Handlers
    const toggleDay = React.useCallback((funcionarioId: string, dayNum: number) => {
        const item = localEscalas.find(e => e.funcionario_id === funcionarioId);
        if (!item) return;

        let currentDias = item.dias || [];
        if (currentDias.includes(dayNum)) {
            currentDias = currentDias.filter(d => d !== dayNum);
        } else {
            currentDias = [...currentDias, dayNum].sort((a, b) => a - b);
        }

        handleUpdateFuncionario(funcionarioId, { dias: currentDias });
    }, [localEscalas, handleUpdateFuncionario]);

    const sortedEscalas = React.useMemo(() => {
        return [...localEscalas].sort((a, b) => {
            const cargoCmp = (a.funcionario?.cargo?.cargo || '').localeCompare(b.funcionario?.cargo?.cargo || '', 'pt-BR');
            if (cargoCmp !== 0) return cargoCmp;
            const turnoCmp = (a.turno || '').localeCompare(b.turno || '', 'pt-BR');
            if (turnoCmp !== 0) return turnoCmp;
            return (a.funcionario?.nome || '').localeCompare(b.funcionario?.nome || '', 'pt-BR');
        });
    }, [localEscalas]);

    const getThemeColor = (emp: string) => emp === 'FEMOG' ? 'text-blue-600' : emp === 'SEMOG' ? 'text-orange-600' : 'text-gray-600';
    const empColor = getThemeColor(posto.empresa);

    const handleDownloadPDF = () => {
        const doc = new jsPDF('landscape', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        const drawTableAndSave = (imageHeight: number) => {
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            const empText = posto.empresa;
            const empTextWidth = doc.getTextWidth(empText);
            doc.text(empText, (pageWidth - empTextWidth) / 2, 20 + imageHeight + 15);

            const tableStartY = 20 + imageHeight + 35;

            const head = [
                [
                    { content: `Posto de Trabalho: ${posto.nome}`, colSpan: totalDays + 1, styles: { halign: 'center', valign: 'middle', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 } }
                ],
                [
                    { content: 'Funcionário', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 } },
                    ...daysArray.map(day => ({ content: day.toString(), styles: { halign: 'center', valign: 'middle', cellPadding: 1, fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 } }))
                ],
                [
                    ...daysArray.map(day => {
                        const d = getWeekday(year, month, day);
                        const weekStr = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d];
                        const isWeekend = d === 0 || d === 6;
                        return {
                            content: weekStr,
                            styles: { halign: 'center', valign: 'middle', cellPadding: 1, fillColor: [240, 240, 240], textColor: isWeekend ? [220, 38, 38] : [0, 0, 0], fontStyle: 'bold', fontSize: 8 }
                        };
                    })
                ]
            ];



            const body = sortedEscalas.map((esc, index) => {
                const isExtra = esc.tipo?.trim().toLowerCase() === 'extra';
                const activeDays = esc.dias || [];
                const rowColor = index % 2 === 0 ? [255, 255, 255] : [245, 245, 245];

                let employeeName = esc.funcionario?.nome || 'Func. Sem Nome';
                const nameParts = employeeName.trim().split(/\s+/);
                if (nameParts.length > 1) {
                    employeeName = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
                }

                return [
                    {
                        content: '', // Empty because we draw manually
                        _employeeName: employeeName,
                        _employeeRole: `${esc.funcionario?.cargo?.cargo || 'Sem Cargo'} - ${esc.escala} (${esc.turno})`,
                        _isExtra: isExtra,
                        styles: { cellPadding: 3, valign: 'middle' as const, fillColor: rowColor }
                    },
                    ...daysArray.map(day => {
                        return {
                            content: activeDays.includes(day) ? 'X' : '',
                            styles: { halign: 'center' as const, valign: 'middle' as const, fontSize: 9, fillColor: rowColor }
                        };
                    })
                ];
            });

            import('jspdf-autotable').then((autoTableModule) => {
                const autoTable = autoTableModule.default;

                autoTable(doc, {
                    startY: tableStartY,
                    head: head as any,
                    body: body as any,
                    theme: 'grid',
                    styles: {
                        lineColor: [0, 0, 0],
                        lineWidth: 0.5,
                        font: "helvetica",
                        minCellHeight: 28,
                        fillColor: [255, 255, 255]
                    },
                    columnStyles: {
                        0: { cellWidth: 125 },
                    },
                    margin: { left: 20, right: 20 },
                    tableWidth: 'auto',
                    showHead: 'firstPage',
                    didDrawCell: (data: any) => {
                        if (data.section === 'body' && data.column.index === 0) {
                            const rawCell = data.cell.raw as any;
                            if (rawCell && rawCell._employeeName) {
                                const doc = data.doc;
                                const x = data.cell.x + 3; // padding
                                let y = data.cell.y + 12; // top padding

                                // Draw Employee Name (Bold, 8pt)
                                doc.setFont("helvetica", "bold");
                                doc.setFontSize(8);
                                doc.setTextColor(rawCell._isExtra ? 220 : 0, rawCell._isExtra ? 38 : 0, rawCell._isExtra ? 38 : 0);
                                doc.text(rawCell._employeeName, x, y);

                                // Draw Role/Escala (Normal, 6.5pt, beneath name)
                                y += 10;
                                doc.setFont("helvetica", "normal");
                                doc.setFontSize(6.5);
                                doc.text(rawCell._employeeRole, x, y);
                            }
                        }
                    }
                });
                // Format competencia from YYYY-MM to MM-YYYY
                const [anoComp, mesComp] = competencia.split('-');
                const formattedCompetencia = `${mesComp}-${anoComp}`;

                doc.save(`Escala_${posto.nome.replace(/\s+/g, '_')}_${formattedCompetencia}.pdf`);
            });
        };

        const img = new Image();
        img.src = '/logo-pdf.png';
        img.onload = () => {
            const imgWidth = 60;
            const imgHeight = 60;
            const logoX = (pageWidth - imgWidth) / 2;
            doc.addImage(img, 'PNG', logoX, 20, imgWidth, imgHeight);
            drawTableAndSave(imgHeight);
        };
        img.onerror = () => {
            drawTableAndSave(0); // Proceed even without image
        };
    };

    return (
        <div className="flex flex-col bg-white">
            {/* Active Accordion Header inline with Grid Actions */}
            <div
                className={`flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 w-full text-left transition-colors cursor-pointer border-b border-transparent ${isExpanded ? 'bg-blue-50/50 border-blue-100' : 'hover:bg-gray-50'}`}
                onClick={onToggle}
            >
                {/* Left Side: Posto Info */}
                <div className="flex items-center gap-4 w-full lg:w-auto hover:opacity-80 transition-opacity">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className={`font-bold ${isExpanded ? 'text-blue-900' : 'text-gray-800'}`}>
                                {posto.nome}
                            </h3>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-white ${empColor} ${posto.empresa === 'FEMOG' ? 'border-blue-200' : 'border-orange-200'}`}>
                                {posto.empresa}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Actions (Efetivo, Salvar, etc) */}
                <div
                    className="flex items-center gap-3 mt-4 lg:mt-0 w-full lg:w-auto"
                    onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking actions
                >
                    {hasUnsavedChanges && (
                        <div className="bg-blue-100/80 text-blue-800 px-3 py-1.5 rounded-lg flex items-center shadow-sm whitespace-nowrap">
                            <span className="flex h-2.5 w-2.5 relative mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                            </span>
                            <span className="text-xs font-medium hidden sm:inline">Modificações pendentes!</span>
                        </div>
                    )}

                    <div className="flex bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden h-9 items-center justify-between">
                        <div className="px-3 py-1 border-r border-gray-200 text-center bg-gray-50 h-full flex flex-col justify-center">
                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider leading-none">Efetivo</p>
                            <p className="font-bold text-gray-900 leading-none mt-0.5">{localEscalas.length}</p>
                        </div>

                        <div className="flex items-center h-full px-1.5 gap-1">
                            <button
                                onClick={async (e) => { e.stopPropagation(); await saveEscala(); }}
                                disabled={!hasUnsavedChanges || isSaving}
                                className={`hidden sm:flex items-center justify-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors shadow-sm h-7
                                            ${hasUnsavedChanges
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 ring-1 ring-blue-500 ring-offset-1'
                                        : 'bg-white text-gray-400 cursor-not-allowed'
                                    }`}
                                title="Salvar"
                            >
                                <Save size={14} />
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>

                            <div className="hidden sm:block w-[1px] h-4 bg-gray-200 mx-1"></div>

                            <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadPDF(); }}
                                className="flex items-center justify-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors hover:bg-gray-100 text-gray-700 h-7"
                                title="Baixar PDF"
                            >
                                <Download size={14} />
                                <span className="hidden sm:inline">Baixar</span>
                            </button>

                            <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openConfirmModal(
                                        'Excluir Escala',
                                        `Tem certeza que deseja excluir toda a escala de ${posto.nome} para este mês?`,
                                        async () => await deleteEscala()
                                    );
                                }}
                                disabled={isDeleting || isSaving}
                                className="flex items-center justify-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors hover:bg-red-50 hover:text-red-700 text-gray-500 h-7"
                                title="Excluir Escala"
                            >
                                <Trash2 size={14} className={isDeleting ? 'animate-pulse' : ''} />
                                <span className="hidden sm:inline">Excluir</span>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onToggle}
                        className={`p-1.5 rounded-full transition-colors ml-2 hidden sm:block ${isExpanded ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'text-gray-400 hover:bg-gray-200'}`}
                        title={isExpanded ? "Fechar Posto" : "Abrir Posto"}
                    >
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>
            </div>

            {/* Accordion Body */}
            {isExpanded && (
                <div className="flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                    {isLoadingEscalas ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center border-t border-gray-100">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                            <p className="text-gray-500 font-medium text-sm">Construindo plano de alocações para {posto.nome}...</p>
                        </div>
                    ) : localEscalas.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 font-medium bg-gray-50/50 text-sm border-t border-gray-100">
                            Nenhum funcionário está permanentemente alocado a este posto na Tabela Base.<br />
                            <span className="text-[10px] text-gray-400">Vá em Gestão de Postos &gt; Alocar Funcionários para resolver isso.</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border-t border-gray-100">
                            <table className="w-full text-left border-collapse min-w-max">
                                <thead>
                                    <tr className="bg-gray-100/50 text-gray-600 uppercase text-[10px]">
                                        <th className="font-semibold p-2 border-r border-b border-gray-200 sticky left-0 z-20 bg-gray-100/90 backdrop-blur-sm min-w-[200px]">
                                            Funcionário
                                        </th>
                                        <th className="font-semibold p-2 border-r border-b border-gray-200 bg-gray-100/50 w-20 hidden md:table-cell">
                                            Início
                                        </th>

                                        <th className="font-semibold p-2 border-r border-b border-gray-200 bg-gray-100/50 text-center w-12">
                                            Qnt
                                        </th>
                                        {daysArray.map(day => {
                                            const weekStr = getWeekDayName(day);
                                            const isWeekend = weekStr === 'D' || weekStr === 'S' && getWeekday(year, month, day) === 6;

                                            return (
                                                <th key={day} className={`font-semibold p-1 border-r border-b border-gray-200 text-center min-w-[32px] hidden md:table-cell ${isWeekend ? 'bg-orange-50/50' : ''}`}>
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-[8px] ${weekStr === 'D' ? 'text-red-500 font-black' : 'text-gray-400'}`}>{weekStr}</span>
                                                        <span className="text-gray-700">{day}</span>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedEscalas.map((esc) => (
                                        <EscalaRow
                                            key={esc.funcionario_id}
                                            esc={esc}
                                            daysArray={daysArray}
                                            year={year}
                                            month={month}
                                            toggleDay={toggleDay}
                                            handleUpdateFuncionario={handleUpdateFuncionario}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EscalasGrid;
