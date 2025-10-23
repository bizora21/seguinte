import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PaymentBanner from "./components/PaymentBanner";
import BackToHomeButton from "./components/BackToHomeButton";
import Chatbot from "./components/Chatbot";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductsPage from "./pages/ProductsPage";
import LojasPage from "./pages/LojasPage";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AddProduct from "./pages/AddProduct";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmed from "./pages/OrderConfirmed";
import MyOrders from "./pages/MyOrders";
import MyChats from "./pages/MyChats";
import Chat from "./pages/Chat";
import SearchResults from "./pages/SearchResults";
import StorePage from "./pages/StorePage";
import SobreNosPage from "./pages/SobreNosPage";
import BlogPage from "./pages/BlogPage";
import FaqPage from "./pages/FaqPage";
import ContatoPage from "./pages/ContatoPage";
import NotFound from "./pages/NotFound";
import ConfirmarEncomendaPage from "./pages/ConfirmarEncomendaPage";
import EncomendaSucessoPage from "./pages/EncomendaSucessoPage";
import TermosDeUsoPage from "./pages/TermosDeUsoPage";
import PoliticaDePrivacidadePage from "./pages/PoliticaDePrivacidadePage";
import PoliticaVendedorPage from "./pages/PoliticaVendedorPage";
import CustomerOrderDetails from "./pages/CustomerOrderDetails";
import { HelmetProvider } from "react-helmet-async"; // Importação necessária

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HelmetProvider> {/* Envolve a aplicação com HelmetProvider */}
        <AuthProvider>
          <CartProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <PaymentBanner />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/produtos" element={<ProductsPage />} />
                    <Route path="/lojas" element={<LojasPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute requiredRole="vendedor">
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/adicionar-produto" 
                      element={
                        <ProtectedRoute requiredRole="vendedor">
                          <AddProduct />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/produto/:id" element={<ProductDetail />} />
                    {/* ROTAS INFORMATIVAS */}
                    <Route path="/sobre-nos" element={<SobreNosPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route path="/contato" element={<ContatoPage />} />
                    {/* ROTAS DE ENCOMENDA */}
                    <Route 
                      path="/confirmar-encomenda/:productId" 
                      element={
                        <ProtectedRoute>
                          <ConfirmarEncomendaPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/encomenda-sucesso" 
                      element={
                        <ProtectedRoute>
                          <EncomendaSucessoPage />
                        </ProtectedRoute>
                      } 
                    />
                    {/* ROTAS DE POLÍTICAS LEGAIS */}
                    <Route path="/termos" element={<TermosDeUsoPage />} />
                    <Route path="/privacidade" element={<PoliticaDePrivacidadePage />} />
                    <Route path="/politica-vendedor" element={<PoliticaVendedorPage />} />
                    {/* ROTAS DE PEDIDOS */}
                    <Route 
                      path="/meus-pedidos" 
                      element={
                        <ProtectedRoute>
                          <MyOrders />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/meus-pedidos/:orderId" 
                      element={
                        <ProtectedRoute requiredRole="cliente">
                          <CustomerOrderDetails />
                        </ProtectedRoute>
                      } 
                    />
                    {/* ROTAS ANTIGAS (MANTIDAS PARA COMPATIBILIDADE) */}
                    <Route 
                      path="/carrinho" 
                      element={
                        <ProtectedRoute>
                          <Cart />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/checkout" 
                      element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/encomenda-confirmada" 
                      element={
                        <ProtectedRoute>
                          <OrderConfirmed />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/meus-chats" 
                      element={
                        <ProtectedRoute>
                          <MyChats />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/chat/:chatId" 
                      element={
                        <ProtectedRoute>
                          <Chat />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/busca" element={<SearchResults />} />
                    <Route path="/loja/:sellerId" element={<StorePage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
                <BackToHomeButton />
                <Chatbot />
              </div>
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </HelmetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;