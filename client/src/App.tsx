import { Component, Suspense, lazy, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";

class ErrorBoundary extends Component<{ children: any }, { error: any }> {
  state = { error: null as any };
  static getDerivedStateFromError(error: Error) { return { error: { message: error.message, stack: (error.stack || "").split("\n").slice(0, 6).join("\n") } }; }
  render() {
    if (this.state.error) return <div className="p-8 text-white font-mono text-sm">⚠ Error: {this.state.error.message}<pre className="mt-2 text-xs opacity-60 whitespace-pre-wrap">{this.state.error.stack}</pre></div>;
    return this.props.children;
  }
}
import { Gavel, Home, Search, PlusCircle, Heart, User } from "lucide-react";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ToastContainer from "./components/Toast";
import { useAuthStore } from "./store/authStore";
import { connectSocket, joinUser } from "./services/socket";

const HomePage = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Auctions = lazy(() => import("./pages/Auctions"));
const AuctionDetail = lazy(() => import("./pages/AuctionDetail"));
const CreateAuction = lazy(() => import("./pages/CreateAuction"));
const ScanCard = lazy(() => import("./pages/ScanCard"));
const Profile = lazy(() => import("./pages/Profile"));
const Wanted = lazy(() => import("./pages/Wanted"));
const Collection = lazy(() => import("./pages/Collection"));
const Settings = lazy(() => import("./pages/Settings"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00C8FF]" />
    </div>
  );
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  const loadUser = useAuthStore((s) => s.loadUser);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  useEffect(() => {
    if (token) loadUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      connectSocket();
      joinUser(); // JWT token is extracted on server, no userId param needed
    }
  }, [user?.id]);

  const hideNav = location.pathname === "/login" || location.pathname === "/register";
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col bg-[#050A12]">
      {!hideNav && <Navbar />}
      <main className="flex-1 pb-16 md:pb-0">
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auctions" element={<Auctions />} />
            <Route path="/auctions/:id" element={<AuctionDetail />} />
            <Route
              path="/create"
              element={<ProtectedRoute><CreateAuction /></ProtectedRoute>}
            />
            <Route
              path="/scan"
              element={<ProtectedRoute><ScanCard /></ProtectedRoute>}
            />
            <Route
              path="/profile"
              element={<ProtectedRoute><ErrorBoundary><Profile /></ErrorBoundary></ProtectedRoute>}
            />
            <Route path="/users/:id" element={<Profile />} />
            <Route path="/wanted" element={<Wanted />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/collection/:id" element={<Collection />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route
              path="/settings"
              element={<ProtectedRoute><Settings /></ProtectedRoute>}
            />
          </Routes>
        </Suspense>
      </main>

      <ToastContainer />

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050A12]/95 backdrop-blur-lg border-t border-[rgba(0,200,255,0.1)]">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { path: "/", icon: Home, label: "Domů" },
            { path: "/auctions", icon: Search, label: "Aukce" },
            { path: "/create", icon: PlusCircle, label: "Přidat", primary: true },
            { path: "/wanted", icon: Heart, label: "Poptávky" },
            { path: "/profile", icon: User, label: "Profil", protected: true },
          ].map((item) => {
            const Icon = item.icon;
            const active = item.path === "/" ? location.pathname === "/" : isActive(item.path);
            if (item.protected && !token) return null;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                  item.primary
                    ? "relative -top-3"
                    : active
                      ? "text-[#00C8FF]"
                      : "text-gray-500"
                }`}
              >
                {item.primary ? (
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#A7FF00] to-[#5CFF00] shadow-[0_0_20px_rgba(124,255,0,0.4)]">
                    <Icon className="h-6 w-6 text-[#050A12]" />
                  </div>
                ) : (
                  <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_rgba(0,200,255,0.5)]" : ""}`} />
                )}
                <span className="text-[10px] font-heading font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
