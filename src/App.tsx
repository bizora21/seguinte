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
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/adicionar-produto" element={<AddProduct />} />
                  <Route path="/produto/:id" element={<ProductDetail />} />
                  <Route path="/carrinho" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/pedido-confirmado" element={<OrderConfirmed />} />
                  <Route path="/meus-pedidos" element={<MyOrders />} />
                  <Route path="/meus-chats" element={<MyChats />} />
                  <Route path="/chat/:chatId" element={<Chat />} />
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