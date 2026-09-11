import { useParams, Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import PageShell from '../components/PageShell';
import ProjectComments from '../components/ProjectComments';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { projects, projectsLoading } = useContent();
  const project = projects.find((p) => p.id === id);

  if (!project && projectsLoading) {
    return (
      <PageShell title="项目详情">
        <p className="form-err" style={{ padding: '40px' }}>正在加载项目…</p>
      </PageShell>
    );
  }

  if (!project) {
    return (
      <PageShell title="项目详情">
        <p className="form-err" style={{ padding: '40px' }}>未找到该项目。</p>
      </PageShell>
    );
  }

  return (
    <PageShell title={project.name}>
      <div className="project-detail container">
        <div className="proj-hero">
          <h1>{project.name}</h1>
          <div className="proj-en">{project.en}</div>
          <div className="proj-tl">{project.tagline}</div>
          <div className="proj-tags">
            {project.tech.map((t) => <span className="tag2" key={t}>{t}</span>)}
          </div>
        </div>

        {project.video ? (
          <div className="proj-video">
            <video controls poster={project.cover || ''} preload="metadata">
              <source src={project.video} />
              您的浏览器不支持视频播放。
            </video>
          </div>
        ) : (
          <div className="proj-video no-video">
            <p>该项目还没有上传演示视频</p>
          </div>
        )}

        <div className="proj-detail-body">
          <h3>项目介绍</h3>
          <p>{project.longDesc}</p>

          <h3>核心实现</h3>
          <ul className="proj-points">
            {project.points.map((p) => <li key={p}>{p}</li>)}
          </ul>

          {project.link && (
            <a className="proj-link" href={`https://${project.link}`} target="_blank" rel="noreferrer">
              {project.linkLabel || project.link} ↗
            </a>
          )}
        </div>

        <div className="proj-comments">
          <h3>项目留言</h3>
          <ProjectComments projectId={project.id} />
        </div>

        <Link to="/projects" className="back" style={{ display: 'inline-block' }}>← 返回精选项目</Link>
      </div>
    </PageShell>
  );
}
