import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename = 'relatorio.xlsx') => {
  const { summary, rawData, users, competencies } = data;

  const getUserName = (userId) => users.find(u => u.id === userId)?.name || 'N/A';
  const getCompetencyName = (compId) => competencies.find(c => c.id === compId)?.name || 'N/A';

  const summaryData = [
    ["Total de Avaliações Concluídas", summary.totalEvaluations],
    ["Taxa de Conclusão (%)", summary.completionRate],
    ["Média Geral de Performance", summary.averageScore],
    ["Nº de Avaliações Concluídas", summary.completedEvaluations]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }]; 

  const rawDataHeaders = [
    "ID Avaliação", "Avaliador", "Avaliado", "Tipo", "Status", "Período",
    "Data de Criação", "Data de Conclusão", "Comentários"
  ];
  
  const competencyHeaders = competencies.map(c => `Nota: ${c.name}`);
  const allHeaders = [...rawDataHeaders, ...competencyHeaders];

  const rawDataRows = rawData.map(ev => {
    const competencyScores = competencies.map(c => ev.scores?.[c.id] || 'N/A');
    return [
      ev.id,
      getUserName(ev.evaluatorId),
      getUserName(ev.evaluatedId),
      ev.type,
      ev.status,
      ev.period,
      ev.createdAt ? new Date(ev.createdAt).toLocaleDateString() : 'N/A',
      ev.completedAt ? new Date(ev.completedAt).toLocaleDateString() : 'N/A',
      ev.comments || '',
      ...competencyScores
    ];
  });
  
  const wsRawData = XLSX.utils.aoa_to_sheet([allHeaders, ...rawDataRows]);
  wsRawData['!cols'] = allHeaders.map(h => ({ wch: h.length > 15 ? h.length : 15 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");
  XLSX.utils.book_append_sheet(wb, wsRawData, "Dados Brutos");

  XLSX.writeFile(wb, filename);
};

export const generateExcelTemplate = () => {
    const headers = [
        ['name', 'email', 'password', 'role', 'department', 'position', 'managerEmail']
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    ws['!cols'] = headers[0].map(h => ({ wch: h.length + 5 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores');
    XLSX.writeFile(wb, 'template_importacao_colaboradores.xlsx');
};