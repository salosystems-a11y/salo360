import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Users, ArrowDown, ArrowUp, Star } from 'lucide-react';

const Evaluation360SummaryTable = ({ data, evaluations, competencies, getUserName }) => {
    const t = useTranslation();

    if (!data || !data.keys || data.keys.length === 0) {
        return null;
    }
    
    const { keys } = data;

    const iconMap = {
        self: User,
        peer: Users,
        subordinate: ArrowDown,
        manager: ArrowUp
    };

    const translationMap = {
        self: 'auto_evaluation',
        peer: 'peers_evaluation',
        subordinate: 'subordinates_evaluation',
        manager: 'leader_evaluation'
    };
    
    const getCompetencyName = (compId) => {
        const comp = competencies.find(c => c.id === compId);
        return comp ? comp.name : t('unknown_competency');
    };

    return (
        <div className="non-printable">
            <CardHeader>
                <CardTitle className="text-foreground text-lg flex items-center">
                    <Star className="h-4 w-4 mr-2 text-primary" />
                    {t('summary_360_title')}
                </CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {keys.map(key => {
                    const Icon = iconMap[key.key] || Star;
                    const typeEvals = evaluations.filter(e => e.evaluation360Type === key.key);
                    
                    let totalScore = 0;
                    let totalCount = 0;

                    typeEvals.forEach(ev => {
                        const scores = Object.values(ev.scores || {});
                        if(scores.length > 0) {
                            totalScore += scores.reduce((a, b) => a + b, 0);
                            totalCount += scores.length;
                        }
                    });

                    const average = totalCount > 0 ? (totalScore / totalCount).toFixed(2) : 'N/A';
                    
                    return (
                        <Card key={key.key} className="bg-card border-border flex flex-col">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                                <div className="p-3 rounded-lg" style={{ backgroundColor: `${key.color}20` }}>
                                    <Icon className="h-6 w-6" style={{ color: key.color }} />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-foreground">{t(translationMap[key.key])}</CardTitle>
                                    <CardDescription>{t('avg_score')}: <span className="font-bold text-foreground">{average}</span></CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2 text-sm flex-grow">
                                {typeEvals.length > 0 ? (
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                        {typeEvals.map(ev => (
                                            <div key={ev.id} className="p-2 border bg-background rounded-md">
                                                <p className="font-semibold text-foreground">{t('evaluator')}: {getUserName(ev.evaluatorId)}</p>
                                                <ul className="list-disc list-inside text-muted-foreground mt-1">
                                                    {Object.entries(ev.scores || {}).map(([compId, score]) => (
                                                        <li key={compId} className="text-xs">
                                                            {getCompetencyName(compId)}: <span className="font-medium text-foreground">{score}/5</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground italic">
                                        {t('no_evaluations_for_this_type')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default Evaluation360SummaryTable;