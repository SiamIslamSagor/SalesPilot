import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  Euro,
  ShoppingCart,
  Percent,
  Loader2,
  CalendarIcon,
  X,
  Check,
  ChevronsUpDown,
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trophy,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useLanguage } from "@/i18n/LanguageContext";
import { TranslationKey } from "@/i18n/translations";
import api, { Customer } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type DatePreset = "all" | "today" | "7d" | "30d" | "90d" | "year" | "custom";

const DATE_PRESETS: { value: DatePreset; labelKey: TranslationKey }[] = [
  { value: "all", labelKey: "salesReports.allTime" },
  { value: "today", labelKey: "salesReports.today" },
  { value: "7d", labelKey: "salesReports.last7Days" },
  { value: "30d", labelKey: "salesReports.last30Days" },
  { value: "90d", labelKey: "salesReports.last90Days" },
  { value: "year", labelKey: "salesReports.thisYear" },
  { value: "custom", labelKey: "salesReports.customRange" },
];

function getDateRange(preset: DatePreset): { from?: string; to?: string } {
  if (preset === "all" || preset === "custom") return {};
  const now = new Date();
  const to = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  ).toISOString();

  if (preset === "today") {
    const from = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toISOString();
    return { from, to };
  }
  if (preset === "year") {
    const from = new Date(now.getFullYear(), 0, 1).toISOString();
    return { from, to };
  }

  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const from = new Date(now);
  from.setDate(from.getDate() - daysMap[preset]);
  return { from: from.toISOString(), to };
}

interface SalesReport {
  totals: { totalSales: number; totalMargin: number; orderCount: number };
  byCustomer: Array<{
    customerId: string;
    customerName: string;
    totalSales: number;
    totalMargin: number;
    orderCount: number;
  }>;
  bySalesperson: Array<{
    salesperson: string;
    totalSales: number;
    totalMargin: number;
    orderCount: number;
  }>;
}

