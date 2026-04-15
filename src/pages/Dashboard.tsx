import { useEffect, useState, type ReactNode } from "react";
import {
  LucideIcon,
  User,
  FileText,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Package,
  Euro,
  Percent,
  Clock,
  Users,
  Printer,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  LineChart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import api from "@/services/api";
import {
  DashboardOfferSummary,
  DashboardOrderSummary,
  DashboardData,
} from "@/types/dashboard.types";
import { cn, formatEuro } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  trendValue,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-1">
              {trend === "up" && (
                <ArrowUpRight size={14} className="text-success" />
              )}
              {trend === "down" && (
                <ArrowDownRight size={14} className="text-destructive" />
              )}
              <span
                className={`text-xs ${trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"}`}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function QuotesByStatus({
  status,
  quotes,
  badgeClass,
  seeAllHref,
}: {
  status: string;
  quotes: DashboardOfferSummary[];
  badgeClass: string;
  seeAllHref: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-primary/10 rounded-t-lg">
        <h3 className="text-sm font-semibold text-primary">{status}</h3>
        <div className="flex items-center gap-2">
          <span className={`status-badge ${badgeClass}`}>{quotes.length}</span>
          <Link
            to={seeAllHref}
            className="text-xs text-primary hover:underline font-medium"
          >
            {t("dashboard.seeAll")}
          </Link>
        </div>
      </div>
      <div className="divide-y divide-border">
        {quotes.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            {t("dashboard.noOffers")}
          </p>
        )}
        {quotes.map(q => (
          <Link
            key={q._id}
            to={`/quotes/${q._id}`}
            className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {q.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {q.offerNumber}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm font-medium ml-2 shrink-0">
                  €{q.totalAmount.toLocaleString("de-DE")}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentOrders({ orders }: { orders: DashboardOrderSummary[] }) {
  const { t } = useLanguage();
  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-success/10 rounded-t-lg">
        <h3 className="text-sm font-semibold text-success">
          {t("dashboard.recentOrders")}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-success">{orders.length}</span>
          <Link
            to="/orders"
            className="text-xs text-primary hover:underline font-medium"
          >
            {t("dashboard.seeAll")}
          </Link>
        </div>
      </div>
      <div className="divide-y divide-border">
        {orders.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            {t("dashboard.noRecentOrders")}
          </p>
        )}
        {orders.map(order => (
          <Link
            key={order._id}
            to={`/orders/confirm/${order._id}`}
            className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <ShoppingCart size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.orderNumber}
                  </p>
                </div>
                <div className="text-right ml-2 shrink-0">
                  <p className="text-sm font-medium">
                    €{order.totalAmount.toLocaleString("de-DE")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.itemCount} items
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TopCustomers({
  customers,
}: {
  customers: Array<{
    customerId: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    totalSales: number;
    totalMargin: number;
    type: string;
  }>;
}) {
  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="px-4 py-3 border-b border-border bg-info/10 rounded-t-lg">
        <h3 className="text-sm font-semibold text-info">
          Top Customers by Sales
        </h3>
      </div>
      <div className="divide-y divide-border">
        {customers.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No customers yet</p>
        )}
        {customers.map((customer, index) => (
          <Link
            key={customer.customerId}
            to={`/customers`}
            className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary">
                {index + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {customer.companyName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {customer.contactPerson}
              </p>
            </div>
            <div className="text-right ml-2 shrink-0">
              <p className="text-sm font-medium">
                €{customer.totalSales.toLocaleString("de-DE")}
              </p>
              <p className="text-xs text-muted-foreground">{customer.type}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TopProducts({
  products,
}: {
  products: Array<{
    productId: string;
    productNumber: string;
    name: string;
    brand: string;
    category: string;
    purchasePrice: number;
    salesPrice: number;
    margin: number;
    status: string;
  }>;
}) {
  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="px-4 py-3 border-b border-border bg-warning/10 rounded-t-lg">
        <h3 className="text-sm font-semibold text-warning">
          Top Products by Margin
        </h3>
      </div>
      <div className="divide-y divide-border">
        {products.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No products yet</p>
        )}
        {products.map((product, index) => (
          <Link
            key={product.productId}
            to={`/products`}
            className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-success">
                {index + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {product.brand} • {product.category}
              </p>
            </div>
            <div className="text-right ml-2 shrink-0">
              <p className="text-sm font-medium text-success">
                {product.margin.toFixed(1).replace(".", ",")}%
              </p>
              <p className="text-xs text-muted-foreground">
                €{product.salesPrice.toLocaleString("de-DE")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Icon size={16} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${color}`}>{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-lg border border-border p-4 flex h-full flex-col gap-4 min-w-0 overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="flex-1 min-h-0 w-full">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getDashboardStats();

      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        setError(response.message || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="text-destructive" size={48} />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    stats,
    offerStats,
    orderStats,
    customerStats,
    productStats,
    printingSheetStats,
    financialStats,
    offersByStatus,
  } = dashboardData;

  // Check if we have the new comprehensive data structure
  const hasComprehensiveData = !!(
    offerStats &&
    orderStats &&
    customerStats &&
    productStats &&
    printingSheetStats &&
    financialStats
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2 rounded-md hover:bg-accent transition-colors"
          title="Refresh dashboard"
        >
          <RefreshCw size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Basic Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label={t("dashboard.totalOffers")}
          value={stats.totalOffers}
          icon={FileText}
          color="bg-info/10 text-info"
        />
        <StatCard
          label={t("dashboard.activeOrders")}
          value={orderStats?.byStatus?.completed ?? stats.activeOrders}
          icon={ShoppingCart}
          color="bg-success/10 text-success"
        />
        <StatCard
          label={t("dashboard.totalSales")}
          value={`€${stats.totalSales.toLocaleString("de-DE")}`}
          icon={TrendingUp}
          color="bg-primary/10 text-primary"
        />
      </div>

      {/* Financial Overview */}
      {hasComprehensiveData && financialStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label={t("dashboard.totalRevenue")}
            value={`€${financialStats.totalRevenue.toLocaleString("de-DE")}`}
            icon={Euro}
            color="bg-success/10 text-success"
          />
          <StatCard
            label={t("dashboard.totalMargin")}
            value={`€${financialStats.totalMargin.toLocaleString("de-DE")}`}
            icon={Percent}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            label={t("dashboard.profitMargin")}
            value={`${financialStats.profitMarginPercentage.toFixed(1).replace(".", ",")}%`}
            icon={BarChart3}
            color="bg-info/10 text-info"
          />
          <StatCard
            label={t("dashboard.avgOrderValue")}
            value={`€${financialStats.averageOrderValue.toLocaleString("de-DE")}`}
            icon={TrendingUp}
            color="bg-warning/10 text-warning"
          />
        </div>
      )}

      {/* Offer Statistics & Order Statistics — hidden
      {hasComprehensiveData && offerStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          ...
        </div>
      )}
      */}

      {/* Customer & Product Statistics */}
      {/* {hasComprehensiveData && customerStats && productStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StatsSection title="Customer Statistics" icon={Users}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <StatRow label="Total Customers" value={customerStats.total} />
                <StatRow
                  label="Total Sales"
                  value={`€${customerStats.totalSales.toLocaleString("de-DE")}`}
                />
                <StatRow
                  label="Total Margin"
                  value={`€${customerStats.totalMargin.toLocaleString("de-DE")}`}
                />
              </div>
              <div>
                <StatRow
                  label="Avg Sales/Customer"
                  value={`€${customerStats.averageSalesPerCustomer.toLocaleString("de-DE")}`}
                />
                <StatRow
                  label="Avg Margin/Customer"
                  value={`€${customerStats.averageMarginPerCustomer.toLocaleString("de-DE")}`}
                />
              </div>
            </div>
          </StatsSection>

          <StatsSection title="Product Statistics" icon={Package}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <StatRow label="Total Products" value={productStats.total} />
                <StatRow
                  label="Active Products"
                  value={productStats.byStatus.active}
                />
                <StatRow
                  label="Inactive Products"
                  value={productStats.byStatus.inactive}
                />
              </div>
              <div>
                <StatRow
                  label="With Variants"
                  value={productStats.productsWithVariants}
                />
                <StatRow
                  label="Total Variants"
                  value={productStats.totalVariants}
                />
                <StatRow
                  label="Avg Margin"
                  value={`${productStats.averageMargin.toFixed(1).replace(".", ",")}%`}
                  color="text-success"
                />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold mb-2 text-muted-foreground">
                Top Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {productStats.byCategory.slice(0, 5).map(cat => (
                  <span
                    key={cat.category}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {cat.category} ({cat.count})
                  </span>
                ))}
              </div>
            </div>
          </StatsSection>
        </div>
      )} */}

      {/* Printing Sheet Statistics */}
      {/* {hasComprehensiveData && printingSheetStats && financialStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StatsSection title="Printing Sheet Statistics" icon={Printer}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <StatRow
                  label="Total Sheets"
                  value={printingSheetStats.total}
                />
                <StatRow
                  label="Total Quantity"
                  value={printingSheetStats.totalQuantity}
                />
                <StatRow
                  label="Avg Quantity/Sheet"
                  value={printingSheetStats.averageQuantityPerSheet.toFixed(1)}
                />
              </div>
              <div>
                <p className="text-xs font-bold my-2 text-muted-foreground">
                  By Print Method:
                </p>
                {printingSheetStats.byPrintMethod.slice(0, 4).map(method => (
                  <StatRow
                    key={method.method}
                    label={method.method}
                    value={method.count}
                  />
                ))}
              </div>
            </div>
          </StatsSection>

          <StatsSection title="Financial Overview" icon={Euro}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <StatRow
                  label="Total Revenue"
                  value={`€${financialStats.totalRevenue.toLocaleString("de-DE")}`}
                  color="text-success"
                />
                <StatRow
                  label="Total Margin"
                  value={`€${financialStats.totalMargin.toLocaleString("de-DE")}`}
                  color="text-primary"
                />
                <StatRow
                  label="Profit Margin"
                  value={`${financialStats.profitMarginPercentage.toFixed(1).replace(".", ",")}%`}
                  color="text-info"
                />
              </div>
              <div>
                <StatRow
                  label="Avg Order Value"
                  value={`€${financialStats.averageOrderValue.toLocaleString("de-DE")}`}
                />
                <p className="text-xs font-semibold mb-2 text-muted-foreground mt-2">
                  Revenue by Status
                </p>
                <StatRow
                  label="Pending"
                  value={`€${financialStats.revenueByStatus.pending.toLocaleString("de-DE")}`}
                />
                <StatRow
                  label="Processing"
                  value={`€${financialStats.revenueByStatus.processing.toLocaleString("de-DE")}`}
                />
                <StatRow
                  label="Completed"
                  value={`€${financialStats.revenueByStatus.completed.toLocaleString("de-DE")}`}
                />
              </div>
            </div>
          </StatsSection>
        </div>
      )} */}

      {/* Charts Section */}
      {/* {hasComprehensiveData && offerStats && orderStats && customerStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 items-stretch">
          {financialStats && financialStats.revenueOverTime.length > 0 && (
            <ChartCard title="Revenue Over Time" icon={LineChart}>
              <RevenueChart data={financialStats.revenueOverTime} />
            </ChartCard>
          )}

          {offerStats.offersOverTime.length > 0 && (
            <ChartCard title="Offers Over Time (30 Days)" icon={PieChart}>
              <OffersOverTimeChart data={offerStats.offersOverTime} />
            </ChartCard>
          )}

          <ChartCard title="Offers by Status" icon={PieChart}>
            <OffersByStatusChart data={offerStats.byStatus} />
          </ChartCard>

          <ChartCard title="Orders by Status" icon={PieChart}>
            <OrdersByStatusChart data={orderStats.byStatus} />
          </ChartCard>

          {customerStats.topCustomersBySales.length > 0 && (
            <ChartCard title="Top Customers by Sales" icon={Users}>
              <TopCustomersChart data={customerStats.topCustomersBySales} />
            </ChartCard>
          )}

          {productStats.topProductsByMargin.length > 0 && (
            <ChartCard title="Top Products by Margin" icon={Package}>
              <TopProductsChart data={productStats.topProductsByMargin} />
            </ChartCard>
          )}
        </div>
      )} */}

      {/* Lists Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <QuotesByStatus
          status={t("dashboard.completedOffers")}
          quotes={offersByStatus.completed}
          badgeClass="status-completed"
          seeAllHref="/quotes?status=completed"
        />
        {hasComprehensiveData && orderStats && (
          <RecentOrders orders={orderStats.recentOrders} />
        )}
        <QuotesByStatus
          status={t("dashboard.sentOffers")}
          quotes={offersByStatus.sent}
          badgeClass="status-sent"
          seeAllHref="/quotes?status=sent"
        />
        <QuotesByStatus
          status={t("dashboard.approvedOffers")}
          quotes={offersByStatus.accepted}
          badgeClass="status-approved"
          seeAllHref="/quotes?status=accepted"
        />

        <QuotesByStatus
          status={t("dashboard.inProgressOffers")}
          quotes={offersByStatus.draft}
          badgeClass="status-draft"
          seeAllHref="/quotes?status=draft"
        />
        <QuotesByStatus
          status={t("dashboard.rejectedOffers")}
          quotes={offersByStatus.rejected}
          badgeClass="status-rejected"
          seeAllHref="/quotes?status=rejected"
        />
      </div>

      {/* Top Lists */}
      {/* {hasComprehensiveData && customerStats && productStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TopCustomers customers={customerStats.topCustomersBySales} />
          <TopProducts products={productStats.topProductsByMargin} />
        </div>
      )} */}
    </div>
  );
}
