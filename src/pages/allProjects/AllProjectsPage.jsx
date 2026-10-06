import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import ProjectCard from '../../shared/ui/ProjectCard';
import SEO from '../../shared/ui/SEO';
import { getProjectsData } from '../../entities/portfolio/model';
import { useContent } from '../../shared/lib/contentStore';

/*
 * AllProjectsPage — /work. The homepage grid shows only the featured picks;
 * this is the complete archive, every project in its curated order, using the
 * same ProjectCard as the homepage so the two read as one collection.
 */
const AllProjectsPage = () => {
    const content = useContent();
    const projects = getProjectsData();

    return (
        <main className="container" style={{ padding: '5rem 0 6rem' }}>
            <SEO
                title={`All Projects - ${content.common.personal.name}`}
                description="The complete archive of projects and open-source work."
                url="https://agrimsigdel.com.np/work"
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ marginBottom: '3.5rem' }}
            >
                <Link
                    to="/normal"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '2.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'var(--accent, #a16161)',
                        textDecoration: 'none'
                    }}
                >
                    <FiArrowLeft aria-hidden="true" /> Back to portfolio
                </Link>

                <p className="text-accent uppercase tracking-widest text-xs font-bold mb-4">
                    Projects &amp; Open Source
                </p>
                <h1 className="font-serif text-5xl">
                    All <span style={{ fontStyle: 'italic' }}>projects</span>.
                </h1>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)', maxWidth: '42rem', lineHeight: 1.6 }}>
                    The complete archive — {projects.length} projects, from client platforms to
                    open-source packages and research experiments.
                </p>
            </motion.div>

            <div className="masonry-grid">
                {projects.map((project, index) => (
                    <ProjectCard key={project.id} project={project} index={index} />
                ))}
            </div>
        </main>
    );
};

export default AllProjectsPage;
