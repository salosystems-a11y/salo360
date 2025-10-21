import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Tabela que exibe os dados detalhados de uma avaliação 360°,
 * comparando as pontuações por competência entre diferentes tipos de avaliadores.
 * @param {object} props - Propriedades do componente.
 * @param {object} props.data - Os dados a serem exibidos na tabela.
 * @returns {JSX.Element} O componente de tabela de avaliação 360°.
 */
const Evaluation360Table = ({ data }) => {
    const t = useTranslation();
    
    // Se não houver dados, exibe uma mensagem
    if (!data || !data.data || data.data.length === 0) {
        return <p className="text-muted-foreground">{t('no_data_for_chart')}</p>;
    }
    
    const { data: tableData, keys } = data;

    // Função para obter a cor da pontuação com base no seu valor
    const getScoreColor = (score) => {
        if (score >= 4.5) return 'text-green-500';
        if (score >= 3.5) return 'text-blue-500';
        if (score >= 2.5) return 'text-yellow-500';
        if (score > 0) return 'text-red-500';
        return 'text-muted-foreground';
    };

    // Mapeamento de traduções para os cabeçalhos da tabela
    const headerTranslationMap = {
        self: 'auto_evaluation',
        peer: 'peers_evaluation',
        subordinate: 'subordinates_evaluation',
        manager: 'leader_evaluation'
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[600px]">
                {/* Cabeçalho da tabela */}
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 rounded-l-lg">
                            {t('competence')}
                        </th>
                        {/* Cria uma coluna para cada tipo de avaliador */}
                        {keys.map(key => (
                            <th key={key.key} scope="col" className="px-6 py-3 text-center">
                                {t(headerTranslationMap[key.key] || key.name)}
                            </th>
                        ))}
                    </tr>
                </thead>
                {/* Corpo da tabela */}
                <tbody>
                    {/* Itera sobre cada linha (competência) */}
                    {tableData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="bg-card border-b border-border last:border-b-0">
                            <th scope="row" className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                                {row.competency}
                            </th>
                            {/* Itera sobre cada tipo de avaliador para preencher as células da linha */}
                            {keys.map(key => (
                                <td key={key.key} className="px-6 py-4 text-center">
                                    <span className={`font-bold ${getScoreColor(row[key.key])}`}>
                                        {row[key.key] > 0 ? row[key.key].toFixed(2) : '-'}
                                    </span>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Evaluation360Table;