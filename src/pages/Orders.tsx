import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  MoreHorizontal,
  Eye,
  FileText,
  Loader2,
  Printer,
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortableHeader } from "@/components/SortableHeader";
import Pagination from "@/components/Pagination";
import { useLanguage } from "@/i18n/LanguageContext";
import apiService, { type PrintingSheet } from "@/services/api";
import OrderConfirmation from "@/pages/OrderConfirmation";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { parseEuroNumber } from "@/lib/utils";

interface OrderItem {
  productId: string;
  productNumber: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  markingCost: number;
  selectedColor?: string;
  selectedSize?: string;
  printingMethod?: string;
  showUnitPrice: boolean;
  showTotalPrice: boolean;
  hideMarkingCost: boolean;
  generateMockup: boolean;
}

interface Order {
  _id: string;
  orderNumber: string;
  offerId: string;
  offerNumber?: string;
  customerId: string;
  customerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  items: OrderItem[];
  totalAmount: number;
  totalMargin: number;
  salesperson?: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

type SortKey =
  | "orderNumber"
  | "customer"
  | "quoteRef"
  | "status"
  | "salesperson"
  | "createdAt"
  | "totalAmount"
  | "totalMargin";
type SortDir = "asc" | "desc" | null;

export default function Orders() {
  const { t } = useLanguage();
  const { isPrivilegedUser, isSuperAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Search and filter states
  const [orderNumberSearch, setOrderNumberSearch] = useState("");
  const [customerNameSearch, setCustomerNameSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all",
  );

  // Advanced filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [marginMin, setMarginMin] = useState("");
  const [marginMax, setMarginMax] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [salespersonSearch, setSalespersonSearch] = useState("");

  const hasAdvancedFilters = !!(
    amountMin ||
    amountMax ||
    marginMin ||
    marginMax ||
    dateFrom ||
    dateTo ||
    salespersonSearch
  );

  // printing sheets keyed by order id
  const [printingSheetsMap, setPrintingSheetsMap] = useState<
    Record<string, PrintingSheet[]>
  >({});

  // export helper state
  const [exportData, setExportData] = useState<{
    order: Order;
    printingSheets: PrintingSheet[];
  } | null>(null);

  // helper: open order confirmation in new tab for PDF export
  const handleExportPdf = async (order: Order) => {
    try {
      // fetch order and associated printing sheets
      const res = await apiService.getOrderById(order._id);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to retrieve order");
      }
      const sheetsRes = await apiService.getPrintingSheets({
        orderId: order._id,
      });
      const sheets: PrintingSheet[] =
        sheetsRes.success && sheetsRes.data ? sheetsRes.data : [];
      setExportData({ order: res.data as Order, printingSheets: sheets });
    } catch (err) {
      console.error("Direct PDF export error", err);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("orders.exportPdfError"),
      });
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Parameters<typeof apiService.getOrders>[0] = {
          page,
          limit: 10,
        };

        if (orderNumberSearch.trim()) params.search = orderNumberSearch.trim();
        if (customerNameSearch.trim()) params.customerName = customerNameSearch.trim();
        if (statusFilter !== "all") params.status = statusFilter;
        if (amountMin) params.amountMin = amountMin;
        if (amountMax) params.amountMax = amountMax;
        if (marginMin) params.marginMin = marginMin;
        if (marginMax) params.marginMax = marginMax;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        if (salespersonSearch) params.salesperson = salespersonSearch;

        const result = await apiService.getOrders(params);
        if (result.success && result.data) {
          setOrders(result.data);
          setTotalPages(result.pagination.pages);
        } else {
          setError(result.message || t("orders.fetchError"));
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(t("orders.fetchErrorRetry"));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [
    page,
    orderNumberSearch,
    customerNameSearch,
    statusFilter,
    hasAdvancedFilters,
    t,
  ]);

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm(t("orders.confirmDelete"))) return;
    try {
      const result = await apiService.deleteOrder(id);
      if (result.success) {
        toast({
          title: t("common.success"),
          description: t("orders.deleteSuccess"),
        });
        setOrders(prev => prev.filter(o => o._id !== id));
      } else {
        toast({
          title: t("common.error"),
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error deleting order:", err);
      toast({
        title: t("common.error"),
        description: t("orders.deleteError"),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    setPage(1);
  }, [
    orderNumberSearch,
    customerNameSearch,
    statusFilter,
    amountMin,
    amountMax,
    marginMin,
    marginMax,
    dateFrom,
    dateTo,
    salespersonSearch,
  ]);

  // when orders change, fetch all related printing sheets in one batch request
  useEffect(() => {
    if (orders.length === 0) {
      setPrintingSheetsMap({});
      return;
    }

    const loadSheets = async () => {
      const orderIds = orders.map(o => o._id);
      const res = await apiService.getPrintingSheetsByOrderIds(orderIds);
      if (res.success) {
        // Fill missing entries with empty arrays
        const map: Record<string, PrintingSheet[]> = {};
        for (const o of orders) map[o._id] = res.data[o._id] ?? [];
        setPrintingSheetsMap(map);
      }
    };

    loadSheets();
  }, [orders]);

  // effect performing actual PDF generation when exportData is set
  useEffect(() => {
    if (!exportData) return;

    const renderAndDownload = async () => {
      // delay to ensure component rendered
      await new Promise(res => setTimeout(res, 300));
      const container = document.getElementById("export-container");
      if (!container) return;
      try {
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        const pdf = new jsPDF({ unit: "pt", format: "a4" });
        const margin = 40; // ~14mm margins for clean look
        const pageWidth = pdf.internal.pageSize.getWidth(); // 595.28
        const pageHeight = pdf.internal.pageSize.getHeight(); // 841.89
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;

        // Scale canvas to fit usable page width
        const imgWidth = usableWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Calculate how many pages we need
        const totalPages = Math.ceil(imgHeight / usableHeight);

        for (let i = 0; i < totalPages; i++) {
          if (i > 0) pdf.addPage();

          // Calculate the source rectangle from the original canvas
          const sourceY = Math.round(
            ((i * usableHeight) / imgHeight) * canvas.height,
          );
          const sourceHeight = Math.min(
            Math.round((usableHeight / imgHeight) * canvas.height),
            canvas.height - sourceY,
          );

          // Create a temporary canvas for this page slice
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const ctx = pageCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(
              canvas,
              0,
              sourceY,
              canvas.width,
              sourceHeight,
              0,
              0,
              pageCanvas.width,
              sourceHeight,
            );
          }

          const sliceImgHeight = (sourceHeight / canvas.height) * imgHeight;
          pdf.addImage(
            pageCanvas,
            "PNG",
            margin,
            margin,
            imgWidth,
            sliceImgHeight,
          );
        }

        pdf.save(`order-${exportData.order.orderNumber}.pdf`);
      } catch (e) {
        console.error("export render error", e);
      } finally {
        setExportData(null);
      }
    };

    renderAndDownload();
  }, [exportData]);
  const handleSort = (key: string) => {
    const k = key as SortKey;
    if (sortKey === k) {
      setSortDir(d => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: "pending" | "processing" | "completed" | "cancelled",
  ) => {
    try {
      const result = await apiService.updateOrderStatus(orderId, newStatus);
      if (result.success) {
        toast({
          title: t("common.success"),
          description: t("orders.statusUpdateSuccess"),
        });
        // Patch local state — no re-fetch needed
        setOrders(prev =>
          prev.map(o => (o._id === orderId ? { ...o, status: newStatus } : o)),
        );
      } else {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: result.message || t("orders.statusUpdateError"),
        });
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("orders.statusUpdateErrorRetry"),
      });
    }
  };

  const clearFilters = () => {
    setOrderNumberSearch("");
    setCustomerNameSearch("");
    setStatusFilter("all");
    setAmountMin("");
    setAmountMax("");
    setMarginMin("");
    setMarginMax("");
    setDateFrom("");
    setDateTo("");
    setSalespersonSearch("");
    setPage(1);
  };

  const filteredAndSorted = useMemo(() => {
    // Advanced filters are now handled server-side; just sort the current page
    const data = orders;

    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortKey === "customer") {
        av = a.customerName;
        bv = b.customerName;
      } else if (sortKey === "quoteRef") {
        av = a.offerId;
        bv = b.offerId;
      } // Simplified
      else {
        // For other keys, we need to access the property dynamically
        const valueA = (a as unknown as Record<string, unknown>)[sortKey];
        const valueB = (b as unknown as Record<string, unknown>)[sortKey];
        av = valueA as string | number;
        bv = valueB as string | number;
      }
      const cmp =
        typeof av === "string"
          ? av.localeCompare(bv as string)
          : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [
    orders,
    sortKey,
    sortDir,
    amountMin,
    amountMax,
    marginMin,
    marginMax,
    dateFrom,
    dateTo,
    salespersonSearch,
  ]);

  const effectiveTotalPages = totalPages;
  const displayedData = filteredAndSorted;

  const hasActiveFilters =
    orderNumberSearch ||
    customerNameSearch ||
    statusFilter !== "all" ||
    amountMin ||
    amountMax ||
    marginMin ||
    marginMax ||
    dateFrom ||
    dateTo ||
    salespersonSearch;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg sm:text-2xl font-bold">
          {t("orders.salesOrders")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {loading
            ? t("common.loading")
            : hasActiveFilters
              ? `${filteredAndSorted.length} / ${orders.length} ${t("orders.title").toLowerCase()}`
              : `${orders.length} ${t("orders.title").toLowerCase()}`}
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Order Number Search */}
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t("orders.searchOrderId")}
                value={orderNumberSearch}
                onChange={e => setOrderNumberSearch(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Customer Name Search */}
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t("orders.searchCustomerName")}
                value={customerNameSearch}
                onChange={e => setCustomerNameSearch(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-auto min-w-[180px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("orders.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                <SelectItem value="pending">
                  {t("orders.status.pending")}
                </SelectItem>
                <SelectItem value="processing">
                  {t("orders.status.processing")}
                </SelectItem>
                <SelectItem value="completed">
                  {t("orders.status.completed")}
                </SelectItem>
                <SelectItem value="cancelled">
                  {t("orders.status.cancelled")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 w-full"
            >
              <Filter size={14} />
              {t("filters.advancedFilters")}
              {showAdvancedFilters ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </Button>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <X className="h-4 w-4" />
              {t("orders.clearFilters")}
            </Button>
          )}
        </div>

        {showAdvancedFilters && (
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Salesperson */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t("offers.salesperson")}
                </label>
                <Input
                  placeholder={t("filters.searchSalesperson")}
                  value={salespersonSearch}
                  onChange={e => setSalespersonSearch(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Amount Range */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t("filters.amountRange")} (€)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder={t("filters.min")}
                    value={amountMin}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                        const display =
                          amountMin === "0" &&
                          v.length > 1 &&
                          !v.startsWith("0.") &&
                          !v.startsWith("0,")
                            ? v.replace(/^0+/, "") || "0"
                            : v;
                        setAmountMin(display);
                      }
                    }}
                    className="w-full min-w-0"
                  />
                  <span className="flex items-center text-muted-foreground shrink-0">
                    —
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder={t("filters.max")}
                    value={amountMax}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                        const display =
                          amountMax === "0" &&
                          v.length > 1 &&
                          !v.startsWith("0.") &&
                          !v.startsWith("0,")
                            ? v.replace(/^0+/, "") || "0"
                            : v;
                        setAmountMax(display);
                      }
                    }}
                    className="w-full min-w-0"
                  />
                </div>
              </div>

              {/* Margin Range */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t("filters.marginRange")} (€)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder={t("filters.min")}
                    value={marginMin}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                        const display =
                          marginMin === "0" &&
                          v.length > 1 &&
                          !v.startsWith("0.") &&
                          !v.startsWith("0,")
                            ? v.replace(/^0+/, "") || "0"
                            : v;
                        setMarginMin(display);
                      }
                    }}
                    className="w-full min-w-0"
                  />
                  <span className="flex items-center text-muted-foreground shrink-0">
                    —
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder={t("filters.max")}
                    value={marginMax}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                        const display =
                          marginMax === "0" &&
                          v.length > 1 &&
                          !v.startsWith("0.") &&
                          !v.startsWith("0,")
                            ? v.replace(/^0+/, "") || "0"
                            : v;
                        setMarginMax(display);
                      }
                    }}
                    className="w-full min-w-0"
                  />
                </div>
              </div>

              {/* Created Date Range */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t("filters.dateRange")}
                </label>
                <div className="flex max-sm:flex-col gap-2 items-center">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-full min-w-0"
                  />
                  <span className="text-muted-foreground text-sm shrink-0 max-sm:hidden">
                    —
                  </span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="w-full min-w-0"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
          <p className="text-destructive font-medium mb-2">
            {t("common.error")}
          </p>
          <p className="text-sm text-destructive/80">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              {t("orders.loadingOrders")}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <SortableHeader
                    label={t("orders.orderNumber")}
                    sortKey="orderNumber"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    label={t("common.customer")}
                    sortKey="customer"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    label={t("orders.offerRef")}
                    sortKey="quoteRef"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    label={t("common.status")}
                    sortKey="status"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    label={t("offers.salesperson")}
                    sortKey="salesperson"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    label={t("common.created")}
                    sortKey="createdAt"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    label={t("common.amount")}
                    sortKey="totalAmount"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                    className="text-right"
                  />
                  <SortableHeader
                    label={t("common.margin")}
                    sortKey="totalMargin"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                    className="text-right"
                  />
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedData.map(o => (
                  <tr
                    key={o._id}
                    className="hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/orders/confirm/${o._id}`)}
                  >
                    <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3">{o.customerName}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/quotes/${o.offerId}`}
                        className="text-primary hover:underline"
                      >
                        {o.offerNumber || o.offerId}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {isPrivilegedUser &&
                      o.status !== "completed" &&
                      o.status !== "cancelled" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`status-badge ${o.status === "processing" ? "status-sent" : "status-draft"}`}
                            >
                              {t(`orders.status.${o.status}`)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {o.status === "pending" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(o._id, "processing")
                                }
                              >
                                {t("orders.status.processing")}
                              </DropdownMenuItem>
                            )}
                            {o.status === "processing" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(o._id, "completed")
                                }
                              >
                                {t("orders.status.completed")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(o._id, "cancelled")
                              }
                              className="text-destructive"
                            >
                              {t("orders.status.cancelled")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span
                          className={`status-badge ${o.status === "completed" ? "status-completed" : o.status === "processing" ? "status-sent" : o.status === "cancelled" ? "status-cancelled" : "status-draft"}`}
                        >
                          {t(`orders.status.${o.status}`)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.salesperson || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      €{o.totalAmount.toLocaleString("de-DE")}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-success">
                      €{o.totalMargin.toLocaleString("de-DE")}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={e => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/orders/confirm/${o._id}`)}
                          >
                            <Eye size={14} className="mr-2" />{" "}
                            {t("orders.viewOrder")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              handleExportPdf(o);
                            }}
                          >
                            <FileText size={14} className="mr-2" />{" "}
                            {t("orders.exportPdf")}
                          </DropdownMenuItem>
                          {isSuperAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteOrder(o._id);
                                }}
                              >
                                <Trash2 size={14} className="mr-2" />{" "}
                                {t("common.delete")}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-3">
            <Pagination
              currentPage={page}
              totalPages={effectiveTotalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
      {/* hidden exporter component */}
      {exportData && (
        <div
          id="export-container"
          style={{
            position: "absolute",
            top: "-9999px",
            left: "-9999px",
            width: "794px",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#000000",
            background: "#ffffff",
            padding: "24px",
          }}
        >
          {/* PDF style overrides for readable output */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
              #export-container * {
                color: #111111 !important;
              }
              #export-container .text-xs {
                font-size: 12px !important;
              }
              #export-container .text-sm {
                font-size: 13px !important;
              }
              #export-container .text-muted-foreground {
                color: #444444 !important;
              }
              #export-container .bg-card {
                background: #ffffff !important;
                border-color: #cccccc !important;
              }
              #export-container .bg-muted {
                background: #f5f5f5 !important;
              }
              #export-container .bg-muted\\/50 {
                background: #f5f5f5 !important;
              }
              #export-container table {
                border-collapse: collapse;
                width: 100%;
              }
              
              #export-container th,
              #export-container td {
                border: 1px solid #cccccc !important;
                padding: 6px 8px 18px !important;
                vertical-align: middle !important;
                text-align: center !important;
              }
              #export-container td:first-child,
              #export-container th:first-child {
                text-align: left !important;
              }
              #export-container td > div,
              #export-container th > div {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                height: 100% !important;
                min-height: inherit !important;
              }
              #export-container td:first-child > div,
              #export-container th:first-child > div {
                justify-content: flex-start !important;
              }
              #export-container .border-border {
                border-color: #cccccc !important;
              }
              #export-container h1 {
                font-size: 22px !important;
              }
              #export-container h2 {
                font-size: 18px !important;
              }
              #export-container h3 {
                font-size: 16px !important;
              }
              #export-container p,
              #export-container span,
              #export-container label {
                font-size: inherit;
              }
            `,
            }}
          />
          <OrderConfirmation
            initialOrder={exportData.order}
            initialSheets={exportData.printingSheets}
            pdfMode={true}
          />
        </div>
      )}
    </div>
  );
}
