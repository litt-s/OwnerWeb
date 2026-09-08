import { useParams, Link } from 'react-router-dom';
import { projects } from '../data/resume';
import PageShell from '../components/PageShell';
import CommentsSection from '../components/CommentsSection';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const project = projects.find((p) => p.id === id);

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

        <div className="proj-video">
          <video controls poster="" preload="metadata">
            <source src={project.video} type="video/mp4" />
            您的浏览器不支持视频播放。
          </video>
          <div className="video-note">演示视频占位：把 mp4 放到 public{project.video} 即可播放</div>
        </div>

        <div className="proj-detail-body">
          <h3>项目介绍</h3>
          <p>{project.longDesc}</p>

          <h3>核心实现</h3>
          <ul className="proj-points">
            {project.points.map((p) => <li key={p}>{p}</li>)}
          </ul>

          <a className="proj-link" href={`https://${project.link}`} target="_blank" rel="noreferrer">
            {project.linkLabel} ↗
          </a>
        </div>

        <div className="proj-comments">
          <h3>项目留言</h3>
          <CommentsSection topic={project.id} />
        </div>

        <Link to="/projects" className="back" style={{ display: 'inline-block' }}>← 返回精选项目</Link>
      </div>
    </PageShell>
  );
}
