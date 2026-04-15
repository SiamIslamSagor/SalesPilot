import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  Loader2,
  ShoppingCart,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableHeader } from "@/components/SortableHeader";
import Pagination from "@/components/Pagination";
import { useLanguage } from "@/i18n/LanguageContext";
import apiService, { type OfferStatus } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { parseEuroNumber } from "@/lib/utils";

interface OfferItem {
  productId: string;
  productNumber: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  markingCost: number;
  showUnitPrice: boolean;
  showTotalPrice: boolean;
  hideMarkingCost: boolean;
  generateMockup: boolean;
}

interface Offer {
  _id: string;
  offerNumber: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  items: OfferItem[];
  offerDetails: {
    validUntil?: string;
    validDays?: string;
    showTotalPrice: boolean;
    additionalTermsEnabled: boolean;
    additionalTerms?: string;
  };
  totalAmount: number;
  itemCount: number;
  status: OfferStatus;
  version?: number;
  customerResponse?: "pending" | "accepted" | "rejected";
  customerComments?: Array<{ comment?: string; timestamp: string }>;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const OFFER_STATUS_OPTIONS: OfferStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "completed",
];

/** Valid one-way status transitions – no going back */
const ALLOWED_OFFER_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  draft: ["sent"],
  sent: ["accepted", "rejected", "expired"],
  accepted: [],
  rejected: [],
  expired: [],
  completed: [],
};

const statusOptions = ["all", ...OFFER_STATUS_OPTIONS] as const;

type SortKey =
  | "offerNumber"
  | "customer"
  | "items"
  | "status"
  | "customerResponse"
  | "validUntil"
  | "totalAmount"
  | "createdAt";
type SortDir = "asc" | "desc" | null;

