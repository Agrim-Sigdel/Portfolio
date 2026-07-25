import React from 'react';
import NormalModeLayout from '../../widgets/NormalModeLayout';
import { useContent } from '../../shared/lib/contentStore';
import SEO from '../../shared/ui/SEO';

const NormalModePage = ({ onResetMode }) => {
    const { common } = useContent();
    return (
        <>
            <SEO
                title={`${common.personal.name} - Résumé`}
                description={common.personal.shortSummary || common.personal.summary}
                url={`https://agrimsigdel.com.np/cv`}
            />
            <NormalModeLayout onResetMode={onResetMode} />
        </>
    );
};

export default NormalModePage;
