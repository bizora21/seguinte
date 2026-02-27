import React, { Suspense } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PaymentBanner from "./components/PaymentBanner";
import BackToHomeButton from "./components/BackToHomeButton";
import Chatbot from "./components/Chatbot";
import FloatingAppButton from "./components/FloatingAppButton";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop";
import LeadCapturePopup from "./components/LeadCapturePopup";

// Rotas Críticas (Carregamento Eager)
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import OAuthCallbackPage from "./pages/OAuthCallbackPage"; 

// Rotas Lazy Loaded (Code Splitting)
const ProductsPage = React.lazy(() => import("./pages/ProductsPage"));
const LojasPage = React.lazy(() => import("./pages/LojasPage"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const AdminMarketingCenter = React.lazy(() => import("./pages/AdminMarketingCenter"));
const AdminIntelligence = React.lazy(() => import("./components/Admin/AdminIntelligence"));
const ManageProduct = React.lazy(() => import("./pages/ManageProduct"));
const ProductDetail = React.lazy(() => import("./pages/ProductDetail"));
const Cart = React.lazy(() => import("./pages/Cart"));
const Checkout = React.lazy(() => import("./pages/Checkout"));
const OrderConfirmed = React.lazy(() => import("./pages/OrderConfirmed"));
const MyOrders = React.lazy(() => import("./pages/MyOrders"));
const MyChats = React.lazy(() => import("./pages/MyChats"));
const Chat = React.lazy(() => import("./pages/Chat"));
const SearchResults = React.lazy(() => import("./pages/SearchResults"));
const StorePage = React.lazy(() => import("./pages/StorePage"));
const SobreNosPage = React.lazy(() => import("./pages/SobreNosPage"));
const BlogPage = React.lazy(() => import("./pages/BlogPage"));
const BlogDetail = React.lazy(() => import("./pages/BlogDetail"));
const FaqPage = React.lazy(() => import("./pages/FaqPage"));
const ContatoPage = React.lazy(() => import("./pages/ContatoPage"));
const ConfirmarEncomendaPage = React.lazy(() => import("./pages/ConfirmarEncomendaPage"));
const EncomendaSucessoPage = React.lazy(() => import("./pages/EncomendaSucessoPage"));
const TermosDeUsoPage = React.lazy(() => import("./pages/TermosDeUsoPage"));
const PoliticaDePrivacidadePage = React.lazy(() => import("./pages/PoliticaDePrivacidadePage"));
const PoliticaVendedorPage = React.lazy(() => import("./pages/PoliticaVendedorPage"));
const CustomerOrderDetails = React.lazy(() => import("./pages/CustomerOrderDetails"));
const TestSocial = React.lazy(() => import("./pages/TestSocial"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HelmetProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ScrollToTop />
              <div className="min-h-screen bg-gray-50 flex flex-col w-full overflow-x-hidden">
                <Header />
                <PaymentBanner />
                <main className="flex-1 w-full">
                  <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/produtos" element={<ProductsPage />} />
                      <Route path="/lojas" element={<LojasPage />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      
                      <Route path="/teste-social" element={<TestSocial />} />
                      <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

                      <Route path="/dashboard" element={<Navigate to="/dashboard/seller" replace />} />
                      <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />

                      <Route 
                        path="/dashboard/seller" 
                        element={
                          <ProtectedRoute requiredRole="vendedor">
                            <Dashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/dashboard/admin" 
                        element={
                          <AdminRoute>
                            <AdminDashboard />
                          </AdminRoute>
                        } 
                      />
                      <Route 
                        path="/dashboard/admin/marketing" 
                        element={
                          <AdminRoute>
                            <AdminMarketingCenter />
                          </AdminRoute>
                        } 
                      />
                      <Route 
                        path="/dashboard/admin/intelligence" 
                        element={
                          <AdminRoute>
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                <AdminIntelligence />
                            </div>
                          </AdminRoute>
                        } 
                      />
                      
                      <Route 
                        path="/account/customer" 
                        element={
                          <ProtectedRoute requiredRole="cliente">
                            <Navigate to="/lojas" replace />
                          </ProtectedRoute>
                        } 
                      />

                      <Route 
                        path="/adicionar-produto" 
                        element={
                          <ProtectedRoute requiredRole="vendedor">
                            <ManageProduct />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/produto/:id" element={<ProductDetail />} />
                      <Route path="/sobre-nos" element={<SobreNosPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogDetail />} />
                      
                      <Route path="/faq" element={<FaqPage />} />
                      <Route path="/contato" element={<ContatoPage />} />
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
                      <Route path="/termos" element={<TermosDeUsoPage />} />
                      <Route path="/privacidade" element={<PoliticaDePrivacidadePage />} />
                      <Route path="/politica-vendedor" element={<PoliticaVendedorPage />} />
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
                  </Suspense>
                </main>
                <Footer />
                <BackToHomeButton />
                <Chatbot />
                <FloatingAppButton />
                <LeadCapturePopup /> 
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