export default function Quotes() {
  const { t } = useLanguage();
  const { isPrivilegedUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all",
  );
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [statusUpdatingOfferId, setStatusUpdatingOfferId] = useState<
    string | null
  >(null);
  // Advanced filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [customerResponseFilter, setCustomerResponseFilter] =
    useState<string>("all");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [contactPersonSearch, setContactPersonSearch] = useState("");
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);
  const navigate = useNavigate();

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString();
  };

  const getStatusBadgeClass = (status: OfferStatus) => {
    switch (status) {
      case "accepted":
        return "bg-success/10 text-success";
      case "rejected":
        return "bg-destructive/10 text-destructive";
      case "expired":
        return "bg-destructive/10 text-destructive";
      case "completed":
        return "bg-primary/10 text-primary";
      case "sent":
        return "status-sent";
      case "draft":
      default:
        return "status-draft";
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch offers from API
  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiService.getOffers({
          page,
          limit: 10,
          status: statusFilter === "all" ? undefined : statusFilter,
          search: debouncedSearch || undefined,
        });
        if (result.success && result.data) {
          setOffers(result.data);
          if (result.pagination) {
            setTotalPages(result.pagination.pages);
          }
        } else {
          setError(result.message || "Failed to fetch offers");
        }
      } catch (err) {
        console.error("Error fetching offers:", err);
        setError("Failed to fetch offers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    customerResponseFilter,
    amountMin,
    amountMax,
    dateFrom,
    dateTo,
    contactPersonSearch,
  ]);

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

  const filtered = useMemo(() => {
    let data = offers.filter(q => {
      const matchCustomerResponse =
        customerResponseFilter === "all" ||
        (customerResponseFilter === "none"
          ? !q.customerResponse
          : q.customerResponse === customerResponseFilter);
      const matchAmountMin =
        !amountMin || q.totalAmount >= parseEuroNumber(amountMin);
      const matchAmountMax =
        !amountMax || q.totalAmount <= parseEuroNumber(amountMax);
      const matchDateFrom =
        !dateFrom || new Date(q.createdAt) >= new Date(dateFrom);
      const matchDateTo =
        !dateTo || new Date(q.createdAt) <= new Date(dateTo + "T23:59:59");
      const matchContactPerson =
        !contactPersonSearch ||
        q.contactPerson
          ?.toLowerCase()
          .includes(contactPersonSearch.toLowerCase());
      return (
        matchCustomerResponse &&
        matchAmountMin &&
        matchAmountMax &&
        matchDateFrom &&
        matchDateTo &&
        matchContactPerson
      );
    });

    if (sortKey && sortDir) {
      data = [...data].sort((a, b) => {
        let av: string | number | Date, bv: string | number | Date;
        if (sortKey === "customer") {
          av = a.customerName;
          bv = b.customerName;
        } else if (sortKey === "items") {
          av = a.itemCount;
          bv = b.itemCount;
        } else if (sortKey === "status") {
          av = a.status;
          bv = b.status;
        } else if (sortKey === "customerResponse") {
          // Define response order for sorting
          const responseOrder = { pending: 0, accepted: 1, rejected: 2 };
          av =
            responseOrder[a.customerResponse as keyof typeof responseOrder] ??
            3;
          bv =
            responseOrder[b.customerResponse as keyof typeof responseOrder] ??
            3;
        } else if (sortKey === "totalAmount") {
          av = a.totalAmount;
          bv = b.totalAmount;
        } else if (sortKey === "createdAt") {
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
        } else {
          av = a.offerNumber;
          bv = b.offerNumber;
        }
        const cmp =
          typeof av === "string" && typeof bv === "string"
            ? av.localeCompare(bv)
            : Number(av) - Number(bv);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [
    offers,
    sortKey,
    sortDir,
    customerResponseFilter,
    amountMin,
    amountMax,
    dateFrom,
    dateTo,
    contactPersonSearch,
  ]);

  const hasActiveFilters =
    search ||
    statusFilter !== "all" ||
    customerResponseFilter !== "all" ||
    amountMin ||
    amountMax ||
    dateFrom ||
    dateTo ||
    contactPersonSearch;

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCustomerResponseFilter("all");
    setAmountMin("");
    setAmountMax("");
    setDateFrom("");
    setDateTo("");
    setContactPersonSearch("");
  };

  const handleDelete = async (id: string) => {
    if (deletingOfferId) return;
    if (window.confirm("Are you sure you want to delete this offer?")) {
      setDeletingOfferId(id);
      try {
        const result = await apiService.deleteOffer(id);
        if (result.success) {
          // Refresh offers list
          const updatedOffers = offers.filter(o => o._id !== id);
          setOffers(updatedOffers);
        } else {
          setError(result.message || "Failed to delete offer");
        }
      } catch (err) {
        console.error("Error deleting offer:", err);
        setError("Failed to delete offer. Please try again later.");
      } finally {
        setDeletingOfferId(null);
      }
    }
  };

  const handleDuplicate = (id: string) => {
    // when duplicating from the list we go to the dedicated duplicate page
    // which behaves like quote detail/edit but pre‑populates the form with
    // the source offer data. this skips customer/product selection steps.
    navigate(`/quotes/duplicate/${id}`);
  };

  const handleStatusChange = async (
    offerId: string,
    newStatus: OfferStatus,
  ) => {
    setStatusUpdatingOfferId(offerId);
    try {
      // Use sendOffer endpoint for draft→sent so the customer gets the email
      const currentOffer = offers.find(o => o._id === offerId);
      let result: { success: boolean; message?: string };
      if (currentOffer?.status === "draft" && newStatus === "sent") {
        result = await apiService.sendOffer(offerId);
      } else {
        result = await apiService.updateOfferStatus(offerId, newStatus);
      }
      if (result.success) {
        setOffers(prev =>
          prev.map(offer =>
            offer._id === offerId
              ? {
                  ...offer,
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                }
              : offer,
          ),
        );
        setError(null);
      } else {
        setError(result.message || "Failed to update offer status");
      }
    } catch (err) {
      console.error("Error updating offer status:", err);
      setError("Failed to update offer status. Please try again later.");
    } finally {
      setStatusUpdatingOfferId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">{t("offers.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading
              ? t("common.loading")
              : hasActiveFilters
                ? `${filtered.length} / ${offers.length} ${t("offers.title").toLowerCase()}`
                : `${offers.length} ${t("offers.title").toLowerCase()}`}
          </p>
        </div>
        {isPrivilegedUser && (
          <Link to="/quotes/new">
            <Button>
              <Plus size={16} className="mr-2" /> {t("offers.newOffer")}
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 w-full">
          <Search
            size={16}
            className="absolute left-3 top-[40%] -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={t("offers.searchOffersPlaceholder")}
            className="pl-9 w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(s => (
              <SelectItem key={s} value={s}>
                {s === "all"
                  ? t("offers.allStatuses")
                  : t(`offers.status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Advanced Filters */}
        <div className="flex max-sm:flex-col sm:items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={14} />
            {t("filters.advancedFilters")}
            {showAdvancedFilters ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground border-red-500 border"
            >
              <X size={14} />
              {t("filters.clearAll")}
            </Button>
          )}
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Response */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {t("offers.customerResponse")}
              </label>
              <Select
                value={customerResponseFilter}
                onValueChange={setCustomerResponseFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filters.allResponses")}
                  </SelectItem>
                  <SelectItem value="pending">{t("offers.pending")}</SelectItem>
                  <SelectItem value="accepted">
                    {t("offers.accepted")}
                  </SelectItem>
                  <SelectItem value="rejected">
                    {t("offers.rejected")}
                  </SelectItem>
                  <SelectItem value="none">
                    {t("filters.noResponse")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contact Person */}
            {/* <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {t("filters.contactPerson")}
              </label>
              <Input
                placeholder={t("filters.searchContactPerson")}
                value={contactPersonSearch}
                onChange={e => setContactPersonSearch(e.target.value)}
                className="w-full"
              />
            </div> */}

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

            {/* Created Date Range */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {t("filters.dateRange")}
              </label>
              <div className="flex max-sm:flex-col gap-2 items-center">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full"
                />
                <span className="text-muted-foreground text-sm shrink-0 max-sm:hidden">
                  —
                </span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
          <p className="text-destructive font-medium mb-2">
            {t("common.error")}
          </p>
          <p className="text-sm text-destructive/80">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              // Retry fetch
              const fetchOffers = async () => {
                setLoading(true);
                try {
                  const result = await apiService.getOffers({
                    page,
                    limit: 10,
                    status: statusFilter === "all" ? undefined : statusFilter,
                    search: debouncedSearch || undefined,
                  });
                  if (result.success && result.data) {
                    setOffers(result.data);
                    if (result.pagination) {
                      setTotalPages(result.pagination.pages);
                    }
                  } else {
                    setError(result.message || "Failed to fetch offers");
                  }
                } catch (err) {
                  console.error("Error fetching offers:", err);
                  setError("Failed to fetch offers. Please try again later.");
                } finally {
                  setLoading(false);
                }
              };
              fetchOffers();
            }}
          >
            {t("offers.retry")}
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              {t("common.loading")}
            </span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground mb-2">
            {t("offers.noOffersFound")}
          </p>
          {search && (
            <p className="text-sm text-muted-foreground">
              {t("offers.tryAdjustingSearch")}
            </p>
          )}
        </div>
      )}

      {/* Offers table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <SortableHeader
                    label={t("offers.offerNumber")}
                    sortKey="offerNumber"
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
                    label={t("common.items")}
                    sortKey="items"
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
                    label={t("offers.customerResponse")}
                    sortKey="customerResponse"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    label={t("offers.validUntil")}
                    sortKey="validUntil"
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
                    label={t("offers.created")}
                    sortKey="createdAt"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    label={t("offers.updated")}
                    sortKey="updatedAt"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(q => {
                  const firstItem = q.items?.[0]?.productName;
                  const moreItems =
                    q.items?.length > 1
                      ? ` +${q.items.length - 1} ${t("offers.moreItems")}`
                      : "";

                  const validDate = q.offerDetails?.validUntil
                    ? new Date(q.offerDetails.validUntil).toLocaleDateString()
                    : "-";

                  const validDays = q.offerDetails?.validDays
                    ? `${q.offerDetails.validDays} ${t("offers.days")}`
                    : "";

                  return (
                    <tr
                      key={q._id}
                      className="hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/quotes/${q._id}`)}
                    >
                      {/* Offer Number */}
                      <td className="px-2 py-3">
                        <Link
                          to={`/quotes/${q._id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {q.offerNumber}
                        </Link>
                        {/* <p className="text-xs text-muted-foreground">
                          v{q.version ?? 1}
                        </p> */}
                      </td>

                      {/* Customer */}
                      <td className="px-2 py-3">
                        <div className="font-medium">{q.customerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {q.contactPerson}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-2 py-3">
                        <div className="text-muted-foreground text-sm">
                          {q.itemCount} {t("common.items")}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {firstItem}
                          {moreItems}
                        </div>
                      </td>

                      {/* Status */}
                      <td
                        className="px-2 py-3"
                        onClick={e => e.stopPropagation()}
                      >
                        {isPrivilegedUser ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="w-full text-left"
                                disabled={statusUpdatingOfferId === q._id}
                              >
                                <span
                                  className={`status-badge ${getStatusBadgeClass(
                                    q.status,
                                  )} flex items-center justify-center gap-2 ${
                                    statusUpdatingOfferId === q._id
                                      ? "opacity-60"
                                      : ""
                                  }`}
                                >
                                  {statusUpdatingOfferId === q._id ? (
                                    <span className="flex items-center gap-1">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      {t(`offers.status.${q.status}`)}
                                    </span>
                                  ) : (
                                    t(`offers.status.${q.status}`)
                                  )}
                                </span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {ALLOWED_OFFER_TRANSITIONS[q.status].map(
                                option => (
                                  <DropdownMenuItem
                                    key={option}
                                    disabled={statusUpdatingOfferId === q._id}
                                    onClick={event => {
                                      event.stopPropagation();
                                      handleStatusChange(q._id, option);
                                    }}
                                  >
                                    {t(`offers.status.${option}`)}
                                  </DropdownMenuItem>
                                ),
                              )}
                              {q.status === "accepted" && (
                                <DropdownMenuItem
                                  onClick={event => {
                                    event.stopPropagation();
                                    navigate(`/orders/create/${q._id}`);
                                  }}
                                >
                                  <ShoppingCart size={14} className="mr-2" />
                                  {t("offers.createSalesOrder")}
                                </DropdownMenuItem>
                              )}
                              {ALLOWED_OFFER_TRANSITIONS[q.status].length ===
                                0 &&
                                q.status !== "accepted" && (
                                  <DropdownMenuItem disabled>
                                    {t(`offers.status.${q.status}`)}
                                  </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span
                            className={`status-badge ${getStatusBadgeClass(
                              q.status,
                            )} flex items-center justify-center`}
                          >
                            {t(`offers.status.${q.status}`)}
                          </span>
                        )}
                      </td>

                      {/* Customer Response */}
                      <td className="px-2 py-3">
                        {q.customerResponse ? (
                          <span
                            className={`font-medium ${
                              q.customerResponse === "accepted"
                                ? "text-green-600"
                                : q.customerResponse === "rejected"
                                  ? "text-destructive"
                                  : "text-amber-600"
                            }`}
                          >
                            {q.customerResponse === "accepted"
                              ? t("offers.accepted")
                              : q.customerResponse === "rejected"
                                ? t("offers.rejected")
                                : t("offers.pending")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Valid Until */}
                      <td className="px-2 py-3 text-muted-foreground">
                        {validDate !== "-" ? (
                          <>
                            <div>{validDate}</div>
                            <div className="text-xs">{validDays}</div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-2 py-3 text-center font-medium">
                        €
                        {q.totalAmount.toLocaleString("de-DE", {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      {/* Created */}
                      <td className="px-2 py-3 text-muted-foreground">
                        {q.createdAt ? (
                          <>
                            <div>
                              {new Date(q.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs">
                              {new Date(q.createdAt).toLocaleTimeString()}
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Updated */}
                      <td className="px-2 py-3 text-muted-foreground">
                        {q.updatedAt ? (
                          <>
                            <div>
                              {new Date(q.updatedAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs">
                              {new Date(q.updatedAt).toLocaleTimeString()}
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="px-2 py-3"
                        onClick={e => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            {isPrivilegedUser &&
                              q.customerResponse === "accepted" && (
                                <DropdownMenuItem
                                  disabled={
                                    q.status === "completed" ||
                                    q.status === "expired"
                                  }
                                  onClick={() =>
                                    navigate(`/orders/create/${q._id}`)
                                  }
                                >
                                  <ShoppingCart size={14} className="mr-2" />{" "}
                                  {t("offers.createSalesOrder")}
                                </DropdownMenuItem>
                              )}

                            <DropdownMenuItem
                              onClick={() => navigate(`/quotes/${q._id}`)}
                            >
                              <Eye size={14} className="mr-2" />{" "}
                              {t("common.view")}
                            </DropdownMenuItem>

                            {isPrivilegedUser && (
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/quotes/duplicate/${q._id}`)
                                }
                              >
                                <Copy size={14} className="mr-2" />{" "}
                                {t("common.duplicate")}
                              </DropdownMenuItem>
                            )}

                            {isPrivilegedUser && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(q._id)}
                                className="text-destructive"
                                disabled={deletingOfferId === q._id}
                              >
                                {deletingOfferId === q._id ? (
                                  <Loader2 size={14} className="mr-2 animate-spin" />
                                ) : (
                                  <Trash2 size={14} className="mr-2" />
                                )}
                                {t("common.delete")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-3">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
