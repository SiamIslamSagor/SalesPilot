import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound";

// Lazy-loaded page components for code splitting
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Customers = lazy(() => import("@/pages/Customers"));
const CustomerDetail = lazy(() => import("@/pages/CustomerDetail"));
const Products = lazy(() => import("@/pages/Products"));
const ProductEdit = lazy(() => import("@/pages/ProductEdit"));
const ProductCreate = lazy(() => import("@/pages/ProductCreate"));
const Quotes = lazy(() => import("@/pages/Quotes"));
const QuoteDetail = lazy(() => import("@/pages/QuoteDetail"));
const QuoteDuplicate = lazy(() => import("@/pages/QuoteDuplicate"));
const NewQuote = lazy(() => import("@/pages/NewQuote"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderCreate = lazy(() => import("@/pages/OrderCreate"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const PrintingSheet = lazy(() => import("@/pages/PrintingSheet"));
const PrintingSheetView = lazy(() => import("@/pages/PrintingSheetView"));
const OfferView = lazy(() => import("@/pages/OfferView"));
const Users = lazy(() => import("@/pages/Users"));
const UserCreate = lazy(() => import("@/pages/UserCreate"));
const SalesReports = lazy(() => import("@/pages/SalesReports"));
const Settings = lazy(() => import("@/pages/Settings"));

const queryClient = new QueryClient();
const managerRoles = ["admin", "superadmin"] as const;

const App = () => {
  const P = ({
    children,
    allowedRoles,
  }: {
    children: React.ReactNode;
    allowedRoles?: Array<"admin" | "superadmin">;
  }) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route
                    path="/reset-password/:token"
                    element={<ResetPassword />}
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <P>
                        <Dashboard />
                      </P>
                    }
                  />
                  <Route
                    path="/customers"
                    element={
                      <P allowedRoles={[...managerRoles]}>
                        <Customers />
                      </P>
                    }
                  />
                  <Route
                    path="/customers/:id"
                    element={
                      <P allowedRoles={[...managerRoles]}>
                        <CustomerDetail />
                      </P>
                    }
                  />
                  <Route
                    path="/products"
                    element={
                      <P allowedRoles={[...managerRoles]}>
                        <Products />
                      </P>
                    }
                  />
                  <Route
                    path="/products/new"
                    element={
                      <P allowedRoles={[...managerRoles]}>
                        <ProductCreate />
                      </P>
                    }
                  />
                  <Route
                    path="/products/:id/edit"
                    element={
                      <P allowedRoles={[...managerRoles]}>
                        <ProductEdit />
                      </P>
                    }
                  />
                  <Route
                    path="/quotes"
                    element={
                      <P>
                        <Quotes />
                      </P>
                    }
                  />
                  <Route
                    path="/quotes/new"
                    element={
                      <P allowedRoles={[...managerRoles]}>
                        <NewQuote />
                      </P>
                    }
                  />
                  <Route
                    path="/quotes/:id"
                    element={
                      <P>
                        <QuoteDetail />
                      </P>
                    }
                  />
                  <Route
                    path="/quotes/duplicate/:id"
                    element={
                      <P allowedRoles={[...managerRoles]}>
                        <QuoteDuplicate />
                      </P>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <P>
                        <Orders />
                      </P>
                    }
                  />
                  <Route
                    path="/orders/create/:quoteId"
                    element={
                      <P allowedRoles={[...managerRoles]}>
                        <OrderCreate />
                      </P>
                    }
                  />
                  <Route
                    path="/orders/create/:quoteId/print-sheet"
                    element={
                      <P allowedRoles={[...managerRoles]}>
                        <PrintingSheet />
                      </P>
                    }
                  />
                  <Route
                    path="/orders/create/:quoteId/print-sheet/:itemId"
                    element={
                      <P allowedRoles={[...managerRoles]}>
                        <PrintingSheet />
                      </P>
                    }
                  />
                  <Route
                    path="/orders/create/:quoteId/printing-sheets/view"
                    element={
                      <P>
                        <PrintingSheetView />
                      </P>
                    }
                  />
                  <Route
                    path="/orders/:orderId/printing-sheets/view"
                    element={
                      <P>
                        <PrintingSheetView />
                      </P>
                    }
                  />
                  <Route
                    path="/orders/confirm/:orderId"
                    element={
                      <P>
                        <OrderConfirmation />
                      </P>
                    }
                  />
                  <Route
                    path="/sales-reports"
                    element={
                      <P allowedRoles={["superadmin"]}>
                        <SalesReports />
                      </P>
                    }
                  />
                  <Route path="/offers/:id" element={<OfferView />} />
                  <Route
                    path="/settings"
                    element={
                      <P allowedRoles={["superadmin"]}>
                        <Settings />
                      </P>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <P allowedRoles={["superadmin"]}>
                        <Users />
                      </P>
                    }
                  />
                  <Route
                    path="/users/new"
                    element={
                      <P allowedRoles={["superadmin"]}>
                        <UserCreate />
                      </P>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
};

export default App;
