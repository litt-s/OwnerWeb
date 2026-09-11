import CommentThread from './CommentThread';

export default function GuestbookComments() {
  return <CommentThread endpoint="/api/guestbook-comments" />;
}
