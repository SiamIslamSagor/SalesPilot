import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingCart,
  ChevronLeft,
  Menu,
  LogOut,
  Globe,
  BarChart3,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: "/quotes", icon: FileText, label: t("nav.offers") },
    { to: "/orders", icon: ShoppingCart, label: t("nav.orders") },
    ...((user ? true : false)
      ? [
          { to: "/customers", icon: Users, label: t("nav.customers") },
          { to: "/products", icon: Package, label: t("nav.products") },
        ]
      : []),
    ...(isSuperAdmin
      ? [
          {
            to: "/sales-reports",
            icon: BarChart3,
            label: t("nav.salesReports"),
          },
          { to: "/users", icon: Users, label: t("nav.users") },
          { to: "/settings", icon: Settings, label: t("nav.settings") },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-60"
        } flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 shrink-0 max-sm:fixed max-sm:inset-y-0 max-sm:left-0 max-sm:z-50`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img 
                src="https://www.brandivaate.fi/wp-content/uploads/2024/10/bv-logo-white.svg" 
                alt="Brandivaate Logo" 
                className="h-6 w-auto"
              />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border space-y-3">
            {/* Language switcher */}
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-sidebar-foreground/60" />
              <Select
                value={language}
                onValueChange={v => setLanguage(v as "en" | "fi")}
              >
                <SelectTrigger className="h-7 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="en">{t("lang.en")}</SelectItem>
                  <SelectItem value="fi">{t("lang.fi")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {user && (
              <div className="text-xs text-sidebar-foreground/80 truncate">
                {user.name}
              </div>
            )}
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="flex items-center gap-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            >
              <LogOut size={14} /> {t("nav.signout")}
            </button>
          </div>
        )}
      </aside>

      {/* Mobile overlay when sidebar is open */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto max-sm:ml-16">
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
