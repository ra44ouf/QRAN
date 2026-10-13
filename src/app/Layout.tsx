import { Outlet } from "react-router-dom";
import { BottomNav, SideNav } from "../components/BottomNav";

export function Layout() {
  return (
    <div className="min-h-screen md:flex md:gap-4 md:max-w-6xl md:mx-auto md:p-4">
      <SideNav />
      <main className="flex-1 min-w-0 pb-24 md:pb-4 px-3 md:px-0 pt-3 md:pt-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
