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
import AdminRoute from "./components/AdminRoute";
import ToastContainer from "./components/Toast";
import CookieConsent from "./components/CookieConsent";
import { useAuthStore } from "./store/authStore";
import { connectSocket, joinUser } from "./services/socket";
import { useTranslation } from "./hooks/useTranslation";

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
const CardDatabasePage = lazy(() => import("./pages/CardDatabasePage"));
const CardSetDetailPage = lazy(() => import("./pages/CardSetDetailPage"));
const CardDetailPage = lazy(() => import("./pages/CardDetailPage"));
const Settings = lazy(() => import("./pages/Settings"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const LegalTermsPage = lazy(() => import("./pages/LegalTermsPage"));
const LegalPrivacyPage = lazy(() => import("./pages/LegalPrivacyPage"));
const LegalCookiesPage = lazy(() => import("./pages/LegalCookiesPage"));
const LegalAuctionRulesPage = lazy(() => import("./pages/LegalAuctionRulesPage"));
const LegalProhibitedPage = lazy(() => import("./pages/LegalProhibitedPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const LegalFeesPage = lazy(() => import("./pages/LegalFeesPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminReportsPage = lazy(() => import("./pages/AdminReportsPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminAuctions = lazy(() => import("./pages/AdminAuctions"));
const AdminBids = lazy(() => import("./pages/AdminBids"));
const AdminCards = lazy(() => import("./pages/AdminCards"));
const AdminCardDatabase = lazy(() => import("./pages/AdminCardDatabase"));
const AdminUploads = lazy(() => import("./pages/AdminUploads"));
const AdminStats = lazy(() => import("./pages/AdminStats"));
const AdminAiControl = lazy(() => import("./pages/AdminAiControl"));
const AdminAiReview = lazy(() => import("./pages/AdminAiReview"));
const AdminAiRisk = lazy(() => import("./pages/AdminAiRisk"));
const AdminAiPricing = lazy(() => import("./pages/AdminAiPricing"));
const AdminAiSupport = lazy(() => import("./pages/AdminAiSupport"));
const AdminAiLegalCheck = lazy(() => import("./pages/AdminAiLegalCheck"));
const AdminLegal = lazy(() => import("./pages/AdminLegal"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettings"));
const AdminAuditLog = lazy(() => import("./pages/AdminAuditLog"));
const AdminSecurity = lazy(() => import("./pages/AdminSecurity"));
const AdminEmails = lazy(() => import("./pages/AdminEmails"));
const AdminSystem = lazy(() => import("./pages/AdminSystem"));

function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00C8FF]" />
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const loadUser = useAuthStore((s) => s.loadUser);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      connectSocket();
      joinUser();
    }
  }, [user?.id]);

  const hideNav = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/forgot-password" || location.pathname.startsWith("/reset-password") || location.pathname.startsWith("/admin");
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col bg-[#050A12]">
      {/* Skip to content — pro klávesnicovou navigaci */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[#00C8FF] focus:text-[#050A12] focus:font-bold focus:outline-none"
      >
        Přeskočit na hlavní obsah
      </a>
      {!hideNav && <Navbar />}
      <main id="main-content" className="flex-1 pb-16 md:pb-0">
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
            <Route path="/cards" element={<CardDatabasePage />} />
            <Route path="/cards/sets/:setSlug" element={<CardSetDetailPage />} />
            <Route path="/cards/card/:cardId" element={<CardDetailPage />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Admin routes — chráněno AdminRoute (kontrola role) */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/auctions" element={<AdminRoute><AdminAuctions /></AdminRoute>} />
            <Route path="/admin/bids" element={<AdminRoute><AdminBids /></AdminRoute>} />
            <Route path="/admin/cards" element={<AdminRoute><AdminCards /></AdminRoute>} />
            <Route path="/admin/card-database" element={<AdminRoute><AdminCardDatabase /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
            <Route path="/admin/uploads" element={<AdminRoute><AdminUploads /></AdminRoute>} />
            <Route path="/admin/stats" element={<AdminRoute><AdminStats /></AdminRoute>} />
            <Route path="/admin/ai-control" element={<AdminRoute><AdminAiControl /></AdminRoute>} />
            <Route path="/admin/ai-review" element={<AdminRoute><AdminAiReview /></AdminRoute>} />
            <Route path="/admin/ai-risk" element={<AdminRoute><AdminAiRisk /></AdminRoute>} />
            <Route path="/admin/ai-pricing" element={<AdminRoute><AdminAiPricing /></AdminRoute>} />
            <Route path="/admin/ai-support" element={<AdminRoute><AdminAiSupport /></AdminRoute>} />
            <Route path="/admin/ai-legal-check" element={<AdminRoute><AdminAiLegalCheck /></AdminRoute>} />
            <Route path="/admin/legal" element={<AdminRoute><AdminLegal /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
            <Route path="/admin/audit-log" element={<AdminRoute><AdminAuditLog /></AdminRoute>} />
            <Route path="/admin/security" element={<AdminRoute><AdminSecurity /></AdminRoute>} />
            <Route path="/admin/emails" element={<AdminRoute><AdminEmails /></AdminRoute>} />
            <Route path="/admin/system" element={<AdminRoute><AdminSystem /></AdminRoute>} />
            <Route path="/legal/terms" element={<LegalTermsPage />} />
            <Route path="/legal/privacy" element={<LegalPrivacyPage />} />
            <Route path="/legal/cookies" element={<LegalCookiesPage />} />
            <Route path="/legal/auction-rules" element={<LegalAuctionRulesPage />} />
            <Route path="/legal/prohibited-items" element={<LegalProhibitedPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/legal/fees" element={<LegalFeesPage />} />
            <Route
              path="/settings"
              element={<ProtectedRoute><Settings /></ProtectedRoute>}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      <CookieConsent />
      <ToastContainer />

      {/* Footer – skrýt na admin stránkách */}
      {!location.pathname.startsWith("/admin") && (
      <footer className="border-t border-[rgba(0,200,255,0.06)] py-8 mt-auto">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-600">
            <Link to="/legal/terms" className="hover:text-gray-400 transition-colors">{t("footer.terms")}</Link>
            <Link to="/legal/privacy" className="hover:text-gray-400 transition-colors">{t("footer.privacy")}</Link>
            <Link to="/legal/cookies" className="hover:text-gray-400 transition-colors">{t("footer.cookies")}</Link>
            <Link to="/legal/auction-rules" className="hover:text-gray-400 transition-colors">{t("footer.auctionRules")}</Link>
            <Link to="/legal/prohibited-items" className="hover:text-gray-400 transition-colors">{t("footer.prohibited")}</Link>
            <Link to="/contact" className="hover:text-gray-400 transition-colors">{t("footer.contact")}</Link>
            <Link to="/faq" className="hover:text-gray-400 transition-colors">FAQ</Link>
            <Link to="/legal/fees" className="hover:text-gray-400 transition-colors">Ceník a poplatky</Link>
          </div>
          {/* Atribuce zdrojů dat */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-gray-500 mt-3">
            <span>Card data © <a href="https://pokemontcg.io" target="_blank" rel="noopener" className="hover:text-gray-500">Pokémon TCG API</a> (CC0)</span>
            <span>Magic data © <a href="https://scryfall.com" target="_blank" rel="noopener" className="hover:text-gray-500">Scryfall</a> (CC0)</span>
            <span>Yu-Gi-Oh! data © <a href="https://ygoprodeck.com" target="_blank" rel="noopener" className="hover:text-gray-500">YGOPRODeck</a></span>
            <span>Sold prices based on <a href="https://www.ebay.com" target="_blank" rel="noopener" className="hover:text-gray-500">eBay</a> data</span>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">© {new Date().getFullYear()} CardPlace s.r.o. {t("footer.rights")}</p>
          <p className="text-[10px] text-gray-500 text-center mt-1">
            IČO: 12345678 • DIČ: CZ12345678 • Sídlo: Praha, Česká republika • Zapsáno v OR u Městského soudu v Praze, oddíl C, vložka 123456
          </p>
        </div>
      </footer>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050A12]/95 backdrop-blur-lg border-t border-[rgba(0,200,255,0.1)]" aria-label="Mobilní navigace">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { path: "/", icon: Home, label: t("nav.home") },
            { path: "/auctions", icon: Search, label: t("nav.auctions") },
            { path: "/create", icon: PlusCircle, label: t("nav.add"), primary: true },
            { path: "/wanted", icon: Heart, label: t("nav.wanted") },
            { path: "/profile", icon: User, label: t("nav.profile"), protected: true },
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
