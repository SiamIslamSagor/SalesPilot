import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Search,
  Plus,
  Building2,
  MoreHorizontal,
  Eye,
  FileText,
  Trash2,
  Loader2,
  CalendarIcon,
  X,
  Upload,
  ImageIcon,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableHeader } from "@/components/SortableHeader";
import Pagination from "@/components/Pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n/LanguageContext";
import { TranslationKey } from "@/i18n/translations";
import api, { Customer } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

type SortKey =
  | "companyName"
  | "contactPerson"
  | "businessId"
  | "totalSales"
  | "createdAt";
type SortDir = "asc" | "desc" | null;

type DatePreset =
  | "all"
  | "1m"
  | "2m"
  | "3m"
  | "4m"
  | "5m"
  | "6m"
  | "9m"
  | "12m"
  | "1y"
  | "2y"
  | "3y"
  | "custom";

const DATE_PRESETS: { value: DatePreset; labelKey: TranslationKey }[] = [
  { value: "all", labelKey: "customers.allTime" },
  { value: "1m", labelKey: "customers.last1Month" },
  { value: "2m", labelKey: "customers.last2Months" },
  { value: "3m", labelKey: "customers.last3Months" },
  { value: "4m", labelKey: "customers.last4Months" },
  { value: "5m", labelKey: "customers.last5Months" },
  { value: "6m", labelKey: "customers.last6Months" },
  { value: "9m", labelKey: "customers.last9Months" },
  { value: "12m", labelKey: "customers.last12Months" },
  { value: "1y", labelKey: "customers.last1Year" },
  { value: "2y", labelKey: "customers.last2Years" },
  { value: "3y", labelKey: "customers.last3Years" },
  { value: "custom", labelKey: "customers.customRange" },
];

function getDateFromPreset(preset: DatePreset): { from?: string; to?: string } {
  if (preset === "all" || preset === "custom") return {};
  const now = new Date();
  const from = new Date(now);
  const monthsMap: Record<string, number> = {
    "1m": 1,
    "2m": 2,
    "3m": 3,
    "4m": 4,
    "5m": 5,
    "6m": 6,
    "9m": 9,
    "12m": 12,
    "1y": 12,
    "2y": 24,
    "3y": 36,
  };
  from.setMonth(from.getMonth() - monthsMap[preset]);
  return { from: from.toISOString(), to: now.toISOString() };
}

