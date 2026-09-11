import CommentThread from './CommentThread';

export default function ProjectComments({ projectId }) {
  return (
    <CommentThread
      endpoint={`/api/projects/${encodeURIComponent(projectId)}/comments`}
      emptyText="还没有项目评论，来抢沙发～"
      submitLabel="提交评论"
    />
  );
}
