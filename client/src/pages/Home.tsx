// Design system: Midnight Editorial — public listening room with a charcoal stage, Coral Signal playback cues, cobalt discovery notes, and thumb-first mobile controls.
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  AudioLines,
  Bell,
  ChevronRight,
  Clock3,
  Compass,
  Headphones,
  Heart,
  Home as HomeIcon,
  Library,
  ListMusic,
  LoaderCircle,
  Menu,
  Mic2,
  Minus,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  Radio,
  Repeat2,
  Search,
  Settings2,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  VolumeX,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const HERO_IMAGE = "/manus-storage/ky-anh-pmh-hero_c03c9d90.jpg";
const MARK_IMAGE = "/manus-storage/melody-mark_2f097fd4.png";
const COVER_OPTIONS = [
  "/manus-storage/ky-anh-pmh-cover_565ee5e7.jpg",
  "/manus-storage/cover-city-rain_e8c5ea53.jpg",
  "/manus-storage/cover-orbital-calm_27f64049.jpg",
];
const TONES = ["sunset", "rain", "orbit", "paper", "night", "blue"];
const genres = ["Indie", "V-Pop", "Hip-hop", "Electronic", "Acoustic", "Jazz", "Chill", "Classical"];

type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
  cover: string;
  audioUrl: string;
  genre: string;
  tone: string;
};

function formatDuration(seconds: number) {
  const normalized = Math.max(0, Math.round(seconds));
  return `${Math.floor(normalized / 60)}:${String(normalized % 60).padStart(2, "0")}`;
}

function Brand() {
  return <div className="brand-lockup"><img src={MARK_IMAGE} alt="Kỳ Anh PMH Mỹ Tho" className="brand-mark" /><span className="brand-name">Kỳ Anh <span>PMH</span> Mỹ Tho</span></div>;
}

function NavButton({ label, icon: Icon, active, onClick }: { label: string; icon: typeof HomeIcon; active: boolean; onClick: () => void }) {
  return <button className={`nav-item ${active ? "is-active" : ""}`} onClick={onClick} type="button"><Icon size={17} strokeWidth={active ? 2.4 : 1.8} /><span>{label}</span>{active && <span className="nav-pip" aria-hidden="true" />}</button>;
}

function CoverArt({ track }: { track: Track }) {
  return <div className="cover-art cover-small"><img src={track.cover} alt={`${track.album || track.title} — ${track.artist}`} /><span className={`cover-tone tone-${track.tone}`} aria-hidden="true" /></div>;
}