export default function Customers() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    businessId: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postcode: "",
    country: "Finland",
  });
  const [businessIdError, setBusinessIdError] = useState<string>("");
  const [createFieldErrors, setCreateFieldErrors] = useState<
    Record<string, string>
  >({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>();
  const [appliedTo, setAppliedTo] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch customers on mount and when page, search, or date filter changes
  useEffect(() => {
    fetchCustomers(page, debouncedSearch, appliedFrom, appliedTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, appliedFrom, appliedTo]);

  const handlePresetChange = useCallback((preset: DatePreset) => {
    setDatePreset(preset);
    setPage(1);
    if (preset === "custom") return;
    if (preset === "all") {
      setCustomFrom(undefined);
      setCustomTo(undefined);
      setAppliedFrom(undefined);
      setAppliedTo(undefined);
      return;
    }
    const range = getDateFromPreset(preset);
    setCustomFrom(range.from ? new Date(range.from) : undefined);
    setCustomTo(range.to ? new Date(range.to) : undefined);
    setAppliedFrom(range.from);
    setAppliedTo(range.to);
  }, []);

  const handleApplyCustomRange = useCallback(() => {
    setPage(1);
    setAppliedFrom(customFrom ? customFrom.toISOString() : undefined);
    setAppliedTo(
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

  const handleClearFilter = useCallback(() => {
    setDatePreset("all");
    setCustomFrom(undefined);
    setCustomTo(undefined);
    setAppliedFrom(undefined);
    setAppliedTo(undefined);
    setPage(1);
  }, []);

  const handleLogoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please select an image file (PNG, JPG, SVG, etc.)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Logo image must be under 2MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setLogoBase64(result);
      };
      reader.readAsDataURL(file);
    },
    [toast],
  );

  const handleRemoveLogo = useCallback(() => {
    setLogoPreview(null);
    setLogoBase64("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const fetchCustomers = async (
    currentPage: number = 1,
    searchTerm: string = "",
    createdAtFrom?: string,
    createdAtTo?: string,
  ) => {
    try {
      setLoading(true);
      const response = await api.fetchCustomers({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        createdAtFrom: createdAtFrom || undefined,
        createdAtTo: createdAtTo || undefined,
      });

      if (response.success && response.data) {
        setCustomers(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setTotal(response.pagination?.total || 0);
      } else {
        // If no customers exist, try to seed demo customers
        const seedResponse = await api.seedCustomers();
        if (seedResponse.success && seedResponse.data) {
          setCustomers(seedResponse.data);
          setTotalPages(1);
          setTotal(seedResponse.data.length);
          toast({
            title: "Success",
            description: "Demo customers have been created",
          });
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to fetch customers",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
    let data = [...customers];
    if (sortKey && sortDir) {
      data = [...data].sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const av = a[sortKey] as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bv = b[sortKey] as any;
        const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [customers, sortKey, sortDir]);

  const handleCreate = async () => {
    // Validate required fields
    const errors: Record<string, string> = {};
    if (!form.companyName.trim())
      errors.companyName = t("validation.companyNameRequired");
    if (!form.contactPerson.trim())
      errors.contactPerson = t("validation.contactPersonRequired");
    if (!form.phone.trim()) errors.phone = t("validation.phoneRequired");
    if (!form.email.trim()) errors.email = t("validation.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errors.email = t("validation.emailInvalid");
    if (!form.address.trim()) errors.address = t("validation.addressRequired");
    if (!form.city.trim()) errors.city = t("validation.cityRequired");
    if (!form.postcode.trim())
      errors.postcode = t("validation.postcodeRequired");
    if (Object.keys(errors).length > 0) {
      setCreateFieldErrors(errors);
      return;
    }
    setCreateFieldErrors({});

    // Validate business ID if provided
    if (form.businessId.trim()) {
      const { FinnishBusinessIds } = await import("finnish-business-ids");
      if (!FinnishBusinessIds.isValidBusinessId(form.businessId.trim())) {
        setBusinessIdError(
          "Invalid Finnish Business ID (Y-tunnus). Format: XXXXXXX-X",
        );
        return;
      }
    }
    setBusinessIdError("");

    try {
      setCreating(true);
      const response = await api.createCustomer({
        ...form,
        businessId: form.businessId.trim() || undefined,
        country: form.country.trim() || undefined,
        companyLogo: logoBase64 || undefined,
        totalSales: 0,
        totalMargin: 0,
        discountPercent: 0,
      });

      if (response.success && response.data) {
        setForm({
          companyName: "",
          businessId: "",
          contactPerson: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          postcode: "",
          country: "Finland",
        });
        setBusinessIdError("");
        setCreateFieldErrors({});
        setLogoPreview(null);
        setLogoBase64("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setDialogOpen(false);
        toast({
          title: "Success",
          description: "Customer created successfully",
        });
        // Refresh customer list
        fetchCustomers(page, search, appliedFrom, appliedTo);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create customer",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingCustomerId) return;
    setDeletingCustomerId(id);
    try {
      const response = await api.deleteCustomer(id);

      if (response.success) {
        toast({
          title: "Success",
          description: "Customer deleted successfully",
        });
        // Refresh customer list
        fetchCustomers(page, search, appliedFrom, appliedTo);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete customer",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setDeletingCustomerId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">
            {t("customers.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} {t("customers.title").toLowerCase()}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" /> {t("customers.newCustomer")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("customers.createCustomer")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Company Logo Upload */}
              <div>
                <Label className="text-xs">
                  {t("customers.companyLogo") || "Company Logo"}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({t("common.optional") || "Optional"})
                  </span>
                </Label>
                <div className="mt-1 flex items-center gap-3">
                  {logoPreview ? (
                    <div className="relative w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon size={20} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={14} className="mr-2" />
                      {logoPreview
                        ? t("customers.changeLogo") || "Change"
                        : t("customers.uploadLogo") || "Upload Logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG or SVG. Max 2MB.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>
              </div>

              {/* 2-column form grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">
                    {t("customers.companyName")} *
                  </Label>
                  <Input
                    value={form.companyName}
                    onChange={e => {
                      setForm({ ...form, companyName: e.target.value });
                      if (createFieldErrors.companyName)
                        setCreateFieldErrors(prev => {
                          const { companyName, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="Acme Oy"
                    className={`mt-1 ${createFieldErrors.companyName ? "border-destructive" : ""}`}
                  />
                  {createFieldErrors.companyName && (
                    <p className="text-xs text-destructive mt-1">
                      {createFieldErrors.companyName}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">
                    {t("customers.businessId")}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({t("common.optional") || "Optional"})
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex align-middle ml-1"
                          >
                            <Info
                              size={13}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px]">
                          <p className="text-xs">
                            {t("customers.businessIdHint")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    value={form.businessId}
                    onChange={e => {
                      setForm({ ...form, businessId: e.target.value });
                      if (businessIdError) setBusinessIdError("");
                    }}
                    placeholder="1234567-8"
                    className={`mt-1 ${businessIdError ? "border-destructive" : ""}`}
                  />
                  {businessIdError && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {businessIdError}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">
                    {t("customers.contactPerson")} *
                  </Label>
                  <Input
                    value={form.contactPerson}
                    onChange={e => {
                      setForm({ ...form, contactPerson: e.target.value });
                      if (createFieldErrors.contactPerson)
                        setCreateFieldErrors(prev => {
                          const { contactPerson, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="Matti Meikäläinen"
                    className={`mt-1 ${createFieldErrors.contactPerson ? "border-destructive" : ""}`}
                  />
                  {createFieldErrors.contactPerson && (
                    <p className="text-xs text-destructive mt-1">
                      {createFieldErrors.contactPerson}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">
                    {t("customers.phone") || "Phone"} *
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={e => {
                      setForm({ ...form, phone: e.target.value });
                      if (createFieldErrors.phone)
                        setCreateFieldErrors(prev => {
                          const { phone, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="+358 40 1234567"
                    className={`mt-1 ${createFieldErrors.phone ? "border-destructive" : ""}`}
                  />
                  {createFieldErrors.phone && (
                    <p className="text-xs text-destructive mt-1">
                      {createFieldErrors.phone}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">
                    {t("customers.email") || "Email"} *
                  </Label>
                  <Input
                    value={form.email}
                    onChange={e => {
                      setForm({ ...form, email: e.target.value });
                      if (createFieldErrors.email)
                        setCreateFieldErrors(prev => {
                          const { email, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="matti@acme.fi"
                    className={`mt-1 ${createFieldErrors.email ? "border-destructive" : ""}`}
                  />
                  {createFieldErrors.email && (
                    <p className="text-xs text-destructive mt-1">
                      {createFieldErrors.email}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">
                    {t("customers.address") || "Address"} *
                  </Label>
                  <Input
                    value={form.address}
                    onChange={e => {
                      setForm({ ...form, address: e.target.value });
                      if (createFieldErrors.address)
                        setCreateFieldErrors(prev => {
                          const { address, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="Mannerheimintie 1"
                    className={`mt-1 ${createFieldErrors.address ? "border-destructive" : ""}`}
                  />
                  {createFieldErrors.address && (
                    <p className="text-xs text-destructive mt-1">
                      {createFieldErrors.address}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">{t("customers.city")} *</Label>
                  <Input
                    value={form.city}
                    onChange={e => {
                      setForm({ ...form, city: e.target.value });
                      if (createFieldErrors.city)
                        setCreateFieldErrors(prev => {
                          const { city, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="Helsinki"
                    className={`mt-1 ${createFieldErrors.city ? "border-destructive" : ""}`}
                  />
                  {createFieldErrors.city && (
                    <p className="text-xs text-destructive mt-1">
                      {createFieldErrors.city}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">{t("customers.postcode")} *</Label>
                  <Input
                    value={form.postcode}
                    onChange={e => {
                      setForm({ ...form, postcode: e.target.value });
                      if (createFieldErrors.postcode)
                        setCreateFieldErrors(prev => {
                          const { postcode, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="00100"
                    className={`mt-1 ${createFieldErrors.postcode ? "border-destructive" : ""}`}
                  />
                  {createFieldErrors.postcode && (
                    <p className="text-xs text-destructive mt-1">
                      {createFieldErrors.postcode}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">
                    {t("customers.country") || "Country"}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({t("common.optional") || "Optional"})
                    </span>
                  </Label>
                  <Input
                    value={form.country}
                    onChange={e =>
                      setForm({ ...form, country: e.target.value })
                    }
                    placeholder="Finland"
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                className="w-full mt-2"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating && (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                )}
                {t("customers.createCustomer")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={t("customers.searchByName")}
            className="pl-9"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={datePreset}
            onValueChange={v => handlePresetChange(v as DatePreset)}
          >
            <SelectTrigger className="w-[180px]">
              <CalendarIcon size={14} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder={t("customers.filterByDate")} />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {t(p.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {appliedFrom && datePreset !== "all" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleClearFilter}
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>

      {datePreset === "custom" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-4 p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">
              {t("customers.from")}
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
                    : t("customers.pickDate")}
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
              {t("customers.to")}
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
                    : t("customers.pickDate")}
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

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApplyCustomRange}
              disabled={!customFrom && !customTo}
            >
              {t("customers.applyFilter")}
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearFilter}>
              {t("customers.clearFilter")}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <SortableHeader
                    label={t("customers.company")}
                    sortKey="companyName"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  {/* <SortableHeader
                  label={t("customers.contact")}
                  sortKey="contactPerson"
                  currentKey={sortKey}
                  direction={sortDir}
                  onClick={handleSort}
                  className="hidden md:table-cell"
                /> */}
                  <SortableHeader
                    label={t("customers.businessId")}
                    sortKey="businessId"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    label={t("customers.city")}
                    sortKey="contactPerson"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  <SortableHeader
                    label={t("customers.postcode")}
                    sortKey="contactPerson"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t("customers.country") || "Country"}
                  </th>
                  <SortableHeader
                    label={t("customers.joinDate")}
                    sortKey="createdAt"
                    currentKey={sortKey}
                    direction={sortDir}
                    onClick={handleSort}
                  />
                  {/* <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  {t("customers.city")}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  {t("customers.postcode")}
                </th> */}
                  {/* <SortableHeader
                  label={t("customers.type")}
                  sortKey="type"
                  currentKey={sortKey}
                  direction={sortDir}
                  onClick={handleSort}
                /> */}
                  {/* <SortableHeader
                  label={t("customers.sales")}
                  sortKey="totalSales"
                  currentKey={sortKey}
                  direction={sortDir}
                  onClick={handleSort}
                  className="text-right"
                /> */}
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(c => (
                  <tr
                    key={c.id}
                    className="hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {c.companyLogo ? (
                          <div className="w-8 h-8 rounded-md border border-border overflow-hidden bg-muted shrink-0">
                            <img
                              src={c.companyLogo}
                              alt={c.companyName}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Building2 size={14} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{c.companyName}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {c.contactPerson}
                  </td> */}
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {c.businessId}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.city || "Not Provided"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.postcode || "Not Provided"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.country || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString()
                        : "Not Provided"}
                    </td>
                    {/* customer type row */}
                    {/*  <td className="px-4 py-3">
                    <CustomerTypeDropdown
                      currentType={c.type as CustomerType}
                      customerId={c.id}
                      onTypeChange={handleTypeChange}
                    />
                  </td> */}
                    {/* <td className="px-4 py-3 text-right font-medium">
                    €{c.totalSales.toLocaleString("de-DE")}
                  </td> */}
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={event => event.stopPropagation()}
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={event => event.stopPropagation()}
                        >
                          {/* <DropdownMenuItem
                          onClick={() => navigate(`/customers/${c.id}`)}
                        >
                          <Eye size={14} className="mr-2" />{" "}
                          {t("customers.viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/quotes/new?customer=${c.id}`)
                          }
                        >
                          <FileText size={14} className="mr-2" />{" "}
                          {t("offers.newOfferFromCustomer")}
                        </DropdownMenuItem> */}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={event => {
                              event.stopPropagation();
                              handleDelete(c.id);
                            }}
                            disabled={deletingCustomerId === c.id}
                          >
                            {deletingCustomerId === c.id ? (
                              <Loader2 size={14} className="mr-2 animate-spin" />
                            ) : (
                              <Trash2 size={14} className="mr-2" />
                            )}
                            {t("common.delete")}
                          </DropdownMenuItem>
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
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