export default function SalesReports() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<SalesReport | null>(null);

  // Filters
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);

  const [salespersons, setSalespersons] = useState<string[]>([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("all");
  const [salespersonSearch, setSalespersonSearch] = useState("");
  const [salespersonDropdownOpen, setSalespersonDropdownOpen] = useState(false);

  // Table search
  const [customerTableSearch, setCustomerTableSearch] = useState("");
  const [salespersonTableSearch, setSalespersonTableSearch] = useState("");

  // Table sorting
  type SortField =
    | "name"
    | "sales"
    | "margin"
    | "marginPct"
    | "orders"
    | "share";
  type SortDir = "asc" | "desc";
  const [customerSort, setCustomerSort] = useState<{
    field: SortField;
    dir: SortDir;
  }>({ field: "sales", dir: "desc" });
  const [salespersonSort, setSalespersonSort] = useState<{
    field: SortField;
    dir: SortDir;
  }>({ field: "sales", dir: "desc" });

  // Load customer list for filter dropdown
  useEffect(() => {
    api.fetchCustomers({ page: 1, limit: 500 }).then(res => {
      if (res.success && res.data) setCustomers(res.data);
    });
  }, []);

  // Load report when filters change
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, selectedCustomer, selectedSalesperson]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.getSalesReport({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        customerId: selectedCustomer !== "all" ? selectedCustomer : undefined,
        salesperson:
          selectedSalesperson !== "all" ? selectedSalesperson : undefined,
      });

      if (!res.success) {
        toast({
          title: t("common.error"),
          description: (res as { success: false; message: string }).message,
          variant: "destructive",
        });
        return;
      }

      setReport(res.data);
      // Extract unique salespersons for the filter dropdown
      const uniqueSP = res.data.bySalesperson
        .map(s => s.salesperson)
        .filter(s => s && s !== "Unassigned");
      setSalespersons(prev => {
        const merged = Array.from(new Set([...prev, ...uniqueSP]));
        return merged;
      });
    } catch {
      toast({
        title: t("common.error"),
        description: "Failed to load sales report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = useCallback((preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    if (preset === "all") {
      setCustomFrom(undefined);
      setCustomTo(undefined);
      setDateFrom(undefined);
      setDateTo(undefined);
      return;
    }
    const range = getDateRange(preset);
    setCustomFrom(range.from ? new Date(range.from) : undefined);
    setCustomTo(range.to ? new Date(range.to) : undefined);
    setDateFrom(range.from);
    setDateTo(range.to);
  }, []);

  const handleApplyCustomRange = useCallback(() => {
    setDateFrom(customFrom ? customFrom.toISOString() : undefined);
    setDateTo(
      customTo
        ? new Date(
            customTo.getFullYear(),
            customTo.getMonth(),
            customTo.getDate(),
            23,
            59,
            59,
            999,
          ).toISOString()
        : undefined,
    );
  }, [customFrom, customTo]);

  const handleClearFilters = useCallback(() => {
    setDatePreset("all");
    setCustomFrom(undefined);
    setCustomTo(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedCustomer("all");
    setCustomerSearch("");
    setSelectedSalesperson("all");
    setSalespersonSearch("");
    setCustomerTableSearch("");
    setSalespersonTableSearch("");
  }, []);

  const sortedCustomerDropdown = useMemo(() => {
    const term = customerSearch.toLowerCase().trim();
    if (!term) return customers;
    return [...customers].sort((a, b) => {
      const aMatch = a.companyName.toLowerCase().includes(term);
      const bMatch = b.companyName.toLowerCase().includes(term);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }, [customers, customerSearch]);

  const sortedSalespersonDropdown = useMemo(() => {
    const term = salespersonSearch.toLowerCase().trim();
    if (!term) return salespersons;
    return [...salespersons].sort((a, b) => {
      const aMatch = a.toLowerCase().includes(term);
      const bMatch = b.toLowerCase().includes(term);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }, [salespersons, salespersonSearch]);

  const selectedCustomerName = useMemo(() => {
    if (selectedCustomer === "all") return t("salesReports.allCustomers");
    return (
      customers.find(c => c.id === selectedCustomer)?.companyName ||
      selectedCustomer
    );
  }, [selectedCustomer, customers, t]);

  const selectedSalespersonName = useMemo(() => {
    if (selectedSalesperson === "all") return t("salesReports.allSalespersons");
    return selectedSalesperson;
  }, [selectedSalesperson, t]);

  // Computed KPIs
  const marginPercent =
    report && report.totals.totalSales > 0
      ? ((report.totals.totalMargin / report.totals.totalSales) * 100).toFixed(
          1,
        )
      : "0";

  const avgOrderValue =
    report && report.totals.orderCount > 0
      ? report.totals.totalSales / report.totals.orderCount
      : 0;

  const topCustomer = useMemo(() => {
    if (!report || report.byCustomer.length === 0) return null;
    return report.byCustomer.reduce(
      (max, c) => (c.totalSales > max.totalSales ? c : max),
      report.byCustomer[0],
    );
  }, [report]);

  const topSalesperson = useMemo(() => {
    if (!report || report.bySalesperson.length === 0) return null;
    return report.bySalesperson.reduce(
      (max, s) => (s.totalSales > max.totalSales ? s : max),
      report.bySalesperson[0],
    );
  }, [report]);

  // Filtered + sorted customer table rows
  const processedCustomerRows = useMemo(() => {
    if (!report) return [];
    let rows = report.byCustomer;
    const term = customerTableSearch.toLowerCase().trim();
    if (term) {
      rows = rows.filter(r => r.customerName.toLowerCase().includes(term));
    }
    const { field, dir } = customerSort;
    const sorted = [...rows].sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (field) {
        case "name":
          va = a.customerName.toLowerCase();
          vb = b.customerName.toLowerCase();
          break;
        case "sales":
          va = a.totalSales;
          vb = b.totalSales;
          break;
        case "margin":
          va = a.totalMargin;
          vb = b.totalMargin;
          break;
        case "marginPct":
          va = a.totalSales > 0 ? a.totalMargin / a.totalSales : 0;
          vb = b.totalSales > 0 ? b.totalMargin / b.totalSales : 0;
          break;
        case "orders":
          va = a.orderCount;
          vb = b.orderCount;
          break;
        case "share":
          va = a.totalSales;
          vb = b.totalSales;
          break;
        default:
          return 0;
      }
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [report, customerTableSearch, customerSort]);

  // Filtered + sorted salesperson table rows
  const processedSalespersonRows = useMemo(() => {
    if (!report) return [];
    let rows = report.bySalesperson;
    const term = salespersonTableSearch.toLowerCase().trim();
    if (term) {
      rows = rows.filter(r => r.salesperson.toLowerCase().includes(term));
    }
    const { field, dir } = salespersonSort;
    const sorted = [...rows].sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (field) {
        case "name":
          va = a.salesperson.toLowerCase();
          vb = b.salesperson.toLowerCase();
          break;
        case "sales":
          va = a.totalSales;
          vb = b.totalSales;
          break;
        case "margin":
          va = a.totalMargin;
          vb = b.totalMargin;
          break;
        case "marginPct":
          va = a.totalSales > 0 ? a.totalMargin / a.totalSales : 0;
          vb = b.totalSales > 0 ? b.totalMargin / b.totalSales : 0;
          break;
        case "orders":
          va = a.orderCount;
          vb = b.orderCount;
          break;
        case "share":
          va = a.totalSales;
          vb = b.totalSales;
          break;
        default:
          return 0;
      }
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [report, salespersonTableSearch, salespersonSort]);

  // Totals for filtered rows
  const customerTableTotals = useMemo(() => {
    return processedCustomerRows.reduce(
      (acc, r) => ({
        sales: acc.sales + r.totalSales,
        margin: acc.margin + r.totalMargin,
        orders: acc.orders + r.orderCount,
      }),
      { sales: 0, margin: 0, orders: 0 },
    );
  }, [processedCustomerRows]);

  const salespersonTableTotals = useMemo(() => {
    return processedSalespersonRows.reduce(
      (acc, r) => ({
        sales: acc.sales + r.totalSales,
        margin: acc.margin + r.totalMargin,
        orders: acc.orders + r.orderCount,
      }),
      { sales: 0, margin: 0, orders: 0 },
    );
  }, [processedSalespersonRows]);

  // Max sales for visual bar scaling
  const maxCustomerSales = useMemo(() => {
    if (!report || report.byCustomer.length === 0) return 1;
    return Math.max(...report.byCustomer.map(r => r.totalSales));
  }, [report]);

  const maxSalespersonSales = useMemo(() => {
    if (!report || report.bySalesperson.length === 0) return 1;
    return Math.max(...report.bySalesperson.map(r => r.totalSales));
  }, [report]);

  const toggleSort = (table: "customer" | "salesperson", field: SortField) => {
    const setter = table === "customer" ? setCustomerSort : setSalespersonSort;
    setter(prev => ({
      field,
      dir: prev.field === field && prev.dir === "desc" ? "asc" : "desc",
    }));
  };

  const exportCsv = (table: "customer" | "salesperson") => {
    if (!report) return;
    const rows =
      table === "customer" ? processedCustomerRows : processedSalespersonRows;
    const nameHeader =
      table === "customer"
        ? t("salesReports.customer")
        : t("salesReports.salesperson");
    const headers = [
      nameHeader,
      t("salesReports.sales"),
      t("salesReports.margin"),
      t("salesReports.marginPercent"),
      t("salesReports.orders"),
      t("salesReports.shareOfTotal"),
    ];

    const totalSales =
      table === "customer"
        ? customerTableTotals.sales
        : salespersonTableTotals.sales;
    const csvRows = rows.map(r => {
      const name =
        table === "customer"
          ? (r as (typeof report.byCustomer)[0]).customerName
          : (r as (typeof report.bySalesperson)[0]).salesperson;
      const pct =
        r.totalSales > 0
          ? ((r.totalMargin / r.totalSales) * 100).toFixed(1)
          : "0";
      const share =
        totalSales > 0 ? ((r.totalSales / totalSales) * 100).toFixed(1) : "0";
      return [
        `"${name.replace(/"/g, '""')}"`,
        r.totalSales.toFixed(2),
        r.totalMargin.toFixed(2),
        pct,
        r.orderCount.toString(),
        share,
      ].join(",");
    });

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_by_${table}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    datePreset !== "all" ||
    selectedCustomer !== "all" ||
    selectedSalesperson !== "all";

  const SortIcon = ({
    table,
    field,
  }: {
    table: "customer" | "salesperson";
    field: SortField;
  }) => {
    const sort = table === "customer" ? customerSort : salespersonSort;
    if (sort.field !== field)
      return <ArrowUpDown size={12} className="ml-1 inline opacity-40" />;
    return sort.dir === "desc" ? (
      <ArrowDown size={12} className="ml-1 inline text-primary" />
    ) : (
      <ArrowUp size={12} className="ml-1 inline text-primary" />
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">
            {t("salesReports.title")}
          </h1>
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <X size={14} className="mr-2" />
            {t("salesReports.clear")}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">
            {t("salesReports.filterByDate")}
          </Label>
          <Select
            value={datePreset}
            onValueChange={v => handlePresetChange(v as DatePreset)}
          >
            <SelectTrigger className="w-[180px]">
              <CalendarIcon size={14} className="mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {t(p.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Searchable customer filter dropdown */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">
            {t("salesReports.filterByCustomer")}
          </Label>
          <Popover
            open={customerDropdownOpen}
            onOpenChange={setCustomerDropdownOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={customerDropdownOpen}
                className="w-[220px] justify-between font-normal"
              >
                <span className="truncate">{selectedCustomerName}</span>
                <ChevronsUpDown
                  size={14}
                  className="ml-2 shrink-0 opacity-50"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                  placeholder={t("salesReports.filterByCustomer")}
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[260px] overflow-y-auto p-1">
                <button
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    selectedCustomer === "all" && "bg-accent",
                  )}
                  onClick={() => {
                    setSelectedCustomer("all");
                    setCustomerSearch("");
                    setCustomerDropdownOpen(false);
                  }}
                >
                  <Check
                    size={14}
                    className={cn(
                      "mr-2 shrink-0",
                      selectedCustomer === "all" ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {t("salesReports.allCustomers")}
                </button>
                {sortedCustomerDropdown.map(c => (
                  <button
                    key={c.id}
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      selectedCustomer === c.id && "bg-accent",
                    )}
                    onClick={() => {
                      setSelectedCustomer(c.id);
                      setCustomerSearch("");
                      setCustomerDropdownOpen(false);
                    }}
                  >
                    <Check
                      size={14}
                      className={cn(
                        "mr-2 shrink-0",
                        selectedCustomer === c.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <HighlightText
                      text={c.companyName}
                      highlight={customerSearch}
                    />
                  </button>
                ))}
                {sortedCustomerDropdown.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {t("salesReports.noResults")}
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Searchable salesperson filter dropdown */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">
            {t("salesReports.filterBySalesperson")}
          </Label>
          <Popover
            open={salespersonDropdownOpen}
            onOpenChange={setSalespersonDropdownOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={salespersonDropdownOpen}
                className="w-[220px] justify-between font-normal"
              >
                <span className="truncate">{selectedSalespersonName}</span>
                <ChevronsUpDown
                  size={14}
                  className="ml-2 shrink-0 opacity-50"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                  placeholder={t("salesReports.filterBySalesperson")}
                  value={salespersonSearch}
                  onChange={e => setSalespersonSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[260px] overflow-y-auto p-1">
                <button
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    selectedSalesperson === "all" && "bg-accent",
                  )}
                  onClick={() => {
                    setSelectedSalesperson("all");
                    setSalespersonSearch("");
                    setSalespersonDropdownOpen(false);
                  }}
                >
                  <Check
                    size={14}
                    className={cn(
                      "mr-2 shrink-0",
                      selectedSalesperson === "all"
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {t("salesReports.allSalespersons")}
                </button>
                {sortedSalespersonDropdown.map(sp => (
                  <button
                    key={sp}
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      selectedSalesperson === sp && "bg-accent",
                    )}
                    onClick={() => {
                      setSelectedSalesperson(sp);
                      setSalespersonSearch("");
                      setSalespersonDropdownOpen(false);
                    }}
                  >
                    <Check
                      size={14}
                      className={cn(
                        "mr-2 shrink-0",
                        selectedSalesperson === sp
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <HighlightText text={sp} highlight={salespersonSearch} />
                  </button>
                ))}
                {sortedSalespersonDropdown.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {t("salesReports.noResults")}
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Custom date range picker */}
      {datePreset === "custom" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-6 p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">
              {t("salesReports.from")}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] justify-start text-left font-normal"
                >
                  <CalendarIcon
                    size={14}
                    className="mr-2 text-muted-foreground"
                  />
                  {customFrom
                    ? format(customFrom, "dd/MM/yyyy")
                    : t("salesReports.pickDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  disabled={date => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">
              {t("salesReports.to")}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] justify-start text-left font-normal"
                >
                  <CalendarIcon
                    size={14}
                    className="mr-2 text-muted-foreground"
                  />
                  {customTo
                    ? format(customTo, "dd/MM/yyyy")
                    : t("salesReports.pickDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  disabled={date =>
                    date > new Date() ||
                    (customFrom ? date < customFrom : false)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            size="sm"
            onClick={handleApplyCustomRange}
            disabled={!customFrom && !customTo}
          >
            {t("salesReports.apply")}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            {t("salesReports.loading")}
          </span>
        </div>
      ) : !report ? (
        <p className="text-center text-muted-foreground py-12">
          {t("salesReports.noData")}
        </p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Euro}
              label={t("salesReports.totalSales")}
              value={`€${report.totals.totalSales.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              color="bg-primary/10 text-primary"
            />
            <StatCard
              icon={TrendingUp}
              label={t("salesReports.totalMargin")}
              value={`€${report.totals.totalMargin.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              color="bg-green-500/10 text-green-600"
            />
            <StatCard
              icon={ShoppingCart}
              label={t("salesReports.totalOrders")}
              value={report.totals.orderCount.toString()}
              color="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              icon={Calculator}
              label={t("salesReports.avgOrderValue")}
              value={`€${avgOrderValue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              color="bg-purple-500/10 text-purple-600"
            />
          </div>

          {/* Customers */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <h2 className="text-lg font-semibold">
              {t("salesReports.customers")}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => exportCsv("customer")}
              >
                <Download size={14} className="mr-1.5" />
                {t("salesReports.exportCsv")}
              </Button>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="border-b border-border bg-muted/100">
                    <th
                      className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort("customer", "name")}
                    >
                      {t("salesReports.customer")}
                      <SortIcon table="customer" field="name" />
                    </th>
                    <th
                      className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort("customer", "sales")}
                    >
                      {t("salesReports.sales")}
                      <SortIcon table="customer" field="sales" />
                    </th>
                    <th
                      className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort("customer", "margin")}
                    >
                      {t("salesReports.margin")}
                      <SortIcon table="customer" field="margin" />
                    </th>
                    <th
                      className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort("customer", "marginPct")}
                    >
                      {t("salesReports.marginPercent")}
                      <SortIcon table="customer" field="marginPct" />
                    </th>
                    <th
                      className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort("customer", "orders")}
                    >
                      {t("salesReports.orders")}
                      <SortIcon table="customer" field="orders" />
                    </th>
                    <th
                      className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground w-[180px]"
                      onClick={() => toggleSort("customer", "share")}
                    >
                      {t("salesReports.shareOfTotal")}
                      <SortIcon table="customer" field="share" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {processedCustomerRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        {t("salesReports.noData")}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {processedCustomerRows.map(row => {
                        const pct =
                          row.totalSales > 0
                            ? (
                                (row.totalMargin / row.totalSales) *
                                100
                              ).toFixed(1)
                            : "0";
                        const share =
                          customerTableTotals.sales > 0
                            ? (row.totalSales / customerTableTotals.sales) * 100
                            : 0;
                        const barWidth =
                          maxCustomerSales > 0
                            ? (row.totalSales / maxCustomerSales) * 100
                            : 0;
                        return (
                          <tr
                            key={row.customerId}
                            className="bg-white hover:bg-accent/50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium">
                              {row.customerName}
                            </td>
                            <td className="px-4 py-3 text-right">
                              €
                              {row.totalSales.toLocaleString("de-DE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              €
                              {row.totalMargin.toLocaleString("de-DE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 py-3 text-right">{pct}%</td>
                            <td className="px-4 py-3 text-right">
                              {row.orderCount}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-muted-foreground w-[40px] text-right">
                                  {share.toFixed(1).replace(".", ",")}%
                                </span>
                                <div className="w-[80px] h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary/60 rounded-full transition-all"
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Totals row */}
                      <tr className="bg-muted/100 font-semibold border-t-2 border-border">
                        <td className="px-4 py-3">{t("salesReports.total")}</td>
                        <td className="px-4 py-3 text-right">
                          €
                          {customerTableTotals.sales.toLocaleString("de-DE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          €
                          {customerTableTotals.margin.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {customerTableTotals.sales > 0
                            ? (
                                (customerTableTotals.margin /
                                  customerTableTotals.sales) *
                                100
                              ).toFixed(1)
                            : "0"}
                          %
                        </td>
                        <td className="px-4 py-3 text-right">
                          {customerTableTotals.orders}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          100%
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold mt-1 truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg shrink-0 ${color}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function HighlightText({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) {
  if (!highlight.trim()) return <span>{text}</span>;
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="font-bold text-primary">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}
