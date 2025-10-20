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
import Dashboard from "./pages/Dashboard";
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
import About from "./pages/About";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
                    path="/adicionar-produto" 
                    element={
                      <ProtectedRoute requiredRole="vendedor">
                        <AddProduct />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/produto/:id" element={<ProductDetail />} />
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
                    path="/pedido-confirmado" 
                    element={
                      <ProtectedRoute>
                        <OrderConfirmed />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/meus-pedidos" 
                    element={
                      <ProtectedRoute>
                        <MyOrders />
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
                  <Route path="/sobre" element={<About />} />
                  <Route path="/blog" element={<Blog />} />
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;