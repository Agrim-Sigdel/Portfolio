import React from 'react';
import NormalModeLayout from '../../widgets/NormalModeLayout';
import content from '../../data/content.json';
import SEO from '../../shared/ui/SEO';

const NormalModePage = ({ onResetMode }) => {
    const { common } = content;
    return (
        <>
            <SEO
                title={`${common.personal.name} — Normal Mode`}
                description={common.personal.shortSummary || common.personal.summary}
                url={`https://agrimsigdel.com.np/normal`}
            />
            <NormalModeLayout onResetMode={onResetMode} />
        </>
    );
};

export default NormalModePage;
