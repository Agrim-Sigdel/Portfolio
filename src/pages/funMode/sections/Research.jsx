import { motion } from 'framer-motion';
import { FiGithub, FiExternalLink } from 'react-icons/fi';
import Squiggle from '../../../shared/ui/Squiggle';
import DownloadButton from '../../../shared/ui/DownloadButton';
import { researchData } from '../../../entities/portfolio/model';

const linkIcon = (label) => {
    if (/github/i.test(label)) return <FiGithub aria-hidden="true" />;
    return <FiExternalLink aria-hidden="true" />;
};

const researchLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1.3rem',
    border: '1px solid rgba(255, 76, 43, 0.4)',
    borderRadius: '4px',
    fontSize: '0.85rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    color: 'var(--accent, #ff4c2b)',
    textDecoration: 'none'
};

// Headline metrics pulled out of the paper for an at-a-glance stat row.
const stats = [
    { value: '98.9%', label: 'mAP50 character recognition' },
    { value: '90.4%', label: 'end-to-end precision' },
    { value: '+24.5pp', label: 'zero-shot transfer gain' },
    { value: '61–73%', label: 'compute reduction' },
];

const Research = () => {
    if (!researchData.length) return null;

    return (
        <section id="research" className="container" style={{ padding: '8rem 0', borderTop: '1px solid #222' }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                style={{ marginBottom: '4rem', position: 'relative' }}
            >
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Squiggle
                        style={{ top: '-10px', left: '-20px' }}
                        animateType="float"
                        strokeColor="var(--text-muted)"
                        strokeWidth="5"
                        width="150"
                        height="50"
                        viewBox="0 0 400 100"
                    />
                    <p className="text-accent uppercase tracking-widest text-xs font-bold mb-4">Research &amp; Publications</p>
                </div>
                <h2 className="font-serif text-5xl">
                    Peer-reviewed <span style={{ fontStyle: 'italic' }}>science</span>.
                </h2>
            </motion.div>

            {/* Stat row */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '4rem'
                }}
            >
                {stats.map((s) => (
                    <div key={s.label} style={{ borderLeft: '2px solid var(--accent-red)', paddingLeft: '1.25rem' }}>
                        <div className="font-serif" style={{ fontSize: '2.5rem', lineHeight: 1, color: 'var(--accent-red)' }}>
                            {s.value}
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {s.label}
                        </div>
                    </div>
                ))}
            </motion.div>

            {researchData.map((r, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.15 }}
                    style={{ borderTop: '1px solid #222', paddingTop: '3rem' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        <h3 className="font-serif text-3xl">{r.title}</h3>
                        <span
                            style={{
                                alignSelf: 'flex-start',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: 'var(--accent-red)',
                                border: '1px solid rgba(255, 76, 43, 0.4)',
                                borderRadius: '999px',
                                padding: '0.35rem 0.9rem'
                            }}
                        >
                            {r.status}
                        </span>
                    </div>

                    <p style={{ color: 'var(--text-cream)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                        {r.summary}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.95rem' }}>
                        {r.citation}
                    </p>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
                        {r.highlights.map((h, i) => (
                            <li key={i} style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-cream)', lineHeight: 1.6 }}>
                                <span className="text-accent" style={{ flexShrink: 0 }}> - </span>
                                <span>{h}</span>
                            </li>
                        ))}
                    </ul>

                    {r.links && r.links.length > 0 && (
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {r.links.map((link) =>
                                link.download ? (
                                    <DownloadButton
                                        key={link.label}
                                        href={link.url}
                                        filename={link.url.split('/').pop()}
                                        idleLabel={link.label}
                                        loadingLabel="Downloading…"
                                        doneLabel="Downloaded"
                                        style={researchLinkStyle}
                                    />
                                ) : (
                                    <a
                                        key={link.label}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={researchLinkStyle}
                                    >
                                        {linkIcon(link.label)} {link.label}
                                    </a>
                                )
                            )}
                        </div>
                    )}
                </motion.div>
            ))}
        </section>
    );
};

export default Research;
