import { useState, useEffect, useMemo, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Product } from "@/data/mockData";
import { Customer } from "@/services/api";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Check,
  Package,
  Plus,
  Trash2,
  Eye,
  Loader2,
  Mail,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import MockupGeneratorDialog from "@/components/MockupGeneratorDialog";
import MockupBatchSection from "@/components/MockupBatchSection";
import ImageLightbox from "@/components/ImageLightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { useLanguage } from "@/i18n/LanguageContext";
import apiService from "@/services/api";
import { parseEuroNumber, formatEuro } from "@/lib/utils";

type Step = "customer" | "products" | "review";

interface ReviewItem {
  product: Product;
  unitPrice: number;
  quantity: number;
  discount: number;
  markingCost: number;
  internalMarkingCost: number;
  showUnitPrice: boolean;
  showTotalPrice: boolean;
  hideMarkingCost: boolean;
  generateMockup: boolean;
  mockupImage?: string;
}

interface SpecialCostInput {
  name: string;
  amount: number;
}

export default function NewQuote() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("customer");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [sourceOffer, setSourceOffer] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [mockupDialogItemIdx, setMockupDialogItemIdx] = useState<number | null>(
    null,
  );
  // Toggle between "dialog" (per-item dialog) and "batch" (inline section) mockup flows
  const [mockupFlow, setMockupFlow] = useState<"dialog" | "batch">("batch");

  // Lightbox state for image preview
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string>("");

  // Product data state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [totalProductPages, setTotalProductPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Offer creation state
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [isSendingOffer, setIsSendingOffer] = useState(false);
  const [isMockupGenerating, setIsMockupGenerating] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Offer details state
  const [validUntil, setValidUntil] = useState("");
  const [validDays, setValidDays] = useState("");
  const [validityError, setValidityError] = useState<string | null>(null);
  const [showTotalPrice, setShowTotalPrice] = useState(true);
  const [additionalTermsEnabled, setAdditionalTermsEnabled] = useState(false);
  const [additionalTerms, setAdditionalTerms] = useState("");
  const [specialCosts, setSpecialCosts] = useState<SpecialCostInput[]>([]);
  const [displayValues, setDisplayValues] = useState<Record<string, string>>(
    {},
  );
  const minValidDate = new Date().toISOString().split("T")[0];

  const calculateItemsTotal = (items: ReviewItem[]) =>
    items.reduce((sum, item) => {
      const discounted = item.unitPrice * (1 - item.discount / 100);
      return sum + (discounted + item.markingCost) * item.quantity;
    }, 0);

  const calculateSpecialCostsTotal = (costs: SpecialCostInput[]) =>
    costs.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);

  const allowNumericOnly = (
    e: React.KeyboardEvent<HTMLInputElement>,
    allowDecimal = true,
  ) => {
    if (
      [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ].includes(e.key)
    )
      return;
    if (
      (e.ctrlKey || e.metaKey) &&
      ["a", "c", "v", "x"].includes(e.key.toLowerCase())
    )
      return;
    if (
      allowDecimal &&
      (e.key === "." || e.key === ",") &&
      !(e.target as HTMLInputElement).value.includes(".") &&
      !(e.target as HTMLInputElement).value.includes(",")
    )
      return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  // Helper functions for validity date synchronization
  const calculateDaysFromDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays.toString() : "";
  };

  const calculateDateFromDays = (daysStr: string): string => {
    if (!daysStr || isNaN(Number(daysStr))) return "";
    const days = parseInt(daysStr);
    if (days <= 0) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return futureDate.toISOString().split("T")[0];
  };

  // Customer data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customerPage, setCustomerPage] = useState(1);
  const [totalCustomerPages, setTotalCustomerPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const validUntilRef = useRef<HTMLInputElement | null>(null);
  const validDaysRef = useRef<HTMLInputElement | null>(null);
  const discountInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  // Fetch customers from database on component mount and when page or search changes
  useEffect(() => {
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      setCustomersError(null);
      try {
        const result = await apiService.fetchCustomers({
          page: customerPage,
          limit: 8,
          search: debouncedCustomerSearch || undefined,
        });
        if (result.success && result.data) {
          setCustomers(result.data);
          if (result.pagination) {
            setTotalCustomerPages(result.pagination.pages);
            setTotalCustomers(result.pagination.total);
          }
        } else {
          setCustomersError(result.message || "Failed to fetch customers");
        }
      } catch (error) {
        setCustomersError("Failed to fetch customers. Please try again.");
      } finally {
        setCustomersLoading(false);
      }
    };

    fetchCustomers();
  }, [customerPage, debouncedCustomerSearch]);

  // Fetch products, categories, and brands from database on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const result = await apiService.fetchProducts({
          page: productPage,
          limit: 8,
          category: categoryFilter === "all" ? undefined : categoryFilter,
          brand: brandFilter === "all" ? undefined : brandFilter,
          search: debouncedProductSearch || undefined,
        });
        if (result.success && result.data) {
          setProducts(result.data);
          if (result.pagination) {
            setTotalProductPages(result.pagination.pages);
            setTotalProducts(result.pagination.total);
          }
        } else {
          setProductsError(result.message || "Failed to fetch products");
        }
      } catch (error) {
        setProductsError("Failed to fetch products. Please try again.");
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [productPage, categoryFilter, brandFilter, debouncedProductSearch]);

  // Fetch categories and brands once on mount — they rarely change
  useEffect(() => {
    apiService.fetchCategories().then(r => {
      if (r.success && r.data) setCategories(r.data);
    });
    apiService.fetchBrands().then(r => {
      if (r.success && r.data) setBrands(r.data);
    });
  }, []);

  // Handle pre-selected customer or products from URL params
  useEffect(() => {
    const customerId = searchParams.get("customer");
    const productNumbers = searchParams.get("products");

    if (customerId && customers.length > 0) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setStep("products");
      }
    }

    if (productNumbers) {
      setSelectedProducts(new Set(productNumbers.split(",")));
      if (!customerId) setStep("customer");
    }
  }, [searchParams, customers]);

  // Fetch source offer from API when duplicating via ?duplicate=<id>
  useEffect(() => {
    const duplicateId = searchParams.get("duplicate");
    if (!duplicateId) return;
    apiService.getOfferById(duplicateId).then(res => {
      if (res.success && res.data) {
        const api = res.data as Record<string, unknown>;
        setSourceOffer(api);
        setIsDuplicate(true);
        const offerDetails =
          (api.offerDetails as Record<string, unknown>) || {};
        setSpecialCosts(
          (offerDetails.specialCosts as SpecialCostInput[]) || [],
        );
        setSelectedProducts(
          new Set(
            ((api.items as unknown[]) || []).map(
              item => (item as Record<string, unknown>).productNumber as string,
            ),
          ),
        );
      }
    });
  }, [searchParams]);

  // Build review items when entering review step
  useEffect(() => {
    if (step === "review" && selectedProducts.size > 0) {
      const fetchSelectedProducts = async () => {
        if (selectedProducts.size === 0) {
          setReviewItems([]);
          setReviewLoading(false);
          return;
        }

        setReviewLoading(true);
        try {
          // Fetch only the selected products by their product numbers for better performance
          const productNumbers = Array.from(selectedProducts) as string[];
          const result = await apiService.fetchProducts({
            productNumbers: productNumbers,
          });

          if (result.success && result.data) {
            const sourceItems = sourceOffer
              ? (sourceOffer.items as unknown[]) || []
              : [];

            setReviewItems(
              result.data.map(p => {
                const sourceItem = sourceItems.find(
                  i => (i as Record<string, unknown>).productId === p.id,
                ) as Record<string, unknown> | undefined;
                return {
                  product: p,
                  unitPrice: (sourceItem?.unitPrice as number) ?? p.salesPrice,
                  quantity: (sourceItem?.quantity as number) ?? 1,
                  discount: (sourceItem?.discount as number) ?? 0,
                  markingCost: (sourceItem?.markingCost as number) ?? 0,
                  internalMarkingCost:
                    (sourceItem?.internalMarkingCost as number) ?? 0,
                  showUnitPrice: (sourceItem?.showUnitPrice as boolean) ?? true,
                  showTotalPrice:
                    (sourceItem?.showTotalPrice as boolean) ?? true,
                  hideMarkingCost:
                    (sourceItem?.hideMarkingCost as boolean) ?? false,
                  generateMockup:
                    (sourceItem?.generateMockup as boolean) ?? false,
                  mockupImage: sourceItem?.mockupImage as string | undefined,
                };
              }),
            );
          }
        } catch (error) {
          console.error("Failed to fetch selected products:", error);
        } finally {
          setReviewLoading(false);
        }
      };

      fetchSelectedProducts();
    }
  }, [step, selectedProducts, searchParams, sourceOffer]);

  const steps: { key: Step; label: string }[] = [
    { key: "customer", label: t("offers.selectCustomer") },
    { key: "products", label: t("offers.selectProducts") },
    { key: "review", label: t("offers.review") },
  ];

  // Reset customer page when search changes
  useEffect(() => {
    setCustomerPage(1);
  }, [debouncedCustomerSearch]);

  // Products are now fetched from API with server-side filtering and pagination
  // The products state already contains the filtered and paginated results
  const productPageData = products;

  // Reset product page when search or filters change
  useEffect(() => {
    setProductPage(1);
  }, [debouncedProductSearch, categoryFilter, brandFilter]);

  const toggleProduct = (productNumber: string) => {
    const next = new Set(selectedProducts);
    if (next.has(productNumber)) next.delete(productNumber);
    else next.add(productNumber);
    setSelectedProducts(next);
  };

  const updateItem = (index: number, updates: Partial<ReviewItem>) => {
    setReviewItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  };

  const removeItem = (index: number) => {
    const item = reviewItems[index];
    const next = new Set(selectedProducts);
    next.delete(item.product.productNumber);
    setSelectedProducts(next);
    setReviewItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpecialCost = (
    index: number,
    updates: Partial<SpecialCostInput>,
  ) => {
    setSpecialCosts(prev =>
      prev.map((cost, i) => (i === index ? { ...cost, ...updates } : cost)),
    );
  };

  const addSpecialCost = () => {
    setSpecialCosts(prev => [...prev, { name: "", amount: 0 }]);
  };

  const removeSpecialCost = (index: number) => {
    setSpecialCosts(prev => prev.filter((_, i) => i !== index));
  };

  const validateOfferBeforeCreate = () => {
    // Validate per-item discount (0–100)
    const newItemErrors: Record<string, string> = {};
    let firstDiscountErrorIdx = -1;
    reviewItems.forEach((item, idx) => {
      if (item.discount < 0 || item.discount > 100) {
        newItemErrors[`${idx}-discount`] = t("offers.discountRangeError") || "Discount must be between 0 and 100";
        if (firstDiscountErrorIdx === -1) firstDiscountErrorIdx = idx;
      }
    });
    setItemErrors(newItemErrors);
    if (firstDiscountErrorIdx !== -1) {
      setOfferError(null);
      discountInputRefs.current[firstDiscountErrorIdx]?.focus();
      return false;
    }

    const parsedValidDays = Number(validDays);
    const hasValidDays =
      validDays !== "" && !Number.isNaN(parsedValidDays) && parsedValidDays > 0;
    const hasValidDate = Boolean(validUntil);

    if (!hasValidDate && !hasValidDays) {
      setValidityError(t("offers.validityRequired"));
      setOfferError(null);
      validUntilRef.current?.focus();
      return false;
    }

    setValidityError(null);
    return true;
  };

  const currentStepIndex = steps.findIndex(s => s.key === step);
  const totalAmount =
    calculateItemsTotal(reviewItems) + calculateSpecialCostsTotal(specialCosts);
  const hasPendingMockups = reviewItems.some(
    item => item.generateMockup && !item.mockupImage,
  );

  const buildOfferData = () => ({
    customerId: selectedCustomer?.id || "",
    customerName: selectedCustomer?.companyName || "",
    contactPerson: selectedCustomer?.contactPerson || "",
    email: selectedCustomer?.email || "",
    phone: selectedCustomer?.phone || "",
    address: selectedCustomer?.address || "",
    items: reviewItems.map(item => ({
      productId: item.product.id,
      productNumber: item.product.productNumber,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      markingCost: item.markingCost,
      internalMarkingCost: item.internalMarkingCost,
      showUnitPrice: item.showUnitPrice,
      showTotalPrice: item.showTotalPrice,
      hideMarkingCost: item.hideMarkingCost,
      generateMockup: item.generateMockup,
      mockupImage: item.mockupImage,
    })),
    offerDetails: {
      validUntil,
      validDays,
      showTotalPrice,
      additionalTermsEnabled,
      additionalTerms,
      specialCosts,
    },
    totalAmount,
    itemCount: reviewItems.length,
  });

  const handleSaveAsDraft = async () => {
    if (!validateOfferBeforeCreate()) return;
    setIsCreatingOffer(true);
    setOfferError(null);
    try {
      const result = await apiService.createOffer(buildOfferData());
      if (result.success) {
        navigate(`/quotes/${String(result.data._id || result.data.offerId)}`);
      } else {
        setOfferError(result.message || "Failed to create offer");
      }
    } catch {
      setOfferError("Failed to create offer. Please try again.");
    } finally {
      setIsCreatingOffer(false);
    }
  };

  const handleCreateAndSend = async () => {
    if (!validateOfferBeforeCreate()) return;
    setIsSendingOffer(true);
    setOfferError(null);
    try {
      const createResult = await apiService.createOffer(buildOfferData());
      if (!createResult.success) {
        setOfferError(createResult.message || "Failed to create offer");
        return;
      }
      const offerId = String(createResult.data._id || createResult.data.offerId);
      const sendResult = await apiService.sendOffer(offerId);
      if (!sendResult.success) {
        setOfferError(sendResult.message || "Failed to send offer email");
        navigate(`/quotes/${offerId}`);
        return;
      }
      navigate(`/quotes/${offerId}`);
    } catch {
      setOfferError("Failed to create and send offer. Please try again.");
    } finally {
      setIsSendingOffer(false);
    }
  };

  const customerHistory = useMemo(() => {
    return { quotes: [], orders: [] };
  }, []);

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background -mt-6 pt-6 -mx-6 px-6 pb-4 border-b border-border mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/quotes">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex-1">
            {isDuplicate ? t("offers.duplicateOffer") : t("offers.newOffer")}
          </h1>
          {step === "customer" && (
            <Button
              disabled={!selectedCustomer}
              onClick={() => setStep("products")}
            >
              {t("common.next")} <ArrowRight size={16} className="ml-2" />
            </Button>
          )}
          {step === "products" && (
            <Button
              disabled={selectedProducts.size === 0}
              onClick={() => setStep("review")}
            >
              {t("common.next")} ({selectedProducts.size}){" "}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { if (i < currentStepIndex) setStep(s.key as Step); }}
                className={`flex items-center gap-2 ${i < currentStepIndex ? "cursor-pointer" : "cursor-default"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s.key === step
                      ? "bg-primary text-primary-foreground"
                      : currentStepIndex > i
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStepIndex > i ? <Check size={14} /> : i + 1}
                </div>
                <span
                  className={`text-sm ${s.key === step ? "font-semibold" : "text-muted-foreground"}`}
                >
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step: Customer */}
      {step === "customer" && (
        <div>
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder={t("offers.searchCustomers")}
              className="pl-9"
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
            />
          </div>

          {/* Loading state */}
          {customersLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">
                {t("common.loadingCustomers")}
              </span>
            </div>
          )}

          {/* Error state */}
          {customersError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
              <p className="text-destructive font-medium mb-2">
                Failed to load customers
              </p>
              <p className="text-sm text-destructive/80 mb-3">
                {customersError}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomersLoading(true);
                  setCustomersError(null);
                  apiService
                    .fetchCustomers({
                      page: customerPage,
                      limit: 8,
                      search: customerSearch || undefined,
                    })
                    .then(result => {
                      if (result.success && result.data) {
                        setCustomers(result.data);
                        if (result.pagination) {
                          setTotalCustomerPages(result.pagination.pages);
                          setTotalCustomers(result.pagination.total);
                        }
                      } else {
                        setCustomersError(
                          result.message || "Failed to fetch customers",
                        );
                      }
                    })
                    .catch(() =>
                      setCustomersError(
                        "Failed to fetch customers. Please try again.",
                      ),
                    )
                    .finally(() => setCustomersLoading(false));
                }}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!customersLoading && !customersError && customers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No customers found</p>
              {customerSearch && (
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search
                </p>
              )}
            </div>
          )}

          {/* Customer list */}
          {!customersLoading && !customersError && customers.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      selectedCustomer?.id === c.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <p className="font-medium">{c.companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.contactPerson} · {c.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.address}
                    </p>
                  </button>
                ))}
              </div>

              <Pagination
                currentPage={customerPage}
                totalPages={totalCustomerPages}
                onPageChange={setCustomerPage}
              />
            </>
          )}

          {selectedCustomer &&
            (customerHistory.quotes.length > 0 ||
              customerHistory.orders.length > 0) && (
              <div className="mt-6 bg-card rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold mb-3">
                  {t("offers.orderHistory")} — {selectedCustomer.companyName}
                </h3>
                {customerHistory.quotes.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground font-medium mb-2">
                      {t("offers.title")} ({customerHistory.quotes.length})
                    </p>
                    <div className="space-y-1">
                      {customerHistory.quotes.slice(0, 5).map(q => (
                        <div
                          key={q.id}
                          className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs">
                              {q.quoteNumber}
                            </span>
                            <span className={`status-badge status-${q.status}`}>
                              {q.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">
                              {q.createdAt}
                            </span>
                            <span className="font-medium">
                              €{q.totalAmount.toLocaleString("de-DE")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {customerHistory.orders.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">
                      {t("orders.title")} ({customerHistory.orders.length})
                    </p>
                    <div className="space-y-1">
                      {customerHistory.orders.slice(0, 5).map(o => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs">
                              {o.orderNumber}
                            </span>
                            <span
                              className={`status-badge ${o.status === "completed" ? "status-completed" : "status-sent"}`}
                            >
                              {o.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">
                              {o.createdAt}
                            </span>
                            <span className="font-medium">
                              €{o.totalAmount.toLocaleString("de-DE")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {/* Step: Products */}
      {step === "products" && (
        <div>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder={t("offers.searchProducts")}
                className="pl-9"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("products.allCategories")}
                </SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("products.allBrands")}</SelectItem>
                {brands.map(b => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProducts.size > 0 && (
            <p className="text-sm text-primary font-medium mb-3">
              {selectedProducts.size} {t("offers.productsSelected")}
            </p>
          )}

          {/* Loading state */}
          {productsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">
                {t("common.loadingProducts")}
              </span>
            </div>
          )}

          {/* Error state */}
          {productsError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
              <p className="text-destructive font-medium mb-2">
                Failed to load products
              </p>
              <p className="text-sm text-destructive/80 mb-3">
                {productsError}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProductsLoading(true);
                  setProductsError(null);
                  apiService
                    .fetchProducts({
                      page: productPage,
                      limit: 8,
                      category:
                        categoryFilter === "all" ? undefined : categoryFilter,
                      brand: brandFilter === "all" ? undefined : brandFilter,
                      search: productSearch || undefined,
                    })
                    .then(result => {
                      if (result.success && result.data) {
                        setProducts(result.data);
                        if (result.pagination) {
                          setTotalProductPages(result.pagination.pages);
                          setTotalProducts(result.pagination.total);
                        }
                      } else {
                        setProductsError(
                          result.message || "Failed to fetch products",
                        );
                      }
                    })
                    .catch(() =>
                      setProductsError(
                        "Failed to fetch products. Please try again.",
                      ),
                    )
                    .finally(() => setProductsLoading(false));
                }}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!productsLoading && !productsError && products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
              {(productSearch ||
                categoryFilter !== "all" ||
                brandFilter !== "all") && (
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search or filters
                </p>
              )}
            </div>
          )}

          {/* Product list */}
          {!productsLoading && !productsError && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {productPageData.map(p => {
                const isSelected = selectedProducts.has(p.productNumber);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p.productNumber)}
                    className={`text-left rounded-lg border overflow-hidden transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="aspect-square bg-muted flex items-center justify-center relative group overflow-hidden">
                      {p.images ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-full h-full object-cover cursor-zoom-in"
                          onClick={e => {
                            e.stopPropagation();
                            setLightboxImage(p.images![0]);
                            setLightboxAlt(p.name);
                          }}
                        />
                      ) : (
                        <Package
                          size={28}
                          className="text-muted-foreground/40"
                        />
                      )}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleProduct(p.productNumber);
                        }}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center transition-opacity ${
                          isSelected
                            ? "bg-primary text-primary-foreground opacity-100"
                            : "bg-background/80 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 hover:bg-background"
                        }`}
                      >
                        {isSelected ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setDetailProduct(p);
                        }}
                        className="absolute bottom-2 right-2 w-7 h-7 bg-background/80 backdrop-blur-sm border border-border rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                      >
                        <Eye size={14} className="text-foreground" />
                      </button>
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.brand} · €{formatEuro(p.salesPrice)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!productsLoading && !productsError && products.length > 0 && (
            <Pagination
              currentPage={productPage}
              totalPages={totalProductPages}
              onPageChange={setProductPage}
            />
          )}

          <div className="sticky bottom-0 -mx-6 px-6 pt-4 pb-6 -mb-6 bg-background border-t border-border flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep("customer")}>
              <ArrowLeft size={16} className="mr-2" /> {t("common.back")}
            </Button>
            <Button
              disabled={selectedProducts.size === 0}
              onClick={() => setStep("review")}
            >
              {t("common.next")} <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>

          <ProductDetailDialog
            product={detailProduct}
            open={!!detailProduct}
            onOpenChange={open => !open && setDetailProduct(null)}
          />
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div>
          <div className="bg-card rounded-lg border border-border p-4 mb-4">
            <p className="text-sm text-muted-foreground">
              {t("common.customer")}
            </p>
            <p className="font-semibold">{selectedCustomer?.companyName}</p>
            <p className="text-sm text-muted-foreground">
              {selectedCustomer?.contactPerson} · {selectedCustomer?.email}
            </p>
          </div>

          <h3 className="font-semibold mb-3">
            {t("offers.selectedProducts")} ({reviewItems.length})
          </h3>

          {/* Loading state */}
          {reviewLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">
                {t("common.loadingProducts")}
              </span>
            </div>
          )}

          {!reviewLoading && (
            <div className="space-y-4 mb-6">
              {reviewItems.map((item, idx) => {
                const discounted = item.unitPrice * (1 - item.discount / 100);
                const lineTotal =
                  (discounted + item.markingCost) * item.quantity;
                return (
                  <div
                    key={item.product.id}
                    className="bg-card rounded-lg border border-border p-4"
                  >
                    <div className="flex gap-4">
                      <div
                        className="w-24 h-24 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden cursor-zoom-in"
                        onClick={() => {
                          if (item.product.images?.length) {
                            setLightboxImage(item.product.images[0]);
                            setLightboxAlt(item.product.name);
                          }
                        }}
                      >
                        {item.product.images &&
                        item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package
                            size={24}
                            className="text-muted-foreground/40"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.product.productNumber} · €
                              {formatEuro(item.product.salesPrice)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeItem(idx)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {t("offers.unitPrice")}
                            </Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={
                                displayValues[`${idx}-unitPrice`] ??
                                item.unitPrice
                              }
                              onKeyDown={e => allowNumericOnly(e)}
                              onChange={e => {
                                const v = e.target.value;
                                if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                                  const current =
                                    displayValues[`${idx}-unitPrice`] ??
                                    String(item.unitPrice);
                                  const display =
                                    current === "0" &&
                                    v.length > 1 &&
                                    !v.startsWith("0.") &&
                                    !v.startsWith("0,")
                                      ? v.replace(/^0+/, "") || "0"
                                      : v;
                                  setDisplayValues(prev => ({
                                    ...prev,
                                    [`${idx}-unitPrice`]: display,
                                  }));
                                  updateItem(idx, {
                                    unitPrice:
                                      display === ""
                                        ? 0
                                        : parseEuroNumber(display),
                                  });
                                }
                              }}
                              onBlur={() => {
                                const parsed = parseEuroNumber(
                                  displayValues[`${idx}-unitPrice`] ??
                                    String(item.unitPrice),
                                );
                                setDisplayValues(prev => ({
                                  ...prev,
                                  [`${idx}-unitPrice`]: String(parsed),
                                }));
                              }}
                              className="mt-1 h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {t("offers.quantity")}
                            </Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={item.quantity}
                              onKeyDown={e => allowNumericOnly(e, false)}
                              onChange={e =>
                                updateItem(idx, {
                                  quantity: parseInt(e.target.value) || 0,
                                })
                              }
                              className="mt-1 h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {t("offers.discount")}
                            </Label>
                            <Input
                              ref={el => { discountInputRefs.current[idx] = el; }}
                              type="text"
                              inputMode="decimal"
                              value={
                                displayValues[`${idx}-discount`] ??
                                item.discount
                              }
                              onKeyDown={e => allowNumericOnly(e)}
                              onChange={e => {
                                const v = e.target.value;
                                if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                                  const current =
                                    displayValues[`${idx}-discount`] ??
                                    String(item.discount);
                                  const display =
                                    current === "0" &&
                                    v.length > 1 &&
                                    !v.startsWith("0.") &&
                                    !v.startsWith("0,")
                                      ? v.replace(/^0+/, "") || "0"
                                      : v;
                                  const parsed = display === "" ? 0 : parseEuroNumber(display);
                                  setDisplayValues(prev => ({
                                    ...prev,
                                    [`${idx}-discount`]: display,
                                  }));
                                  updateItem(idx, { discount: parsed });
                                  if (parsed >= 0 && parsed <= 100) {
                                    setItemErrors(prev => {
                                      const next = { ...prev };
                                      delete next[`${idx}-discount`];
                                      return next;
                                    });
                                  }
                                }
                              }}
                              onBlur={() => {
                                const parsed = parseEuroNumber(
                                  displayValues[`${idx}-discount`] ??
                                    String(item.discount),
                                );
                                setDisplayValues(prev => ({
                                  ...prev,
                                  [`${idx}-discount`]: String(parsed),
                                }));
                                if (parsed < 0 || parsed > 100) {
                                  setItemErrors(prev => ({
                                    ...prev,
                                    [`${idx}-discount`]: t("offers.discountRangeError") || "Discount must be between 0 and 100",
                                  }));
                                }
                              }}
                              className={`mt-1 h-8 text-sm ${itemErrors[`${idx}-discount`] ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                            {itemErrors[`${idx}-discount`] && (
                              <p className="text-xs text-destructive mt-1">
                                {itemErrors[`${idx}-discount`]}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {t("offers.markingCost")}
                            </Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={
                                displayValues[`${idx}-markingCost`] ??
                                item.markingCost
                              }
                              onKeyDown={e => allowNumericOnly(e)}
                              onChange={e => {
                                const v = e.target.value;
                                if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                                  const current =
                                    displayValues[`${idx}-markingCost`] ??
                                    String(item.markingCost);
                                  const display =
                                    current === "0" &&
                                    v.length > 1 &&
                                    !v.startsWith("0.") &&
                                    !v.startsWith("0,")
                                      ? v.replace(/^0+/, "") || "0"
                                      : v;
                                  setDisplayValues(prev => ({
                                    ...prev,
                                    [`${idx}-markingCost`]: display,
                                  }));
                                  updateItem(idx, {
                                    markingCost:
                                      display === ""
                                        ? 0
                                        : parseEuroNumber(display),
                                  });
                                }
                              }}
                              onBlur={() => {
                                const parsed = parseEuroNumber(
                                  displayValues[`${idx}-markingCost`] ??
                                    String(item.markingCost),
                                );
                                setDisplayValues(prev => ({
                                  ...prev,
                                  [`${idx}-markingCost`]: String(parsed),
                                }));
                              }}
                              className="mt-1 h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {t("offers.internalMarkingCost")}
                            </Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={
                                displayValues[`${idx}-internalMarkingCost`] ??
                                item.internalMarkingCost
                              }
                              onKeyDown={e => allowNumericOnly(e)}
                              onChange={e => {
                                const v = e.target.value;
                                if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                                  const current =
                                    displayValues[
                                      `${idx}-internalMarkingCost`
                                    ] ?? String(item.internalMarkingCost);
                                  const display =
                                    current === "0" &&
                                    v.length > 1 &&
                                    !v.startsWith("0.") &&
                                    !v.startsWith("0,")
                                      ? v.replace(/^0+/, "") || "0"
                                      : v;
                                  setDisplayValues(prev => ({
                                    ...prev,
                                    [`${idx}-internalMarkingCost`]: display,
                                  }));
                                  updateItem(idx, {
                                    internalMarkingCost:
                                      display === ""
                                        ? 0
                                        : parseEuroNumber(display),
                                  });
                                }
                              }}
                              onBlur={() => {
                                const parsed = parseEuroNumber(
                                  displayValues[`${idx}-internalMarkingCost`] ??
                                    String(item.internalMarkingCost),
                                );
                                setDisplayValues(prev => ({
                                  ...prev,
                                  [`${idx}-internalMarkingCost`]:
                                    String(parsed),
                                }));
                              }}
                              className="mt-1 h-8 text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.showUnitPrice}
                              onCheckedChange={v =>
                                updateItem(idx, { showUnitPrice: v })
                              }
                            />
                            <Label className="text-xs">
                              {t("offers.showUnitPrice")}
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.showTotalPrice}
                              onCheckedChange={v =>
                                updateItem(idx, { showTotalPrice: v })
                              }
                            />
                            <Label className="text-xs">
                              {t("offers.showTotal")}
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.hideMarkingCost}
                              onCheckedChange={v =>
                                updateItem(idx, { hideMarkingCost: v })
                              }
                            />
                            <Label className="text-xs">
                              {t("offers.hideMarkingCost")}
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.generateMockup}
                              onCheckedChange={v =>
                                updateItem(idx, { generateMockup: v })
                              }
                            />
                            <Label className="text-xs">
                              {t("offers.generateMockup")}
                            </Label>
                          </div>
                          {item.generateMockup && mockupFlow === "dialog" && (
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant={
                                  item.mockupImage ? "outline" : "secondary"
                                }
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setMockupDialogItemIdx(idx)}
                              >
                                <ImageIcon size={12} className="mr-1" />
                                {item.mockupImage
                                  ? t("mockup.viewMockup")
                                  : t("mockup.generate")}
                              </Button>
                              {item.mockupImage && (
                                <div
                                  className="w-8 h-8 rounded border border-green-500 overflow-hidden cursor-zoom-in"
                                  onClick={() => {
                                    setLightboxImage(item.mockupImage!);
                                    setLightboxAlt(
                                      `Mockup - ${item.product.name}`,
                                    );
                                  }}
                                >
                                  <img
                                    src={item.mockupImage}
                                    alt="Mockup"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          {item.generateMockup &&
                            mockupFlow === "batch" &&
                            item.mockupImage && (
                              <div
                                className="w-8 h-8 rounded border border-green-500 overflow-hidden cursor-zoom-in"
                                onClick={() => {
                                  setLightboxImage(item.mockupImage!);
                                  setLightboxAlt(
                                    `Mockup - ${item.product.name}`,
                                  );
                                }}
                              >
                                <img
                                  src={item.mockupImage}
                                  alt="Mockup"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                        </div>

                        {/* Mockup pending warning */}
                        {item.generateMockup && !item.mockupImage && (
                          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                            {t("mockup.pendingWarning")}
                          </p>
                        )}

                        {/* Inline mockup image preview */}
                        {item.mockupImage && (
                          <div className="mt-3 p-3 rounded-lg border border-border bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-2">
                              {t("mockup.generatedImage")}
                            </p>
                            <div
                              className="rounded-md border border-border overflow-hidden bg-muted inline-block cursor-zoom-in"
                              onClick={() => {
                                setLightboxImage(item.mockupImage!);
                                setLightboxAlt(`Mockup - ${item.product.name}`);
                              }}
                            >
                              <img
                                src={item.mockupImage}
                                alt={`Mockup - ${item.product.name}`}
                                className="max-w-[240px] max-h-[180px] w-auto h-auto object-contain"
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-2 text-right">
                          <span className="text-sm font-semibold">
                            €{formatEuro(lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Batch Mockup Section (flow 2) */}
          {mockupFlow === "batch" &&
            reviewItems.some(item => item.generateMockup) && (
              <MockupBatchSection
                items={reviewItems
                  .map((item, idx) => ({
                    index: idx,
                    product: item.product,
                    mockupImage: item.mockupImage,
                  }))
                  .filter((_, idx) => reviewItems[idx].generateMockup)}
                customerCompanyLogo={selectedCustomer?.companyLogo}
                customerName={selectedCustomer?.companyName}
                onMockupGenerated={(itemIndex, mockupUrl) => {
                  updateItem(itemIndex, { mockupImage: mockupUrl });
                }}
                onMockupRemoved={itemIndex => {
                  updateItem(itemIndex, { mockupImage: undefined });
                }}
                onGeneratingChange={setIsMockupGenerating}
              />
            )}

          {/* Other offer details */}
          <div className="bg-card rounded-lg border border-border p-5 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {t("offers.otherDetails")}
            </h2>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Label className="text-sm">{t("offers.validityDate")}</Label>
              <Input
                type="date"
                ref={validUntilRef}
                min={minValidDate}
                value={validUntil}
                onChange={e => {
                  setValidUntil(e.target.value);
                  setValidDays(calculateDaysFromDate(e.target.value));
                  if (e.target.value) setValidityError(null);
                }}
                className={`w-44 h-9 ${validityError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              <span className="text-sm text-muted-foreground">
                {t("common.or")}
              </span>
              <Input
                type="text"
                inputMode="numeric"
                ref={validDaysRef}
                placeholder={t("common.days")}
                value={validDays}
                onKeyDown={e => allowNumericOnly(e, false)}
                onChange={e => {
                  setValidDays(e.target.value);
                  setValidUntil(calculateDateFromDays(e.target.value));
                  if (e.target.value) setValidityError(null);
                }}
                className={`w-20 h-9 ${validityError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              <span className="text-sm text-muted-foreground">
                {t("common.days")}
              </span>
            </div>
            {validityError && (
              <p className="text-sm text-destructive mb-4">{validityError}</p>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={showTotalPrice}
                  onCheckedChange={setShowTotalPrice}
                />
                <Label className="text-sm">{t("offers.showTotalPrice")}</Label>
              </div>

              <div className="flex items-start gap-3">
                <Switch
                  checked={additionalTermsEnabled}
                  onCheckedChange={setAdditionalTermsEnabled}
                />
                <div className="flex-1">
                  <Label className="text-sm">{t("offers.extraText")}</Label>
                  {additionalTermsEnabled && (
                    <Textarea
                      value={additionalTerms}
                      onChange={e => setAdditionalTerms(e.target.value)}
                      placeholder={t("offers.extraTextPlaceholder")}
                      className="mt-2"
                      rows={3}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm">{t("offers.specialCosts")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSpecialCost}
                >
                  <Plus size={14} className="mr-2" />
                  {t("offers.addSpecialCost")}
                </Button>
              </div>

              <div className="space-y-3">
                {specialCosts.map((cost, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3"
                  >
                    <Input
                      value={cost.name}
                      placeholder={t("offers.specialCostName")}
                      onChange={e =>
                        updateSpecialCost(idx, { name: e.target.value })
                      }
                    />
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={displayValues[`sc-${idx}-amount`] ?? cost.amount}
                      placeholder={t("offers.specialCostAmount")}
                      onKeyDown={e => allowNumericOnly(e)}
                      onChange={e => {
                        const v = e.target.value;
                        if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                          const current =
                            displayValues[`sc-${idx}-amount`] ??
                            String(cost.amount);
                          const display =
                            current === "0" &&
                            v.length > 1 &&
                            !v.startsWith("0.") &&
                            !v.startsWith("0,")
                              ? v.replace(/^0+/, "") || "0"
                              : v;
                          setDisplayValues(prev => ({
                            ...prev,
                            [`sc-${idx}-amount`]: display,
                          }));
                          updateSpecialCost(idx, {
                            amount:
                              display === "" ? 0 : parseEuroNumber(display),
                          });
                        }
                      }}
                      onBlur={() => {
                        const parsed = parseEuroNumber(
                          displayValues[`sc-${idx}-amount`] ??
                            String(cost.amount),
                        );
                        setDisplayValues(prev => ({
                          ...prev,
                          [`sc-${idx}-amount`]: String(parsed),
                        }));
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeSpecialCost(idx)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4 mb-6 flex justify-end">
            <div className="text-right">
              {specialCosts.length > 0 && (
                <div className="mb-3 space-y-1">
                  {specialCosts.map((cost, idx) => (
                    <p key={idx} className="text-sm">
                      <span className="text-muted-foreground">
                        {cost.name || t("offers.specialCostName")}
                      </span>{" "}
                      €{formatEuro(cost.amount)}
                    </p>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {t("offers.totalAmount")}
              </p>
              <p className="text-2xl font-bold">€{formatEuro(totalAmount)}</p>
            </div>
          </div>

          {/* Pending mockups warning */}
          {hasPendingMockups && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
              <p className="text-amber-700 dark:text-amber-400 text-sm font-medium">
                {t("mockup.pendingOfferWarning")}
              </p>
            </div>
          )}

          {/* Offer error message */}
          {offerError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
              <p className="text-destructive font-medium">{offerError}</p>
            </div>
          )}

          <div className="sticky bottom-0 -mx-6 px-6 pt-4 pb-6 -mb-6 bg-background border-t border-border flex justify-between">
            <Button variant="outline" onClick={() => setStep("products")}>
              <ArrowLeft size={16} className="mr-2" /> {t("common.back")}
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const draftData = {
                    offerNumber: "DRAFT",
                    offerDetails: {
                      validUntil,
                      validDays,
                      additionalTerms: additionalTermsEnabled
                        ? additionalTerms
                        : "",
                      showTotalPrice,
                      specialCosts,
                    },
                    customerName: selectedCustomer?.companyName || "",
                    contactPerson: selectedCustomer?.contactPerson || "",
                    items: reviewItems.map(item => ({
                      productId: item.product.id,
                      productName: item.product.name,
                      productNumber: item.product.productNumber,
                      imageUrl: item.product.images?.[0] || "",
                      mockupImage: item.mockupImage || undefined,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      discount: item.discount,
                      markingCost: item.markingCost,
                      showUnitPrice: item.showUnitPrice,
                      showTotalPrice: item.showTotalPrice,
                      hideMarkingCost: item.hideMarkingCost,
                    })),
                    customerResponse: "pending",
                    version: 1,
                  };
                  sessionStorage.setItem(
                    "offer_preview_draft",
                    JSON.stringify(draftData),
                  );
                  window.open("/offers/preview-draft", "_blank");
                }}
                disabled={reviewItems.length === 0}
              >
                <Eye size={16} className="mr-2" /> {t("offers.previewOffer")}
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={
                  reviewItems.length === 0 ||
                  isCreatingOffer ||
                  isSendingOffer ||
                  isMockupGenerating ||
                  hasPendingMockups
                }
              >
                {isCreatingOffer ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                {isCreatingOffer ? "Saving..." : t("offers.saveAsDraft")}
              </Button>
              <Button
                onClick={handleCreateAndSend}
                disabled={
                  reviewItems.length === 0 ||
                  isCreatingOffer ||
                  isSendingOffer ||
                  isMockupGenerating ||
                  hasPendingMockups
                }
              >
                {isSendingOffer ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Mail size={16} className="mr-2" />
                )}
                {isSendingOffer ? t("offers.sendingOffer") : t("offers.createAndSendEmail")}
              </Button>
            </div>
          </div>

          {/* Mockup Generator Dialog (flow 1) */}
          {mockupFlow === "dialog" &&
            mockupDialogItemIdx !== null &&
            reviewItems[mockupDialogItemIdx] && (
              <MockupGeneratorDialog
                open={mockupDialogItemIdx !== null}
                onOpenChange={open => {
                  if (!open) setMockupDialogItemIdx(null);
                }}
                productImageUrl={
                  reviewItems[mockupDialogItemIdx].product.images?.[0] || ""
                }
                productName={reviewItems[mockupDialogItemIdx].product.name}
                customerCompanyLogo={selectedCustomer?.companyLogo}
                customerName={selectedCustomer?.companyName}
                existingMockup={reviewItems[mockupDialogItemIdx].mockupImage}
                onMockupGenerated={mockupUrl => {
                  updateItem(mockupDialogItemIdx, { mockupImage: mockupUrl });
                }}
                onMockupRemoved={() => {
                  updateItem(mockupDialogItemIdx, { mockupImage: undefined });
                }}
              />
            )}
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        src={lightboxImage}
        alt={lightboxAlt}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
