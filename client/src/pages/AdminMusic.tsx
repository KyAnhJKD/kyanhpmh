// Design system: Midnight Editorial admin studio — warm dark upload workbench, coral completion cues, explicit file limits, and a mobile-first form.
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { trpcClient } from "@/lib/trpcClient";
import { CheckCircle2, FileAudio2, ImagePlus, LoaderCircle, LockKeyhole, Music2, ShieldCheck, UploadCloud, X } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const AUDIO_LIMIT = 18 * 1024 * 1024;
const ARTWORK_LIMIT = 2 * 1024 * 1024;

type FormState = { title: string; artist: string; album: string; genre: string; durationSeconds: number };

const initialForm: FormState = { title: "", artist: "", album: "", genre: "", durationSeconds: 0 };

function formatDuration(seconds: number) {
  const normalized = Math.max(0, Math.round(seconds));
  return `${Math.floor(normalized / 60)}:${String(normalized % 60).padStart(2, "0")}`;
}

function formatSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function fileToBase64(file: File, signal: AbortSignal) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => {
      reader.abort();
      reject(new DOMException("Upload was cancelled", "AbortError"));
    };
    if (signal.aborted) return abort();
    signal.addEventListener("abort", abort, { once: true });
    reader.onerror = () => reject(new Error("Không thể đọc tệp đã chọn."));
    reader.onload = () => {
      signal.removeEventListener("abort", abort);
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.split(",")[1] || "");
    };
    reader.readAsDataURL(file);
  });
}

function readAudioDuration(file: File) {
  return new Promise<number>(resolve => {
    const audio = document.createElement("audio");
    const source = URL.createObjectURL(file);
    const clear = () => URL.revokeObjectURL(source);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => { const duration = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0; clear(); resolve(duration); };
    audio.onerror = () => { clear(); resolve(0); };
    audio.src = source;
  });
}

