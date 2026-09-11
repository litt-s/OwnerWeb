import PageShell from '../components/PageShell';
import GuestbookComments from '../components/GuestbookComments';

export default function CommentsPage() {
  return (
    <PageShell title="访客留言">
      <div className="sec container" style={{ paddingTop: 40 }}>
        <div className="eyebrow"><span>05</span><span className="head-rule" /><span>Guest Book · 访客留言</span></div>
        <h2>留下你的想法</h2>
        <p className="head-sub">留言会写入数据库，管理员可在后台管理。</p>
        <GuestbookComments />
      </div>
    </PageShell>
  );
}
