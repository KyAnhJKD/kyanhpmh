// Design system: Admin shell uses the provided responsive dashboard primitive, translated into Melody Hub's compact management navigation.
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { House, LogOut, Music2, PanelLeft } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: Music2, label: "Quản trị nhạc", path: "/admin" },
  { icon: House, label: "Trang nghe nhạc", path: "/" },
];

const SIDEBAR_WIDTH_KEY = "melody-admin-sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? Number.parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#151412] px-5 text-[#f4efe6]">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#211f1c] p-8 text-center shadow-2xl">
          <span className="inline-flex rounded-full bg-[#ff6b4a]/15 p-3 text-[#ff8a70]"><Music2 size={22} /></span>
          <h1 className="mt-5 font-[Space_Grotesk] text-2xl font-semibold tracking-tight">Đăng nhập để quản trị</h1>
          <p className="mt-3 text-sm leading-6 text-[#a79d92]">Khu vực này chỉ dành cho tài khoản chủ sở hữu Kỳ Anh PMH Mỹ Tho để tải lên và quản lý nhạc.</p>
          <Button onClick={() => startLogin()} className="mt-7 w-full bg-[#ff6b4a] text-[#2a1712] hover:bg-[#ff8a70]">Đăng nhập quản trị</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = event.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-white/10 bg-[#1b1917] text-[#ece2d5]" disableTransition={isResizing}>
          <SidebarHeader className="h-18 justify-center border-b border-white/8">
            <div className="flex w-full items-center gap-3 px-3 transition-all">
              <button onClick={toggleSidebar} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#a79d92] transition-colors hover:bg-white/8 hover:text-white" aria-label="Thu gọn điều hướng">
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed && <div className="min-w-0"><span className="font-[Space_Grotesk] text-sm font-semibold tracking-tight">Kỳ Anh PMH Mỹ Tho</span><span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-[#ff8064]">Admin studio</span></div>}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 pt-4">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-10 font-normal text-[#a79d92] transition-all hover:bg-white/7 hover:text-white data-[active=true]:bg-[#ff6b4a]/15 data-[active=true]:text-[#ff9a83]">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-white/8 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-white/7 group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-9 w-9 shrink-0 border border-white/10"><AvatarFallback className="bg-[#d7b3a3] text-xs font-medium text-[#39251f]">{user?.name?.slice(0, 2).toUpperCase() || "AD"}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-medium leading-none text-[#eee5d9]">{user?.name || "Admin"}</p><p className="mt-1.5 truncate text-xs text-[#827970]">Quản trị viên</p></div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-white/10 bg-[#27231f] text-[#eee5d9]">
                <DropdownMenuItem onClick={() => void logout()} className="cursor-pointer text-[#ff9a83] focus:text-[#ff9a83]"><LogOut className="mr-2 h-4 w-4" /><span>Đăng xuất</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div className={`absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition-colors hover:bg-[#ff6b4a]/25 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => !isCollapsed && setIsResizing(true)} />
      </div>
      <SidebarInset className="bg-[#151412]">
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/8 bg-[#151412]/95 px-4 backdrop-blur md:hidden"><SidebarTrigger className="h-9 w-9 rounded-lg bg-white/5 text-[#f4efe6]" /><span className="text-sm font-semibold text-[#ece2d5]">Admin studio</span></div>
        <main className="min-h-screen flex-1">{children}</main>
      </SidebarInset>
    </>
  );
}