function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="section-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2></div>{action && <button className="text-action" type="button" onClick={onAction}>{action} <ChevronRight size={15} /></button>}</div>;
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: uploadedTracks = [], isLoading: isLoadingTracks } = trpc.music.listPublished.useQuery();
  const [activeNav, setActiveNav] = useState("Khám phá");
  const [search, setSearch] = useState("");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [volume, setVolume] = useState(0.67);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isAdmin = user?.role === "admin";

  const tracks = useMemo<Track[]>(() => uploadedTracks.map((track, index) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album || "Phát hành độc lập",
    durationSeconds: track.durationSeconds,
    cover: track.artworkUrl || COVER_OPTIONS[index % COVER_OPTIONS.length],
    audioUrl: track.audioUrl,
    genre: track.genre || "Khác",
    tone: TONES[index % TONES.length],
  })), [uploadedTracks]);

  const filteredTracks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tracks;
    return tracks.filter(track => `${track.title} ${track.artist} ${track.album} ${track.genre}`.toLowerCase().includes(query));
  }, [search, tracks]);

  useEffect(() => {
    if (!currentTrack && tracks[0]) setCurrentTrack(tracks[0]);
    if (currentTrack && !tracks.some(track => track.id === currentTrack.id)) setCurrentTrack(tracks[0] || null);
  }, [currentTrack, tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.pause();
    audio.src = currentTrack.audioUrl;
    audio.load();
    setProgress(0);
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) audio.play().catch(() => { setIsPlaying(false); toast.error("Không thể phát tệp nhạc này trên trình duyệt hiện tại."); });
    else audio.pause();
  }, [isPlaying, currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = volume === 0;
  }, [volume]);

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    toast.success(`Đang phát ${track.title}`, { description: `${track.artist} · ${track.album}` });
  };

  const toggleLike = (track: Track) => setLiked(items => items.includes(track.id) ? items.filter(id => id !== track.id) : [...items, track.id]);
  const playNext = () => {
    if (!tracks.length) return;
    const currentIndex = tracks.findIndex(track => track.id === currentTrack?.id);
    playTrack(tracks[(currentIndex + 1 + tracks.length) % tracks.length]);
  };
  const playPrevious = () => {
    if (!tracks.length) return;
    const currentIndex = tracks.findIndex(track => track.id === currentTrack?.id);
    playTrack(tracks[(currentIndex - 1 + tracks.length) % tracks.length]);
  };
  const handleNav = (label: string) => {
    setActiveNav(label);
    setIsMobileMenuOpen(false);
    if (label !== "Khám phá") toast(`${label} sẽ mở rộng theo thư viện của bạn`, { description: "Bạn vẫn có thể duyệt và nghe các bài đã xuất bản bên dưới." });
  };
  const adjustVolume = (amount: number) => setVolume(current => Math.round(Math.min(1, Math.max(0, current + amount)) * 100) / 100);
  const toggleMute = () => setVolume(current => current === 0 ? 0.67 : 0);
  const openAdmin = () => isAdmin && setLocation("/admin");
  const featureTrack = currentTrack || tracks[0];

  return (
    <div className="app-shell">
      <audio ref={audioRef} onTimeUpdate={event => { const audio = event.currentTarget; if (Number.isFinite(audio.duration) && audio.duration > 0) setProgress((audio.currentTime / audio.duration) * 100); }} onVolumeChange={event => setVolume(event.currentTarget.muted ? 0 : event.currentTarget.volume)} onEnded={playNext} />
      <aside className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-top"><Brand /><button className="icon-button close-menu" type="button" aria-label="Đóng menu" onClick={() => setIsMobileMenuOpen(false)}><X size={18} /></button></div>
        <div className="sidebar-label">Không gian nghe</div>
        <nav className="main-nav" aria-label="Điều hướng chính">{[{ label: "Khám phá", icon: Compass }, { label: "Radio", icon: Radio }, { label: "Thư viện", icon: Library }].map(({ label, icon }) => <NavButton key={label} label={label} icon={icon} active={activeNav === label} onClick={() => handleNav(label)} />)}</nav>
        <div className="sidebar-label library-label">Của bạn</div>
        <nav className="main-nav" aria-label="Thư viện cá nhân"><NavButton label="Bài hát đã thích" icon={Heart} active={false} onClick={() => toast("Hãy đăng nhập để lưu bài hát yêu thích.")} /><NavButton label="Playlist của tôi" icon={ListMusic} active={false} onClick={() => toast("Playlist cá nhân sẽ được bổ sung cùng tài khoản của bạn.")} /><NavButton label="Nghe gần đây" icon={Clock3} active={false} onClick={() => toast("Lịch sử nghe sẽ xuất hiện trong phiên bản có tài khoản người dùng.")} /></nav>
        <div className="sidebar-bottom"><button className="sidebar-promo" type="button" onClick={() => toast("Chọn một thể loại hoặc bắt đầu phát một bài trong thư viện.")}><Sparkles size={17} /><div><strong>Chọn một mood</strong><span>để bắt đầu phiên nghe.</span></div><ChevronRight size={15} /></button>{isAdmin && <button className="profile-mini" type="button" onClick={openAdmin}><span className="avatar">{user?.name?.slice(0, 2).toUpperCase() || "AD"}</span><span className="profile-copy"><b>{user.name || "Admin"}</b><small>Quản trị viên</small></span><MoreHorizontal size={17} /></button>}</div>
      </aside>
      {isMobileMenuOpen && <button className="menu-scrim" aria-label="Đóng menu" type="button" onClick={() => setIsMobileMenuOpen(false)} />}

      <main className="main-column">
        <header className="topbar"><button className="mobile-menu-button icon-button" type="button" aria-label="Mở menu" onClick={() => setIsMobileMenuOpen(true)}><Menu size={20} /></button><div className="topbar-brand"><Brand /><span>listening room</span></div><div className="search-wrap"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm trong thư viện nhạc..." aria-label="Tìm kiếm nhạc" />{search && <button className="clear-search" type="button" onClick={() => setSearch("")} aria-label="Xóa tìm kiếm"><X size={14} /></button>}<kbd>⌘ K</kbd></div><div className="topbar-actions"><button className="icon-button notification-button" type="button" aria-label="Thông báo" onClick={() => toast("Bạn đang bắt kịp mọi phát hành mới.")}><Bell size={18} /><span className="notification-dot" /></button>{isAdmin && <button className="avatar top-avatar" type="button" aria-label="Mở khu vực quản trị" onClick={openAdmin}>{user?.name?.slice(0, 2).toUpperCase() || "AD"}</button>}</div></header>
        <div className="content-wrap">
          <section className="hero-card" aria-label="Kỳ Anh PMH Mỹ Tho"><img src={HERO_IMAGE} alt="Kỳ Anh bên xe mô tô thể thao tại Mỹ Tho" className="hero-image" /><div className="hero-shade" /><div className="hero-copy"><div className="eyebrow eyebrow-light"><span className="live-dot" /> Kỳ Anh PMH Mỹ Tho</div><h1>Chương 2<br /><em>của tương lai.</em></h1><p>Xin chào, tôi là Kỳ Anh Gã Hề — nơi âm nhạc, thiết kế và hành trình phía trước gặp nhau.</p><div className="hero-meta"><span>Barber</span><i /> <span>Code &amp; Web</span><i /> <span>Âm nhạc</span></div><div className="hero-actions">{featureTrack ? <button className="primary-button" type="button" onClick={() => playTrack(featureTrack)}><Play size={16} fill="currentColor" /> Nghe {featureTrack.title}</button> : isAdmin ? <button className="primary-button" type="button" onClick={openAdmin}><UploadCloud size={16} /> Tải nhạc đầu tiên</button> : null}{featureTrack && <button className="ghost-button" type="button" onClick={() => toggleLike(featureTrack)}><Heart size={17} fill={liked.includes(featureTrack.id) ? "currentColor" : "none"} /> {liked.includes(featureTrack.id) ? "Đã thích" : "Thêm vào thư viện"}</button>}</div></div><div className="hero-index"><span>{tracks.length ? "01" : "--"}</span><span className="hero-index-line" /><span>{String(tracks.length).padStart(2, "0")}</span></div>{tracks.length > 1 && <button className="hero-skip" type="button" aria-label="Xem gợi ý tiếp theo" onClick={playNext}><ChevronRight size={20} /></button>}</section>

          <section className="identity-section" aria-labelledby="ky-anh-story"><div className="identity-image"><img src="/manus-storage/ky-anh-pmh-cover_565ee5e7.jpg" alt="Kỳ Anh cùng xe mô tô thể thao" /><span>KA</span></div><div className="identity-copy"><div className="eyebrow">Kỳ Anh Gã Hề</div><h2 id="ky-anh-story">Tay nghề, bản vẽ,<br /><em>giai điệu &amp; hành trình.</em></h2><p>Xin chào, tôi là Kỳ Anh Gã Hề. Tôi làm Barber, lập trình code, lập trình website, kiến trúc sư thiết kế bản vẽ và viết nhạc. Mỗi chặng đường là một bản phác thảo mới cho chương 2 của tương lai.</p><div className="identity-tags"><span>Barber</span><span>Developer</span><span>Architecture</span><span>Songwriter</span></div></div></section>

          <section className="mood-section"><SectionHeading eyebrow="Đúng tâm trạng" title="Hôm nay bạn muốn nghe gì?" action="Xem thể loại" onAction={() => document.getElementById("genres")?.scrollIntoView({ behavior: "smooth" })} /><div className="mood-row">{[["Thư giãn", "#8C9DFF", "Một chút bình yên"], ["Tập trung", "#F3B96B", "Không gian để làm việc"], ["Năng lượng", "#FF6B4A", "Bật lớn, đi thôi"], ["Hoài niệm", "#BDA6CF", "Những ngày cũ trở về"]].map(([label, color, caption]) => <button key={label} className="mood-card" type="button" style={{ "--mood-color": color } as React.CSSProperties} onClick={() => setSearch(label === "Năng lượng" ? "" : label)}><span className="mood-orbit" /><span className="mood-label">{label}</span><span className="mood-caption">{caption}</span><span className="mood-arrow"><ChevronRight size={16} /></span></button>)}</div></section>

          <div className="content-grid"><div className="primary-feed"><section><SectionHeading eyebrow="Thư viện công khai" title="Đang lên sóng" action={tracks.length ? "Phát ngẫu nhiên" : undefined} onAction={() => tracks.length && playTrack(tracks[Math.floor(Math.random() * tracks.length)])} /><div className="track-list">{isLoadingTracks ? <div className="empty-state"><LoaderCircle className="animate-spin" /><strong>Đang mở thư viện</strong><span>Đợi một chút để tải các bài hát mới.</span></div> : filteredTracks.length ? filteredTracks.slice(0, 7).map((track, index) => <div className={`track-row ${currentTrack?.id === track.id ? "is-current" : ""}`} key={track.id}><button className="track-index" type="button" onClick={() => playTrack(track)} aria-label={`Phát ${track.title}`}>{currentTrack?.id === track.id && isPlaying ? <AudioLines size={17} className="playing-wave" /> : <><span className="row-number">{String(index + 1).padStart(2, "0")}</span><Play className="row-play" size={16} fill="currentColor" /></>}</button><CoverArt track={track} /><button className="track-main" type="button" onClick={() => playTrack(track)}><strong>{track.title}</strong><span>{track.artist}</span></button><span className="track-album">{track.album}</span><span className="track-duration">{formatDuration(track.durationSeconds)}</span><button className={`like-button ${liked.includes(track.id) ? "is-liked" : ""}`} type="button" aria-label="Yêu thích bài hát" onClick={() => toggleLike(track)}><Heart size={16} fill={liked.includes(track.id) ? "currentColor" : "none"} /></button><button className="more-button" type="button" aria-label="Tùy chọn bài hát" onClick={() => toast("Tùy chọn bổ sung sẽ xuất hiện trong bản cập nhật tiếp theo.")}><MoreHorizontal size={18} /></button></div>) : <div className="empty-state"><Music2 className="text-[#ff8a70]" size={22} /><strong>{search ? "Chưa tìm thấy bài phù hợp" : "Thư viện đang chờ bài nhạc đầu tiên"}</strong><span>{search ? "Thử tên bài hát, nghệ sĩ hoặc thể loại khác." : "Những bản phát hành mới sẽ xuất hiện tại đây."}</span>{!search && isAdmin && <button className="primary-button" type="button" onClick={openAdmin}><UploadCloud size={15} /> Mở admin studio</button>}</div>}</div></section>
          {tracks.length > 0 && <section className="playlist-section"><SectionHeading eyebrow="Mới cập nhật" title="Thư viện vừa được thêm" action="Phát tất cả" onAction={() => playTrack(tracks[0])} /><div className="playlist-grid">{tracks.slice(0, 3).map((track, index) => <button key={track.id} className="playlist-card" type="button" onClick={() => playTrack(track)}><div className="playlist-cover"><img src={track.cover} alt={track.title} /><span className="playlist-tag">{index === 0 ? "MỚI PHÁT HÀNH" : track.genre.toUpperCase()}</span><span className="cover-play"><Play size={17} fill="currentColor" /></span></div><div className="playlist-info"><strong>{track.title}</strong><span>{track.artist} · {formatDuration(track.durationSeconds)}</span></div></button>)}</div></section>}</div>
          <aside className="right-rail">{currentTrack ? <section className="now-playing-card"><div className="card-topline"><span>Đang phát</span><button type="button" onClick={() => setIsQueueOpen(value => !value)}>{isQueueOpen ? "Đóng hàng đợi" : "Mở hàng đợi"}<ListMusic size={15} /></button></div><div className="now-cover"><img src={currentTrack.cover} alt={currentTrack.album} /><div className="now-cover-ring ring-one" /><div className="now-cover-ring ring-two" /><span className="now-cover-play"><Headphones size={18} /></span></div><div className="now-copy"><div><strong>{currentTrack.title}</strong><span>{currentTrack.artist}</span></div><button type="button" aria-label="Yêu thích bài đang phát" onClick={() => toggleLike(currentTrack)} className={liked.includes(currentTrack.id) ? "is-liked" : ""}><Heart size={17} fill={liked.includes(currentTrack.id) ? "currentColor" : "none"} /></button></div><div className="mini-progress"><span style={{ width: `${progress}%` }} /></div><div className="time-row"><span>{formatDuration((progress / 100) * currentTrack.durationSeconds)}</span><span>{formatDuration(currentTrack.durationSeconds)}</span></div>{isQueueOpen && <div className="queue-popover"><span className="queue-title">Tiếp theo</span>{tracks.filter(track => track.id !== currentTrack.id).slice(0, 3).map(track => <button key={track.id} type="button" onClick={() => playTrack(track)}><CoverArt track={track} /><span><b>{track.title}</b><small>{track.artist}</small></span><Plus size={15} /></button>)}</div>}</section> : <section className="now-playing-card empty-player"><div className="card-topline"><span>Đang phát</span><Headphones size={15} /></div><div className="empty-state"><Headphones size={24} /><strong>Chưa có bài được chọn</strong><span>Hãy thêm nhạc hoặc chọn một bài trong thư viện.</span></div></section>}<section className="genre-card" id="genres"><div className="card-topline"><span>Khám phá theo thể loại</span><SlidersHorizontal size={16} /></div><div className="genre-cloud">{genres.map((genre, index) => <button key={genre} type="button" className={index % 4 === 0 ? "genre-accent" : ""} onClick={() => setSearch(genre)}>{genre}</button>)}</div><div className="genre-footer"><Mic2 size={15} /><span>{tracks.length ? `${tracks.length} bài đang chờ bạn` : "Chờ bài hát đầu tiên"}</span><ChevronRight size={15} /></div></section></aside></div>
          {tracks.length > 0 && <section className="artist-strip"><SectionHeading eyebrow="Trong thư viện" title="Nghệ sĩ đáng để mắt" /><div className="artist-row">{Array.from(new Map(tracks.map((track, index) => [track.artist, { track, index }])).values()).slice(0, 4).map(({ track, index }) => <button key={track.artist} className="artist-card" type="button" onClick={() => setSearch(track.artist)}><span className="artist-avatar" style={{ background: ["#FF6B4A", "#6D8DFF", "#C69EE2", "#F3B96B"][index % 4] }}>{track.artist.slice(0, 2).toUpperCase()}</span><span><strong>{track.artist}</strong><small>{track.genre || "Nghệ sĩ trong thư viện"}</small></span><ChevronRight size={16} /></button>)}</div></section>}
        </div>
      </main>
      <nav className="mobile-bottom-nav" aria-label="Điều hướng trên điện thoại"><button type="button" className={activeNav === "Khám phá" ? "is-active" : ""} onClick={() => handleNav("Khám phá")}><HomeIcon size={19} /><span>Khám phá</span></button><button type="button" onClick={() => handleNav("Radio")}><Radio size={19} /><span>Radio</span></button><button type="button" onClick={() => setIsQueueOpen(true)}><ListMusic size={19} /><span>Hàng đợi</span></button><button type="button" onClick={() => handleNav("Thư viện")}><Library size={19} /><span>Thư viện</span></button></nav>
      <footer className="player-bar"><div className="player-track">{currentTrack ? <><CoverArt track={currentTrack} /><div><strong>{currentTrack.title}</strong><span>{currentTrack.artist}</span></div><button className={`player-like ${liked.includes(currentTrack.id) ? "is-liked" : ""}`} type="button" aria-label="Yêu thích bài đang phát" onClick={() => toggleLike(currentTrack)}><Heart size={15} fill={liked.includes(currentTrack.id) ? "currentColor" : "none"} /></button></> : <><span className="cover-art cover-small" /><div><strong>Chưa có bài hát</strong><span>Thư viện đang chờ</span></div></>}</div><div className="player-controls"><div className="control-buttons"><button type="button" aria-label="Trộn bài" disabled={!tracks.length} onClick={() => tracks.length && playTrack(tracks[Math.floor(Math.random() * tracks.length)])}><Shuffle size={16} /></button><button type="button" aria-label="Bài trước" disabled={!currentTrack} onClick={playPrevious}><SkipBack size={18} fill="currentColor" /></button><button className="main-play" type="button" aria-label={isPlaying ? "Tạm dừng" : "Phát"} disabled={!currentTrack} onClick={() => setIsPlaying(value => !value)}>{isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button><button type="button" aria-label="Bài tiếp theo" disabled={!currentTrack} onClick={playNext}><SkipForward size={18} fill="currentColor" /></button><button type="button" aria-label="Lặp lại" disabled={!currentTrack} onClick={() => toast("Đã bật lặp lại bài hát")}><Repeat2 size={16} /></button></div>{currentTrack && <div className="player-progress"><span>{formatDuration((progress / 100) * currentTrack.durationSeconds)}</span><button type="button" aria-label="Tua bài hát" onClick={() => { const audio = audioRef.current; if (audio?.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10); }}><span className="progress-track"><span style={{ width: `${progress}%` }} /></span></button><span>{formatDuration(currentTrack.durationSeconds)}</span></div>}</div><div className="player-tools"><button type="button" aria-label="Hàng đợi" onClick={() => setIsQueueOpen(value => !value)}><ListMusic size={17} /></button><div className="volume-control" aria-label={`Âm lượng ${Math.round(volume * 100)} phần trăm`}><button className="volume-step" type="button" onClick={() => adjustVolume(-0.1)} aria-label="Giảm âm lượng"><Minus size={13} /></button><button className="volume-toggle" type="button" onClick={toggleMute} aria-label={volume === 0 ? "Bật tiếng" : "Tắt tiếng"}>{volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}</button><input type="range" min="0" max="100" step="1" value={Math.round(volume * 100)} onChange={event => setVolume(Number(event.target.value) / 100)} aria-label="Âm lượng" /><span className="volume-value">{Math.round(volume * 100)}%</span><button className="volume-step" type="button" onClick={() => adjustVolume(0.1)} aria-label="Tăng âm lượng"><Plus size={13} /></button></div><button type="button" aria-label="Cài đặt player" onClick={() => toast("Các thiết lập âm thanh sẽ xuất hiện trong phiên bản tiếp theo.")}><Settings2 size={16} /></button></div></footer>
    </div>
  );
}
