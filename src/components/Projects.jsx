import { useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { ArrowUpRight, LockIcon } from './icons';
import { BabyCover, ZhiyunCover, GenericCover } from './Covers';

const COVERS = {
  yuhu: BabyCover,
  zhiyun: ZhiyunCover,
};

function ProjectCard({ project, flip }) {
  const navigate = useNavigate();
  const LegacyCover = COVERS[project.id];
  const Cover = project.cover ? null : LegacyCover || GenericCover;
  const locked = !!project.locked;

  return (
    <Reveal
      className={`proj-card ${flip ? 'is-flip' : ''} is-clickable ${locked ? 'is-locked' : ''}`}
      onClick={() => navigate(`/projects/${project.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${project.id}`)}
    >
      <div className="proj-media">
        <div className="proj-media-frame">
          {project.cover ? (
            <img className="cover-img" src={project.cover} alt={`${project.name}项目封面`} />
          ) : (
            <Cover project={project} />
          )}
          {locked && (
            <span className="proj-lock-badge">
              <LockIcon size={15} />
              需登录
            </span>
          )}
        </div>
        <span className="proj-index">{project.index}</span>
      </div>

      <div className="proj-body">
        <div className="proj-top">
          <span className="proj-name">{project.name}</span>
          <span className="proj-en">{project.en}</span>
        </div>
        <p className="proj-tagline">{project.tagline}</p>

        {locked ? (
          <p className="proj-locked-hint">
            <LockIcon size={15} />
            该作品仅登录用户可查看，登录后解锁完整内容
          </p>
        ) : (
          <>
            <p className="proj-desc">{project.desc}</p>

            <ul className="proj-points">
              {project.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>

            <div className="proj-tags">
              {project.tech.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>

            <span className="proj-link">
              {project.linkLabel}
              <ArrowUpRight />
            </span>
          </>
        )}
      </div>
    </Reveal>
  );
}

export default function Projects() {
  const { projects } = useContent();

  return (
    <section id="projects" className="section proj">
      <div className="container">
        <SectionHeading
          index="02"
          eyebrow="Selected Works · 精选项目"
          title="从感知到云端，系统全链路"
          sub="两个从零设计并跑通的完整系统 — 数据采集、协议栈、云端通信与远程控制。"
        />

        <div className="proj-stack">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
