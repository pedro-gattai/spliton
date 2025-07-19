import { Link, useLocation } from "react-router-dom";
import { Home, Users, Clock, User } from "lucide-react";

export const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/groups", icon: Users, label: "Grupos" },
    { path: "/history", icon: Clock, label: "Histórico" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-2">
      <div className="mobile-container">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center min-w-touch min-h-touch rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-ton-gradient text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};