export default function AdminMusic() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [form, setForm] = useState<FormState>(initialForm);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<"idle" | "preparing" | "uploading">("idle");
  const uploadControllerRef = useRef<AbortController | null>(null);
  const isAdmin = user?.role === "admin";
  const { data: library = [], isLoading: isLoadingLibrary } = trpc.music.listForAdmin.useQuery(undefined, { enabled: isAdmin });

  const updateForm = (key: keyof FormState, value: string | number) => setForm(current => ({ ...current, [key]: value }));

  const chooseAudio = async (file?: File) => {
    if (!file) return;
    if (file.size > AUDIO_LIMIT) { toast.error("Tệp nhạc vượt giới hạn 18 MB."); return; }
    if (!file.type.startsWith("audio/")) { toast.error("Hãy chọn tệp âm thanh MP3, WAV, OGG, M4A hoặc AAC."); return; }
    setAudioFile(file);
    const duration = await readAudioDuration(file);
    const suggestedTitle = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    setForm(current => ({ ...current, title: current.title || suggestedTitle, durationSeconds: duration || current.durationSeconds }));
  };

  const chooseArtwork = (file?: File) => {
    if (!file) return;
    if (file.size > ARTWORK_LIMIT) { toast.error("Ảnh bìa vượt giới hạn 2 MB."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Hãy chọn ảnh bìa JPG, PNG hoặc WEBP."); return; }
    setArtworkFile(file);
  };

  const submitUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!audioFile) { toast.error("Hãy chọn tệp nhạc trước khi xuất bản."); return; }

    const controller = new AbortController();
    uploadControllerRef.current = controller;

    try {
      setUploadStage("preparing");
      const [audioBase64, artworkBase64] = await Promise.all([
        fileToBase64(audioFile, controller.signal),
        artworkFile ? fileToBase64(artworkFile, controller.signal) : Promise.resolve(undefined),
      ]);

      setUploadStage("uploading");
      await trpcClient.music.upload.mutate({
        title: form.title,
        artist: form.artist,
        album: form.album || undefined,
        genre: form.genre || undefined,
        durationSeconds: form.durationSeconds,
        audioFileName: audioFile.name,
        audioMimeType: audioFile.type as "audio/mpeg",
        audioBase64,
        artworkFileName: artworkFile?.name,
        artworkMimeType: artworkFile?.type as "image/jpeg" | undefined,
        artworkBase64,
      }, { signal: controller.signal });

      await Promise.all([utils.music.listForAdmin.invalidate(), utils.music.listPublished.invalidate()]);
      setForm(initialForm);
      setAudioFile(null);
      setArtworkFile(null);
      toast.success("Đã xuất bản bài hát", { description: "Bài mới đã xuất hiện trong thư viện công khai." });
    } catch (error) {
      if (controller.signal.aborted) toast("Đã hủy upload", { description: "Tệp vẫn được giữ trên thiết bị của bạn và chưa được xuất bản." });
      else toast.error("Chưa thể tải bài hát", { description: error instanceof Error ? error.message : "Vui lòng thử lại." });
    } finally {
      if (uploadControllerRef.current === controller) uploadControllerRef.current = null;
      setUploadStage("idle");
    }
  };

  const cancelUpload = () => uploadControllerRef.current?.abort();

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#151412] text-[#b7ada2]"><LoaderCircle className="animate-spin" /></div>;

  if (!user) {
    return <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#151412] px-5 text-center text-[#f4efe6]"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(109,141,255,.12),transparent_28rem),radial-gradient(circle_at_12%_82%,rgba(255,107,74,.10),transparent_24rem)]" /><div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#211f1c]/95 p-8 shadow-2xl shadow-black/30"><div className="mx-auto flex w-fit items-center gap-2 border-b border-white/10 pb-5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ff6b4a] text-[#2a1712]"><Music2 size={17} /></span><span className="font-[Space_Grotesk] text-base font-semibold tracking-[-.05em]">Kỳ Anh <span className="text-[#ff8a70]">PMH</span> Mỹ Tho</span></div><div className="mt-6 text-[10px] font-bold uppercase tracking-[.16em] text-[#ff8a70]">Kỳ Anh PMH Mỹ Tho · admin studio</div><LockKeyhole className="mx-auto mt-5 text-[#ff8a70]" /><h1 className="mt-4 font-[Space_Grotesk] text-2xl font-semibold tracking-[-.04em]">Đăng nhập quản trị</h1><p className="mt-3 text-sm leading-6 text-[#a79d92]">Chỉ chủ sở hữu Kỳ Anh PMH Mỹ Tho có thể mở studio upload từ bất kỳ thiết bị nào.</p><Button onClick={() => startLogin()} className="mt-6 w-full bg-[#ff6b4a] text-[#2a1712] hover:bg-[#ff8a70]">Đăng nhập</Button></div></div>;
  }

  if (!isAdmin) {
    return <div className="grid min-h-screen place-items-center bg-[#151412] px-5 text-center text-[#f4efe6]"><div className="max-w-sm rounded-2xl border border-white/10 bg-[#211f1c] p-8"><ShieldCheck className="mx-auto text-[#ff8a70]" /><h1 className="mt-4 font-[Space_Grotesk] text-2xl font-semibold">Khu vực chỉ dành cho admin</h1><p className="mt-3 text-sm leading-6 text-[#a79d92]">Tài khoản này có thể nghe nhạc, nhưng không có quyền thêm hoặc quản lý nội dung.</p><Button variant="outline" onClick={() => setLocation("/")} className="mt-6 border-white/15 text-[#f4efe6] hover:bg-white/8 hover:text-white">Về trang nghe nhạc</Button></div></div>;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-7 text-[#f4efe6] sm:px-7 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-white/8 pb-7 md:flex-row md:items-end">
          <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#ff8a70]"><span className="h-1.5 w-1.5 rounded-full bg-[#ff6b4a]" /> Admin studio</div><h1 className="mt-3 font-[Space_Grotesk] text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Tải nhạc lên thư viện</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#a79d92]">Bạn có thể chọn tệp trực tiếp từ máy tính hoặc điện thoại. Sau khi xuất bản, bài hát sẽ có mặt trên trang nghe nhạc.</p></div>
          <div className="flex items-center gap-3 rounded-xl border border-[#ff6b4a]/20 bg-[#ff6b4a]/8 px-4 py-3 text-sm"><Music2 className="text-[#ff8a70]" size={18} /><span><b className="text-[#f3e8dc]">{library.length}</b> bài đã xuất bản</span></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <form onSubmit={event => void submitUpload(event)} className="rounded-2xl border border-white/10 bg-[#211f1c] p-5 shadow-2xl shadow-black/10 sm:p-7">
            <div className="flex items-center gap-3 border-b border-white/8 pb-5"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#ff6b4a]/14 text-[#ff8a70]"><UploadCloud size={18} /></span><div><h2 className="font-[Space_Grotesk] text-lg font-semibold">Tạo phát hành mới</h2><p className="text-xs text-[#857b71]">Các trường có dấu * là bắt buộc.</p></div></div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="audio-file" className="text-[#e9ded2]">Tệp nhạc *</Label>{audioFile && <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-[#ff9a83]" onClick={() => setAudioFile(null)}><X size={13} /> Bỏ tệp</button>}</div><label htmlFor="audio-file" className="group flex min-h-28 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-white/18 bg-[#171615] p-4 transition-colors hover:border-[#ff6b4a]/60 hover:bg-[#ff6b4a]/5"><span className="grid h-12 w-12 place-items-center rounded-lg bg-[#ff6b4a]/12 text-[#ff8a70]"><FileAudio2 size={22} /></span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-[#f0e5d8]">{audioFile ? audioFile.name : "Chọn tệp âm thanh"}</b><small className="mt-1 block text-xs text-[#877d74]">MP3, WAV, OGG, M4A hoặc AAC · tối đa 18 MB</small>{audioFile && <small className="mt-1 flex items-center gap-1 text-xs text-[#a7d4a4]"><CheckCircle2 size={12} /> {formatSize(audioFile.size)} {form.durationSeconds > 0 ? `· ${formatDuration(form.durationSeconds)}` : ""}</small>}</span><span className="rounded-md border border-white/12 px-3 py-2 text-xs font-semibold text-[#d7c9bb] group-hover:border-[#ff6b4a]/40 group-hover:text-[#ff9a83]">Chọn file</span></label><Input id="audio-file" className="sr-only" type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/aac" onChange={event => void chooseAudio(event.target.files?.[0])} /></div>
              <div className="space-y-2"><Label htmlFor="track-title" className="text-[#e9ded2]">Tên bài hát *</Label><Input id="track-title" value={form.title} onChange={event => updateForm("title", event.target.value)} required maxLength={180} className="border-white/12 bg-[#171615] text-[#f4efe6] placeholder:text-[#6f675f]" placeholder="Ví dụ: Đường về có nắng" /></div>
              <div className="space-y-2"><Label htmlFor="artist" className="text-[#e9ded2]">Nghệ sĩ *</Label><Input id="artist" value={form.artist} onChange={event => updateForm("artist", event.target.value)} required maxLength={180} className="border-white/12 bg-[#171615] text-[#f4efe6] placeholder:text-[#6f675f]" placeholder="Tên nghệ sĩ hoặc ban nhạc" /></div>
              <div className="space-y-2"><Label htmlFor="album" className="text-[#e9ded2]">Album</Label><Input id="album" value={form.album} onChange={event => updateForm("album", event.target.value)} maxLength={180} className="border-white/12 bg-[#171615] text-[#f4efe6] placeholder:text-[#6f675f]" placeholder="Không bắt buộc" /></div>
              <div className="space-y-2"><Label htmlFor="genre" className="text-[#e9ded2]">Thể loại</Label><Input id="genre" value={form.genre} onChange={event => updateForm("genre", event.target.value)} maxLength={80} className="border-white/12 bg-[#171615] text-[#f4efe6] placeholder:text-[#6f675f]" placeholder="Ví dụ: Indie Pop" /></div>
              <div className="space-y-2"><Label htmlFor="duration" className="text-[#e9ded2]">Thời lượng (giây)</Label><Input id="duration" type="number" min="0" max="14400" value={form.durationSeconds || ""} onChange={event => updateForm("durationSeconds", Number(event.target.value) || 0)} className="border-white/12 bg-[#171615] text-[#f4efe6] placeholder:text-[#6f675f]" placeholder="Tự động nhận diện" /></div>
              <div className="space-y-2 sm:col-span-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="artwork-file" className="text-[#e9ded2]">Ảnh bìa</Label>{artworkFile && <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-[#9caeff]" onClick={() => setArtworkFile(null)}><X size={13} /> Bỏ ảnh</button>}</div><label htmlFor="artwork-file" className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-white/15 bg-[#171615] p-4 transition-colors hover:border-[#6d8dff]/60"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-[#6d8dff]/12 text-[#9caeff]">{artworkFile ? <img src={URL.createObjectURL(artworkFile)} alt="Xem trước ảnh bìa" className="h-full w-full object-cover" /> : <ImagePlus size={19} />}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-[#dfd4c7]">{artworkFile ? artworkFile.name : "Thêm ảnh bìa (không bắt buộc)"}</b><small className="mt-1 block text-xs text-[#877d74]">JPG, PNG hoặc WEBP · tối đa 2 MB</small></span><span className="text-xs font-semibold text-[#9caeff]">Chọn ảnh</span></label><Input id="artwork-file" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => chooseArtwork(event.target.files?.[0])} /></div>
            </div>
            <div className="mt-7 border-t border-white/8 pt-5">{uploadStage !== "idle" && <div className="mb-4 rounded-xl border border-[#ff6b4a]/20 bg-[#ff6b4a]/7 px-4 py-3"><div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-[#ffe1d7]">{uploadStage === "preparing" ? "Đang chuẩn bị tệp để upload" : "Đang lưu nhạc vào thư viện"}</span><span className="text-[#ff9a83]">{uploadStage === "preparing" ? "Bước 1 / 2" : "Bước 2 / 2"}</span></div><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/10"><i className={`block h-full rounded-full bg-[#ff6b4a] transition-all duration-300 ${uploadStage === "preparing" ? "w-1/2" : "w-[85%]"}`} /></span><button type="button" onClick={cancelUpload} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#ff9a83]"><X size={13} /> Hủy upload</button></div>}<div className="flex flex-col-reverse items-stretch justify-between gap-4 sm:flex-row sm:items-center"><p className="max-w-md text-xs leading-5 text-[#837970]">Chỉ bạn mới có quyền upload. File nhạc được lưu tách biệt khỏi dữ liệu bài hát và hiển thị công khai sau khi xuất bản.</p><Button type="submit" disabled={uploadStage !== "idle"} className="min-w-36 bg-[#ff6b4a] font-semibold text-[#2a1712] hover:bg-[#ff8a70]">{uploadStage !== "idle" ? <><LoaderCircle className="mr-2 animate-spin" size={16} /> {uploadStage === "preparing" ? "Đang chuẩn bị" : "Đang tải lên"}</> : <><UploadCloud className="mr-2" size={16} /> Xuất bản</>}</Button></div></div>
          </form>

          <aside className="space-y-5"><section className="rounded-2xl border border-white/10 bg-[#211f1c] p-5"><div className="flex items-center gap-3"><ShieldCheck className="text-[#a7d4a4]" size={20} /><div><h2 className="font-[Space_Grotesk] font-semibold">Quyền admin đang bật</h2><p className="mt-1 text-xs text-[#877d74]">Tài khoản {user.name || "của bạn"} là tài khoản duy nhất có thể xuất bản.</p></div></div></section><section className="rounded-2xl border border-white/10 bg-[#211f1c] p-5"><h2 className="font-[Space_Grotesk] text-base font-semibold">Lưu ý khi upload</h2><div className="mt-4 space-y-4 text-xs leading-5 text-[#a79d92]"><p><b className="text-[#ece2d5]">Tệp nhạc:</b> chọn trực tiếp từ thư viện tệp trên laptop hoặc điện thoại, tối đa 18 MB mỗi lần.</p><p><b className="text-[#ece2d5]">Ảnh bìa:</b> không bắt buộc, nhưng giúp bài hát dễ nhận ra trong thư viện.</p><p><b className="text-[#ece2d5]">Xuất bản:</b> bài hát hiển thị ngay trong trang nghe công khai sau khi upload thành công.</p></div></section></aside>
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#211f1c] p-5 sm:p-7"><div className="flex items-end justify-between gap-4"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8d847b]">Thư viện của bạn</div><h2 className="mt-2 font-[Space_Grotesk] text-xl font-semibold tracking-[-.04em]">Bài đã xuất bản</h2></div><span className="text-xs text-[#847a70]">{library.length} bài</span></div>{isLoadingLibrary ? <div className="flex min-h-32 items-center justify-center text-[#938980]"><LoaderCircle className="mr-2 animate-spin" size={16} /> Đang tải thư viện</div> : library.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-white/12 py-10 text-center text-sm text-[#887e75]">Chưa có bài hát nào. Hãy dùng form phía trên để xuất bản bài đầu tiên.</div> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-y border-white/8 text-[10px] uppercase tracking-[.14em] text-[#837970]"><tr><th className="py-3 font-semibold">Bài hát</th><th className="py-3 font-semibold">Nghệ sĩ</th><th className="py-3 font-semibold">Thể loại</th><th className="py-3 font-semibold">Thời lượng</th><th className="py-3 font-semibold">Trạng thái</th></tr></thead><tbody>{library.map(track => <tr key={track.id} className="border-b border-white/6 text-[#dcd1c4]"><td className="py-4 font-medium">{track.title}</td><td className="py-4 text-[#a79d92]">{track.artist}</td><td className="py-4 text-[#a79d92]">{track.genre || "—"}</td><td className="py-4 text-[#a79d92]">{formatDuration(track.durationSeconds)}</td><td className="py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#a7d4a4]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#a7d4a4]"><span className="h-1.5 w-1.5 rounded-full bg-[#a7d4a4]" />Đã xuất bản</span></td></tr>)}</tbody></table></div>}</section>
      </div>
    </DashboardLayout>
  );
}
