import { FiArrowDown } from 'react-icons/fi';
import CaseStudyMedia from './CaseStudyMedia';

export default function ProjectWalkthrough({ walkthrough }) {
  if (!walkthrough?.steps?.length) return null;
  return (
    <section id="visual-walkthrough" className="cs-walkthrough cs-section" aria-labelledby="walkthrough-heading">
      <header className="cs-walkthrough-header">
        <p className="cs-eyebrow">A closer look</p>
        <h2 id="walkthrough-heading">Walk through the project</h2>
        {walkthrough.intro && <p>{walkthrough.intro}</p>}
      </header>
      <ol className="cs-walkthrough-steps">
        {walkthrough.steps.map((step, index) => (
          <li className="cs-walkthrough-step" key={`${index}-${step.title}`}>
            <div className="cs-step-copy">
              <span className="cs-step-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </div>
            <CaseStudyMedia items={step.media} />
            {step.flow?.length > 0 && (
              <figure className="cs-flow-diagram">
                <figcaption>Workflow diagram</figcaption>
                <ol aria-label={`${step.title}: sequence`}>
                  {step.flow.map((label, i) => (
                    <li key={`${label}-${i}`}>
                      <span className="cs-flow-node">{label}</span>
                      {i < step.flow.length - 1 && <FiArrowDown className="cs-flow-arrow" aria-hidden="true" />}
                    </li>
                  ))}
                </ol>
              </figure>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
