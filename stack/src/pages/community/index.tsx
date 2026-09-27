import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n/I18nContext";
import axiosInstance from "@/lib/axiosinstance";
import {
  Bell,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Code2,
  Heart,
  ImagePlus,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type Post = {
  _id: string;
  authorId: string;
  authorName: string;
  content: string;
  postType: string;
  visibility: string;
  codeSnippet?: string;
  codeLanguage?: string;
  hashtags: string[];
  media: { url: string; width?: number; height?: number }[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  bookmarkCount: number;
  createdAt: string;
};

type Comment = {
  _id: string;
  authorId: string;
  authorName: string;
  content: string;
  parentCommentId?: string | null;
  createdAt: string;
};

type Notification = {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actorId?: { name?: string };
};

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, formatDate } = useI18n();
  const [posts, setPosts] = useState<Post[]>([]);
  const [mode, setMode] = useState<"recent" | "trending" | "following">("recent");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [composer, setComposer] = useState({
    content: "",
    postType: "update",
    visibility: "public",
    codeSnippet: "",
    codeLanguage: "javascript",
    imageUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [reportingPost, setReportingPost] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("spam");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchFeed = async (nextCursor: string | null, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const params = new URLSearchParams({
        limit: "10",
        sort: mode === "following" ? "recent" : mode,
      });
      if (mode === "following") params.set("feed", "following");
      if (nextCursor) params.set("cursor", nextCursor);
      const response = await axiosInstance.get(`/feed?${params.toString()}`);
      const incoming: Post[] = response.data.data || [];
      setPosts((current) => (reset ? incoming : [...current, ...incoming]));
      setCursor(response.data.nextCursor || null);
      setHasMore(Boolean(response.data.hasMore));
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || t("community.loadFailed"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    void fetchFeed(null, true);
  }, [mode, user?._id]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && cursor) void fetchFeed(cursor);
      },
      { rootMargin: "500px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading, loadingMore, mode]);

  const requireLogin = () => {
    if (user) return true;
    toast.info(t("community.loginToInteract"));
    void router.push("/auth");
    return false;
  };

  const submitPost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireLogin()) return;
    if (!composer.content.trim() && !composer.codeSnippet.trim() && !composer.imageUrl.trim()) {
      toast.error(t("community.postContentRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/post", {
        content: composer.content,
        postType: composer.postType,
        visibility: composer.visibility,
        codeSnippet: composer.codeSnippet,
        codeLanguage: composer.codeLanguage,
        media: composer.imageUrl.trim()
          ? [{ url: composer.imageUrl.trim(), type: "image" }]
          : [],
      });
      setPosts((current) => [response.data.data, ...current]);
      setComposer({ content: "", postType: "update", visibility: "public", codeSnippet: "", codeLanguage: "javascript", imageUrl: "" });
      setComposerOpen(false);
      toast.success(t("community.postPublished"));
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || t("community.publishFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (post: Post) => {
    if (!requireLogin()) return;
    const nextLiked = !liked[post._id];
    setLiked((current) => ({ ...current, [post._id]: nextLiked }));
    setPosts((current) => current.map((item) => item._id === post._id ? { ...item, likeCount: Math.max(0, item.likeCount + (nextLiked ? 1 : -1)) } : item));
    try {
      await axiosInstance.request({ method: nextLiked ? "POST" : "DELETE", url: `/post/${post._id}/like` });
    } catch {
      setLiked((current) => ({ ...current, [post._id]: !nextLiked }));
      setPosts((current) => current.map((item) => item._id === post._id ? { ...item, likeCount: post.likeCount } : item));
      toast.error(t("community.likeFailed"));
    }
  };

  const toggleBookmark = async (post: Post) => {
    if (!requireLogin()) return;
    const nextBookmarked = !bookmarked[post._id];
    setBookmarked((current) => ({ ...current, [post._id]: nextBookmarked }));
    try {
      await axiosInstance.request({ method: nextBookmarked ? "POST" : "DELETE", url: `/post/${post._id}/bookmark` });
      toast.success(nextBookmarked ? t("community.saved") : t("community.removedFromBookmarks"));
    } catch {
      setBookmarked((current) => ({ ...current, [post._id]: !nextBookmarked }));
      toast.error(t("community.bookmarkFailed"));
    }
  };

  const loadComments = async (postId: string) => {
    const isOpen = expandedComments[postId];
    setExpandedComments((current) => ({ ...current, [postId]: !isOpen }));
    if (isOpen || comments[postId]) return;
    try {
      const response = await axiosInstance.get(`/post/${postId}/comments?limit=20`);
      setComments((current) => ({ ...current, [postId]: response.data.data || [] }));
    } catch {
      toast.error(t("community.commentsFailed"));
    }
  };

  const submitComment = async (postId: string) => {
    if (!requireLogin()) return;
    const content = commentDrafts[postId]?.trim();
    if (!content) return;
    try {
      const response = await axiosInstance.post(`/post/${postId}/comments`, { content });
      setComments((current) => ({ ...current, [postId]: [...(current[postId] || []), response.data.data] }));
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      setPosts((current) => current.map((post) => post._id === postId ? { ...post, commentCount: post.commentCount + 1 } : post));
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || t("community.commentFailed"));
    }
  };

  const submitReport = async (postId: string) => {
    if (!requireLogin()) return;
    try {
      await axiosInstance.post(`/post/${postId}/reports`, { reason: reportReason });
      setReportingPost(null);
      toast.success(t("community.reportSubmitted"));
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || t("community.reportFailed"));
    }
  };

  const sharePost = async (post: Post) => {
    if (!requireLogin()) return;
    try {
      await axiosInstance.post(`/post/${post._id}/share`);
      await navigator.clipboard?.writeText(`${window.location.origin}/community?post=${post._id}`);
      toast.success(t("community.shared"));
    } catch {
      toast.error(t("community.shareFailed"));
    }
  };

  const loadNotifications = async () => {
    if (!requireLogin()) return;
    setNotificationsOpen((current) => !current);
    if (notifications.length) return;
    try {
      const response = await axiosInstance.get("/notifications?limit=10");
      setNotifications(response.data.data || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch {
      toast.error(t("community.notificationsFailed"));
    }
  };

  const markAllRead = async () => {
    await axiosInstance.post("/notifications/read-all");
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <Mainlayout>
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">{t("navigation.community")}</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("community.title")}</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">{t("community.description")}</p>
          </div>
          <div className="relative">
            <Button variant="outline" size="sm" onClick={loadNotifications} aria-label={t("community.openNotifications")}>
              <Bell className="h-4 w-4" /> {t("community.notifications")}
              {unreadCount > 0 && <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white">{unreadCount}</span>}
            </Button>
            {notificationsOpen && (
              <div className="absolute right-0 z-20 mt-2 w-80 border border-slate-200 bg-white p-3 shadow-xl">
                <div className="mb-2 flex items-center justify-between"><strong className="text-sm">{t("community.notifications")}</strong><button onClick={markAllRead} className="text-xs text-blue-600">{t("community.markAllRead")}</button></div>
                {notifications.length === 0 ? <p className="py-4 text-sm text-slate-500">{t("community.nothingNew")}</p> : notifications.map((item) => <div key={item._id} className={`border-t border-slate-100 py-3 text-sm ${item.isRead ? "text-slate-500" : "text-slate-900"}`}><p>{item.message}</p><time className="text-xs text-slate-400">{formatDate(item.createdAt)}</time></div>)}
              </div>
            )}
          </div>
        </header>

        <section className="border border-slate-200 bg-white p-4 shadow-sm">
          {!composerOpen ? (
            <button onClick={() => { if (requireLogin()) setComposerOpen(true); }} className="flex w-full items-center gap-3 text-left text-sm text-slate-500">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">{user?.name?.charAt(0).toUpperCase() || "?"}</span>
              {t("community.sharePrompt")}
            </button>
          ) : (
            <form onSubmit={submitPost} className="space-y-4">
              <div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">{t("community.createPost")}</h2><button type="button" onClick={() => setComposerOpen(false)} aria-label={t("common.close")}><X className="h-4 w-4" /></button></div>
              <Textarea value={composer.content} maxLength={5000} onChange={(event) => setComposer((current) => ({ ...current, content: event.target.value }))} placeholder={t("community.contentPlaceholder")} className="min-h-28" />
              <div className="grid gap-3 sm:grid-cols-3">
                <div><Label htmlFor="postType">Post type</Label><select id="postType" value={composer.postType} onChange={(event) => setComposer((current) => ({ ...current, postType: event.target.value }))} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"><option value="update">Update</option><option value="showcase">Showcase</option><option value="achievement">Achievement</option></select></div>
                <div><Label htmlFor="visibility">Visibility</Label><select id="visibility" value={composer.visibility} onChange={(event) => setComposer((current) => ({ ...current, visibility: event.target.value }))} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"><option value="public">Public</option><option value="followers">Followers</option></select></div>
                <div><Label htmlFor="imageUrl">Image URL</Label><Input id="imageUrl" value={composer.imageUrl} onChange={(event) => setComposer((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://..." className="mt-1" /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_180px]"><div><Label htmlFor="codeSnippet">Code snippet</Label><Textarea id="codeSnippet" value={composer.codeSnippet} maxLength={5000} onChange={(event) => setComposer((current) => ({ ...current, codeSnippet: event.target.value }))} placeholder="Paste a useful fragment..." className="mt-1 min-h-24 font-mono text-xs" /></div><div><Label htmlFor="codeLanguage">Language</Label><Input id="codeLanguage" value={composer.codeLanguage} onChange={(event) => setComposer((current) => ({ ...current, codeLanguage: event.target.value }))} className="mt-1" /></div></div>
              <div className="flex items-center justify-between"><span className="text-xs text-slate-400">{composer.content.length}/5000 {t("community.characters")}</span><Button type="submit" disabled={submitting} className="bg-orange-600 text-white hover:bg-orange-700"><Send className="h-4 w-4" />{submitting ? t("community.publishing") : t("community.publish")}</Button></div>
            </form>
          )}
        </section>

        <nav className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3" aria-label={t("community.feedModes")}>
          {[{ value: "recent", label: t("community.recent"), icon: Sparkles }, { value: "trending", label: t("community.trending"), icon: Repeat2 }, { value: "following", label: t("community.following"), icon: Heart }].map(({ value, label, icon: Icon }) => <button key={value} onClick={() => setMode(value as typeof mode)} className={`inline-flex items-center gap-2 border px-4 py-2 text-sm font-medium ${mode === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"}`}><Icon className="h-4 w-4" />{label}</button>)}
        </nav>

        {error && <div className="flex items-center justify-between border border-red-200 bg-red-50 p-3 text-sm text-red-700"><span>{error}</span><Button size="sm" variant="outline" onClick={() => void fetchFeed(cursor, !posts.length)}>{t("common.retry")}</Button></div>}
        {loading ? <div className="space-y-4">{[1, 2].map((item) => <div key={item} className="h-48 animate-pulse border border-slate-200 bg-slate-100" />)}</div> : posts.length === 0 ? <div className="border border-dashed border-slate-300 p-12 text-center"><Sparkles className="mx-auto mb-3 h-8 w-8 text-orange-500" /><h2 className="font-semibold text-slate-800">{t("community.noPosts")}</h2><p className="mt-1 text-sm text-slate-500">{t("community.firstPost")}</p></div> : <div className="space-y-4">{posts.map((post) => <article key={post._id} className="border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">{post.authorName?.charAt(0).toUpperCase()}</span><div><Link href={`/users/${post.authorId}`} className="font-semibold text-slate-900 hover:text-orange-600">{post.authorName}</Link><p className="text-xs text-slate-400">{post.postType} · {formatDate(post.createdAt)}</p></div></div><button className="text-slate-400" aria-label="More post actions"><MoreHorizontal className="h-5 w-5" /></button></div>
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{post.content}</p>
          {post.media?.map((media) => <img key={media.url} src={media.url} alt="Community post media" loading="lazy" className="mt-4 max-h-[420px] w-full object-cover" />)}
          {post.codeSnippet && <pre className="mt-4 overflow-x-auto bg-slate-950 p-4 text-xs leading-6 text-slate-100"><code>{post.codeSnippet}</code></pre>}
          <div className="mt-4 flex flex-wrap gap-2">{post.hashtags?.map((tag) => <Link key={tag} href={`/hashtags/${tag}/posts`} className="text-xs font-medium text-orange-700 hover:underline">#{tag}</Link>)}</div>
          <div className="mt-5 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3"><Button variant="ghost" size="sm" onClick={() => void toggleLike(post)} className={liked[post._id] ? "text-rose-600" : "text-slate-500"}><Heart className={liked[post._id] ? "fill-current" : ""} />{post.likeCount}</Button><Button variant="ghost" size="sm" onClick={() => void loadComments(post._id)}><MessageCircle />{post.commentCount}</Button><Button variant="ghost" size="sm" onClick={() => void sharePost(post)}><Repeat2 />{post.shareCount}</Button><Button variant="ghost" size="sm" onClick={() => void toggleBookmark(post)} className={bookmarked[post._id] ? "text-orange-600" : "text-slate-500"}><Bookmark className={bookmarked[post._id] ? "fill-current" : ""} />Save</Button><Button variant="ghost" size="sm" onClick={() => setReportingPost(reportingPost === post._id ? null : post._id)} className="ml-auto text-slate-500"><ShieldAlert />Report</Button></div>
          {reportingPost === post._id && <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row"><select value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="h-9 rounded-md border border-slate-200 px-2 text-sm"><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="hate">Hate</option><option value="misinformation">Misinformation</option><option value="other">Other</option></select><Button size="sm" onClick={() => void submitReport(post._id)} className="bg-slate-900 text-white">Submit report</Button></div>}
          {expandedComments[post._id] && <div className="mt-4 border-t border-slate-100 pt-4"><div className="space-y-3">{(comments[post._id] || []).map((comment) => <div key={comment._id} className="border-l-2 border-orange-200 pl-3"><p className="text-sm text-slate-700"><strong>{comment.authorName}</strong> {comment.content}</p><p className="mt-1 text-xs text-slate-400">{formatDate(comment.createdAt)}</p></div>)}</div><div className="mt-4 flex gap-2"><Input value={commentDrafts[post._id] || ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post._id]: event.target.value }))} placeholder="Add a thoughtful comment..." onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitComment(post._id); } }} /><Button size="sm" onClick={() => void submitComment(post._id)} aria-label="Send comment"><Send /></Button></div></div>}
        </article>)}</div>}
        <div ref={sentinelRef} className="flex min-h-12 items-center justify-center text-sm text-slate-400">{loadingMore ? t("community.loadingMore") : !hasMore && posts.length ? t("community.endOfFeed") : ""}</div>
      </div>
    </Mainlayout>
  );
}
