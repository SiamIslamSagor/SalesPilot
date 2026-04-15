import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { QuoteItem, Quote } from "@/data/mockData"; // reuse types for UI
import {
  ArrowLeft,
  Package,
  Send,
  Eye,
  Trash2,
  Copy,
  Save,
  Plus,
  Image as ImageIcon,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductPickerDialog from "@/components/ProductPickerDialog";
import MockupGeneratorDialog from "@/components/MockupGeneratorDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import apiService from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { parseEuroNumber, formatEuro } from "@/lib/utils";

interface SpecialCostInput {
  name: string;
  amount: number;
}

// helper to map API offer shape to Quote type used by this component
function mapApiOfferToQuote(api: Record<string, unknown>): Quote {
  // Map customer comments array - handle both new array format and old string format
  let customerComments: Array<{
    comment: string | undefined;
    timestamp: string;
  }> = [];

  // Check if customerComments exists as array (new format)
  if (api.customerComments && Array.isArray(api.customerComments)) {
    customerComments = (api.customerComments as unknown[]).map(
      (comment: Record<string, unknown>) => ({
        comment: comment.comment as string | undefined,
        timestamp: comment.timestamp
          ? new Date(comment.timestamp as string).toISOString()
          : new Date().toISOString(),
      }),
    );
  }
  // Check if customerComment exists as string (old format) for backward compatibility
  else if (api.customerComment && typeof api.customerComment === "string") {
    customerComments = [
      {
        comment: api.customerComment as string,
        timestamp: api.respondedAt
          ? new Date(api.respondedAt as string).toISOString()
          : new Date().toISOString(),
      },
    ];
  }

  return {
    id: (api._id as string) || (api.offerId as string) || "",
    quoteNumber: (api.offerNumber as string) || "",
    customer: {
      id: (api.customerId as string) || "",
      companyName: (api.customerName as string) || "",
      businessId: (api.businessId as string) || "",
      contactPerson: (api.contactPerson as string) || "",
      phone: (api.phone as string) || "",
      email: (api.email as string) || "",
      address: (api.address as string) || "",
      city: (api.city as string) || "",
      postcode: (api.postcode as string) || "",
      totalSales: 0,
      totalMargin: 0,
      discountPercent: 0,
    },
    items: ((api.items as unknown[]) || []).map(
      (item: Record<string, unknown>) => {
        const imageUrl =
          (item.imageUrl && typeof item.imageUrl === "string"
            ? item.imageUrl
            : undefined) ||
          (item.images && Array.isArray(item.images) && item.images.length > 0
            ? (item.images[0] as string)
            : undefined);
        const productImages =
          item.images && Array.isArray(item.images) && item.images.length > 0
            ? (item.images as string[])
            : imageUrl
              ? [imageUrl]
              : [];

        return {
          id: item.productId as string,
          product: {
            id: item.productId as string,
            productNumber: item.productNumber as string,
            name: item.productName as string,
            description: "",
            category: "",
            brand: "",
            gender: "",
            fabrics: "",
            purchasePrice: 0,
            salesPrice: item.unitPrice as number,
            margin: 0,
            status: "active",
            images: productImages,
            imageUrl,
            variants: [],
            createdAt: "",
            updatedAt: "",
          },
          quantity: item.quantity as number,
          unitPrice: item.unitPrice as number,
          discount: item.discount as number,
          markingCost: item.markingCost as number,
          internalMarkingCost: (item.internalMarkingCost as number) || 0,
          showUnitPrice: item.showUnitPrice as boolean,
          showTotalPrice: item.showTotalPrice as boolean,
          hideMarkingCost: item.hideMarkingCost as boolean,
          generateMockup: item.generateMockup as boolean,
          mockupImage: (item.mockupImage as string) || undefined,
          imageUrl,
        };
      },
    ),
    status:
      ((api.status === "accepted"
        ? "approved"
        : api.status) as Quote["status"]) || "draft",
    version: (api.version as number) || 1,
    customerResponse:
      (api.customerResponse as "pending" | "accepted" | "rejected") ||
      "pending",
    validUntil:
      ((api.offerDetails as Record<string, unknown>)?.validUntil as string) ||
      "",
    additionalTerms:
      ((api.offerDetails as Record<string, unknown>)
        ?.additionalTerms as string) || "",
    showTotalPrice:
      ((api.offerDetails as Record<string, unknown>)
        ?.showTotalPrice as boolean) ?? true,
    specialCosts:
      (((api.offerDetails as Record<string, unknown>)?.specialCosts ||
        []) as SpecialCostInput[]) || [],
    createdAt: (api.createdAt as string) || "",
    updatedAt: (api.updatedAt as string) || "",
    salesperson: (api.salesperson as string) || "",
    totalAmount: (api.totalAmount as number) || 0,
    totalMargin: (api.totalMargin as number) || 0,
    customerComments,
    respondedAt: (api.respondedAt as string) || "",
    accessCode: (api.accessCode as string) || "",
  };
}

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isPrivilegedUser } = useAuth();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [validUntil, setValidUntil] = useState("");
  const [additionalTerms, setAdditionalTerms] = useState("");
  const [showTotalPrice, setShowTotalPrice] = useState(true);
  const [specialCosts, setSpecialCosts] = useState<SpecialCostInput[]>([]);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [mockupDialogItemIdx, setMockupDialogItemIdx] = useState<number | null>(
    null,
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  console.log(quote);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [customerCompanyLogo, setCustomerCompanyLogo] = useState<
    string | undefined
  >();
  // Display string map for numeric text inputs to allow intermediate states like "5."
  const [displayValues, setDisplayValues] = useState<Record<string, string>>(
    {},
  );

  // fetch offer from API when id changes
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiService
      .getOfferById(id)
      .then(res => {
        if (res.success && res.data) {
          const mapped = mapApiOfferToQuote(res.data);
          setQuote(mapped);
          // Fetch customer's company logo for mockup generation
          const customerId = res.data.customerId as string;
          if (customerId) {
            apiService.getCustomerById(customerId).then(custRes => {
              if (custRes.success && custRes.data?.companyLogo) {
                setCustomerCompanyLogo(custRes.data.companyLogo);
              }
            });
          }
        } else {
          setError(res.message || t("offers.offerNotFound"));
        }
      })
      .catch(err => {
        console.error("Error fetching offer:", err);
        setError(t("offers.offerNotFound"));
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  // sync form fields when quote loads
  useEffect(() => {
    if (quote) {
      setItems(quote.items.map(i => ({ ...i })));
      setValidUntil(quote.validUntil || "");
      setAdditionalTerms(quote.additionalTerms || "");
      setShowTotalPrice(quote.showTotalPrice);
      setSpecialCosts(quote.specialCosts || []);
      setHasChanges(false); // Reset changes flag when quote loads
      setDisplayValues({}); // Reset display values when quote loads
    }
  }, [quote]);

  // Check if any changes have been made
  const checkForChanges = () => {
    if (!quote) return false;

    const itemsChanged = JSON.stringify(items) !== JSON.stringify(quote.items);
    const validUntilChanged = validUntil !== (quote.validUntil || "");
    const additionalTermsChanged =
      additionalTerms !== (quote.additionalTerms || "");
    const showTotalPriceChanged = showTotalPrice !== quote.showTotalPrice;
    const specialCostsChanged =
      JSON.stringify(specialCosts) !== JSON.stringify(quote.specialCosts || []);

    return (
      itemsChanged ||
      validUntilChanged ||
      additionalTermsChanged ||
      showTotalPriceChanged ||
      specialCostsChanged
    );
  };

  // Update hasChanges whenever form fields change
  useEffect(() => {
    setHasChanges(checkForChanges());
  }, [items, validUntil, additionalTerms, showTotalPrice, specialCosts, quote]);

  const isEditable = quote
    ? isPrivilegedUser &&
      quote.status !== "completed" &&
      (quote.status === "draft" || quote.customerResponse === "rejected")
    : false;

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">{error}</p>
        <Link to="/quotes">
          <Button variant="outline" className="mt-4">
            {t("offers.backToOffers")}
          </Button>
        </Link>
      </div>
    );
  }

  if (!quote) {
    return null; // should be covered by error/loading above
  }

  const updateItem = (index: number, updates: Partial<QuoteItem>) => {
    if (!isEditable) return;
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  };

  const removeItem = (index: number) => {
    if (!isEditable) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpecialCost = (
    index: number,
    updates: Partial<SpecialCostInput>,
  ) => {
    if (!isEditable) return;
    setSpecialCosts(prev =>
      prev.map((cost, i) => (i === index ? { ...cost, ...updates } : cost)),
    );
  };

  const addSpecialCost = () => {
    if (!isEditable) return;
    setSpecialCosts(prev => [...prev, { name: "", amount: 0 }]);
  };

  const removeSpecialCost = (index: number) => {
    if (!isEditable) return;
    setSpecialCosts(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount =
    items.reduce((sum, item) => {
      const discounted = item.unitPrice * (1 - item.discount / 100);
      return sum + (discounted + item.markingCost) * item.quantity;
    }, 0) +
    specialCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);

  const handleDuplicate = () => {
    if (!quote) return;
    // Navigate to duplicate page - no API call needed
    navigate(`/quotes/duplicate/${quote.id}`);
  };

  const handleSave = async () => {
    if (!quote) return;

    try {
      const result = await apiService.updateOffer(quote.id, {
        items: items.map(item => ({
          productId: item.product.id,
          productNumber: item.product.productNumber,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          markingCost: item.markingCost,
          internalMarkingCost: item.internalMarkingCost || 0,
          showUnitPrice: item.showUnitPrice,
          showTotalPrice: item.showTotalPrice,
          hideMarkingCost: item.hideMarkingCost,
          generateMockup: item.generateMockup,
          mockupImage: item.mockupImage,
        })),
        offerDetails: {
          validUntil,
          additionalTermsEnabled: !!additionalTerms,
          showTotalPrice,
          additionalTerms,
          specialCosts,
        },
      });

      if (result.success && result.data) {
        // Refresh the quote data with updated values
        const refreshed = await apiService.getOfferById(quote.id);
        if (refreshed.success && refreshed.data) {
          const mapped = mapApiOfferToQuote(refreshed.data);
          setQuote(mapped);
        }
        // Show success notification
        setNotification({
          type: "success",
          message: "Offer updated successfully!",
        });
        // Clear notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          type: "error",
          message: result.message || "Failed to update offer",
        });
        // Clear notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error("Error saving offer:", err);
      setNotification({
        type: "error",
        message: "Failed to update offer. Please try again.",
      });
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleResendOffer = async () => {
    if (!quote || sendingEmail) return;
    setSendingEmail(true);

    try {
      const result = await apiService.resendOffer(quote.id);
      if (result.success) {
        // Refresh the offer data
        const refreshed = await apiService.getOfferById(quote.id);
        if (refreshed.success && refreshed.data) {
          const mapped = mapApiOfferToQuote(refreshed.data);
          setQuote(mapped);
        }
        // Show success or warning notification
        if (result.warning) {
          setNotification({
            type: "error",
            message: result.warning,
          });
          setTimeout(() => setNotification(null), 5000);
        } else {
          setNotification({
            type: "success",
            message: "Offer resent successfully! Email sent to customer.",
          });
          setTimeout(() => setNotification(null), 3000);
        }
      } else {
        setNotification({
          type: "error",
          message: result.message || "Failed to resend offer",
        });
        // Clear notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error("Error resending offer:", err);
      setNotification({
        type: "error",
        message: "Failed to resend offer. Please try again.",
      });
      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendOffer = async () => {
    if (!quote || sendingEmail) return;
    setSendingEmail(true);

    try {
      const result = await apiService.sendOffer(quote.id);
      if (result.success) {
        const refreshed = await apiService.getOfferById(quote.id);
        if (refreshed.success && refreshed.data) {
          const mapped = mapApiOfferToQuote(refreshed.data);
          setQuote(mapped);
        }
        if (result.warning) {
          setNotification({
            type: "error",
            message: result.warning,
          });
          setTimeout(() => setNotification(null), 5000);
        } else {
          setNotification({
            type: "success",
            message: t("quoteDetail.offerSent"),
          });
          setTimeout(() => setNotification(null), 3000);
        }
      } else {
        setNotification({
          type: "error",
          message: result.message || t("quoteDetail.failedToSendOffer"),
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error("Error sending offer:", err);
      setNotification({
        type: "error",
        message: t("quoteDetail.failedToSendOfferRetry"),
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414 1.414L9 10.586 7.707 9.293a1 1 0 00-1.414-1.414l-2-2a1 1 0 010-1.414 0l2 2a1 1 0 001.414 1.414zM11 9a1 1 0 10-2 1 1 0 012 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414-1.414l-1.293-1.293a1 1 0 00-1.414 0l-1.293 1.293a1 1 0 001.414 1.414zM10 9a1 1 0 10-2 1 1 0 012 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6 sticky top-0 z-10 bg-background py-3 -mt-3">
        <Link to="/quotes">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{quote.quoteNumber}</h1>
            <span className={`status-badge status-${quote.status}`}>
              {quote.status}
            </span>
            <span className="text-xs text-muted-foreground">
              v{quote.version}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isPrivilegedUser ? (
              <Link
                to={`/customers/${quote.customer.id}`}
                className="text-primary hover:underline"
              >
                {quote.customer.companyName}
              </Link>
            ) : (
              quote.customer.companyName
            )}{" "}
            · {quote.salesperson}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditable && (
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save size={16} className="mr-2" /> Save Changes
            </Button>
          )}
          {isPrivilegedUser && (
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy size={16} className="mr-2" />
              {t("common.duplicate")}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => window.open(`/offers/${quote.accessCode}`, "_blank")}
          >
            <Eye size={16} className="mr-2" /> {t("common.preview")}
          </Button>

          {isPrivilegedUser && quote.status === "draft" ? (
            <Button
              onClick={handleSendOffer}
              disabled={sendingEmail}
              className=" bg-green-100 text-black hover:text-white hover:bg-primary hover:outline-none outline outline-1 outline-primary"
            >
              {sendingEmail ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Send size={16} className="mr-2" />
              )}
              {sendingEmail ? t("common.loading") : t("offers.sendOffer")}
            </Button>
          ) : isPrivilegedUser && quote.customerResponse === "rejected" ? (
            <Button
              onClick={handleResendOffer}
              disabled={sendingEmail}
              className=" bg-green-100 text-black hover:text-white hover:bg-primary hover:outline-none outline outline-1 outline-primary"
            >
              {sendingEmail ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Send size={16} className="mr-2" />
              )}
              {sendingEmail ? t("common.loading") : "Resend Offer"}
            </Button>
          ) : (
            isPrivilegedUser &&
            quote.customerResponse &&
            quote.customerResponse === "accepted" && (
              <Button
                disabled={
                  quote.status === "completed" || quote.status === "expired"
                }
                onClick={() => navigate(`/orders/create/${quote.id}`)}
                className=" bg-green-100 text-black hover:text-white hover:bg-primary hover:outline-none outline outline-1 outline-primary"
              >
                <Send size={16} className="mr-2" /> Create sales order
              </Button>
            )
          )}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("offers.offerItems")}</h2>
          {isEditable && (
            <Button
              variant="outline"
              onClick={() => setProductPickerOpen(true)}
            >
              <Plus size={16} className="mr-2" /> {t("offers.addProduct")}
            </Button>
          )}
        </div>
        {items.map((item, idx) => {
          const discounted = item.unitPrice * (1 - item.discount / 100);
          const lineTotal = (discounted + item.markingCost) * item.quantity;
          const productImage =
            item.product.images?.[0] || item.imageUrl || undefined;
          return (
            <div
              key={item.id}
              className="bg-card rounded-lg border border-border p-4"
            >
              <div className="flex gap-4">
                <div
                  className={`w-28 h-28 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden relative ${productImage ? "cursor-pointer" : ""}`}
                  onClick={() => productImage && setLightboxImage(productImage)}
                >
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <Package
                    size={28}
                    className={`text-muted-foreground/40 ${
                      productImage ? "hidden" : ""
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.product.productNumber}
                      </p>
                    </div>
                    {isEditable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
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
                          displayValues[`${idx}-unitPrice`] ?? item.unitPrice
                        }
                        readOnly={!isEditable}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                            const current =
                              displayValues[`${idx}-unitPrice`] ??
                              String(item.unitPrice);
                            const display =
                              current === "0" &&
                              v.length > 1 &&
                              !v.startsWith("0.") && !v.startsWith("0,")
                                ? v.replace(/^0+/, "") || "0"
                                : v;
                            setDisplayValues(prev => ({
                              ...prev,
                              [`${idx}-unitPrice`]: display,
                            }));
                            updateItem(idx, {
                              unitPrice:
                                display === "" ? 0 : parseEuroNumber(display),
                            });
                          }
                        }}
                        onBlur={() => {
                          const parsed =
                            parseEuroNumber(
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
                        readOnly={!isEditable}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "" || /^\d+$/.test(v)) {
                            updateItem(idx, {
                              quantity: v === "" ? 0 : parseInt(v) || 0,
                            });
                          }
                        }}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {t("offers.discount")}
                      </Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={
                          displayValues[`${idx}-discount`] ?? item.discount
                        }
                        readOnly={!isEditable}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                            const current =
                              displayValues[`${idx}-discount`] ??
                              String(item.discount);
                            const display =
                              current === "0" &&
                              v.length > 1 &&
                              !v.startsWith("0.") && !v.startsWith("0,")
                                ? v.replace(/^0+/, "") || "0"
                                : v;
                            setDisplayValues(prev => ({
                              ...prev,
                              [`${idx}-discount`]: display,
                            }));
                            updateItem(idx, {
                              discount:
                                display === "" ? 0 : parseEuroNumber(display),
                            });
                          }
                        }}
                        onBlur={() => {
                          const parsed =
                            parseEuroNumber(
                              displayValues[`${idx}-discount`] ??
                                String(item.discount),
                            );
                          setDisplayValues(prev => ({
                            ...prev,
                            [`${idx}-discount`]: String(parsed),
                          }));
                        }}
                        className="mt-1 h-8 text-sm"
                      />
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
                        readOnly={!isEditable}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                            const current =
                              displayValues[`${idx}-markingCost`] ??
                              String(item.markingCost);
                            const display =
                              current === "0" &&
                              v.length > 1 &&
                              !v.startsWith("0.") && !v.startsWith("0,")
                                ? v.replace(/^0+/, "") || "0"
                                : v;
                            setDisplayValues(prev => ({
                              ...prev,
                              [`${idx}-markingCost`]: display,
                            }));
                            updateItem(idx, {
                              markingCost:
                                display === "" ? 0 : parseEuroNumber(display),
                            });
                          }
                        }}
                        onBlur={() => {
                          const parsed =
                            parseEuroNumber(
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
                          (item.internalMarkingCost || 0)
                        }
                        readOnly={!isEditable}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                            const current =
                              displayValues[`${idx}-internalMarkingCost`] ??
                              String(item.internalMarkingCost || 0);
                            const display =
                              current === "0" &&
                              v.length > 1 &&
                              !v.startsWith("0.") && !v.startsWith("0,")
                                ? v.replace(/^0+/, "") || "0"
                                : v;
                            setDisplayValues(prev => ({
                              ...prev,
                              [`${idx}-internalMarkingCost`]: display,
                            }));
                            updateItem(idx, {
                              internalMarkingCost:
                                display === "" ? 0 : parseEuroNumber(display),
                            });
                          }
                        }}
                        onBlur={() => {
                          const parsed =
                            parseEuroNumber(
                              displayValues[`${idx}-internalMarkingCost`] ??
                                String(item.internalMarkingCost || 0),
                            );
                          setDisplayValues(prev => ({
                            ...prev,
                            [`${idx}-internalMarkingCost`]: String(parsed),
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
                        disabled={!isEditable}
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
                        disabled={!isEditable}
                        onCheckedChange={v =>
                          updateItem(idx, { showTotalPrice: v })
                        }
                      />
                      <Label className="text-xs">{t("offers.showTotal")}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.hideMarkingCost}
                        disabled={!isEditable}
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
                        disabled={!isEditable}
                        onCheckedChange={v =>
                          updateItem(idx, { generateMockup: v })
                        }
                      />
                      <Label className="text-xs">
                        {t("offers.generateMockup")}
                      </Label>
                    </div>
                    {item.generateMockup && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={item.mockupImage ? "outline" : "secondary"}
                          size="sm"
                          className="text-xs h-7"
                          disabled={!isEditable}
                          onClick={() => setMockupDialogItemIdx(idx)}
                        >
                          <ImageIcon size={12} className="mr-1" />
                          {item.mockupImage
                            ? t("mockup.viewMockup")
                            : t("mockup.generate")}
                        </Button>
                        {item.mockupImage && (
                          <div
                            className="w-8 h-8 rounded border border-green-500 overflow-hidden cursor-pointer"
                            onClick={() => setLightboxImage(item.mockupImage!)}
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
                  </div>

                  {/* Inline mockup image preview */}
                  {item.mockupImage && (
                    <div className="mt-3 p-3 rounded-lg border border-border bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-2">
                        {t("mockup.generatedImage")}
                      </p>
                      <div
                        className="rounded-md border border-border overflow-hidden bg-muted inline-block cursor-pointer"
                        onClick={() => setLightboxImage(item.mockupImage!)}
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

      {/* Offer History */}
      <div className="bg-card rounded-lg border border-border p-5 mb-4">
        <h2 className="text-lg font-semibold mb-4">Offer History</h2>

        {/* Current Version Status */}
        {/* <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium">Current Version</p>
              <p className="text-2xl font-bold">v{quote.version}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <p
                className={`font-semibold ${
                  quote.customerResponse === "accepted"
                    ? "text-green-600"
                    : quote.customerResponse === "rejected"
                      ? "text-destructive"
                      : quote.customerResponse === "pending"
                        ? "text-amber-600"
                        : "text-muted-foreground"
                }`}
              >
                {quote.customerResponse === "accepted"
                  ? "✓ Accepted"
                  : quote.customerResponse === "rejected"
                    ? "✗ Rejected by Customer"
                    : quote.customerResponse === "pending"
                      ? "⏳ Pending"
                      : "Awaiting Response"}
              </p>
            </div>
          </div>
          {quote.respondedAt && quote.customerResponse && (
            <p className="text-xs text-muted-foreground mt-2">
              Responded on {new Date(quote.respondedAt).toLocaleDateString()} at{" "}
              {new Date(quote.respondedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div> */}

        {/* Customer Response History */}
        {quote.customerComments && quote.customerComments.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-3">Response History</p>
            <div className="space-y-3">
              {quote.customerComments.map((comment, index) => (
                <div
                  key={index}
                  className="bg-muted/30 rounded-lg p-3 border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Response #{index + 1}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.timestamp).toLocaleDateString()} at{" "}
                      {new Date(comment.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="sm:flex justify-between">
                    <p className="text-sm">
                      {comment.comment || "No comment provided"}
                    </p>
                    {index === quote.customerComments.length - 1 ||
                      (quote.customerResponse && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded bg-red-100 text-red-700`}
                        >
                          Rejected
                        </span>
                      ))}

                    {index === quote.customerComments.length - 1 &&
                      quote.customerResponse && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            quote.customerResponse === "accepted"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {quote.customerResponse === "accepted"
                            ? "Accepted"
                            : "Rejected"}
                        </span>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Version Info */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            When you resend an offer, a new version is created and the customer
            can respond again. Previous comments are preserved for reference.
          </p>
        </div>
      </div>

      {/* Other details */}
      <div className="bg-card rounded-lg border border-border p-5">
        <h2 className="text-lg font-semibold mb-4">
          {t("offers.otherDetailsSection")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">
              {t("offers.validUntil")}
            </Label>
            <Input
              type="date"
              value={validUntil}
              readOnly={!isEditable}
              onChange={e => setValidUntil(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-3 pt-5">
            <Switch
              checked={showTotalPrice}
              disabled={!isEditable}
              onCheckedChange={setShowTotalPrice}
            />
            <Label className="text-sm">{t("offers.showTotalInOffer")}</Label>
          </div>
        </div>
        <div className="mt-4">
          <Label className="text-xs text-muted-foreground">
            {t("offers.additionalTerms")}
          </Label>
          <Textarea
            value={additionalTerms}
            readOnly={!isEditable}
            onChange={e => setAdditionalTerms(e.target.value)}
            className="mt-1"
            rows={3}
          />
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-xs text-muted-foreground">
              {t("offers.specialCosts")}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSpecialCost}
              disabled={!isEditable}
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
                  readOnly={!isEditable}
                  placeholder={t("offers.specialCostName")}
                  onChange={e =>
                    updateSpecialCost(idx, { name: e.target.value })
                  }
                />
                <Input
                  type="text"
                  inputMode="decimal"
                  value={displayValues[`sc-${idx}-amount`] ?? cost.amount}
                  readOnly={!isEditable}
                  placeholder={t("offers.specialCostAmount")}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                      const current =
                        displayValues[`sc-${idx}-amount`] ??
                        String(cost.amount);
                      const display =
                        current === "0" && v.length > 1 && !v.startsWith("0.") && !v.startsWith("0,")
                          ? v.replace(/^0+/, "") || "0"
                          : v;
                      setDisplayValues(prev => ({
                        ...prev,
                        [`sc-${idx}-amount`]: display,
                      }));
                      updateSpecialCost(idx, {
                        amount: display === "" ? 0 : parseEuroNumber(display),
                      });
                    }
                  }}
                  onBlur={() => {
                    const parsed =
                      parseEuroNumber(
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
                  disabled={!isEditable}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-card rounded-lg border border-border p-5 mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 font-medium">
                {t("offers.offerItems")}
              </th>
              <th className="text-right py-2 font-medium w-24">
                {t("offers.quantity")}
              </th>
              <th className="text-right py-2 font-medium w-32">
                {t("offers.unitPrice")}
              </th>
              <th className="text-right py-2 font-medium w-32">
                {t("offers.totalAmount")}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const discounted = item.unitPrice * (1 - item.discount / 100);
              const effectivePrice = discounted + item.markingCost;
              const lineTotal = effectivePrice * item.quantity;
              return (
                <tr key={idx} className="border-b border-border/50">
                  <td className="py-2">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {item.product.productNumber}
                    </p>
                  </td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">
                    €{formatEuro(effectivePrice)}
                  </td>
                  <td className="text-right py-2">€{formatEuro(lineTotal)}</td>
                </tr>
              );
            })}
            {specialCosts.map((cost, idx) => (
              <tr key={`sc-${idx}`} className="border-b border-border/50">
                <td className="py-2 text-muted-foreground">
                  {cost.name || t("offers.specialCostName")}
                </td>
                <td className="text-right py-2">—</td>
                <td className="text-right py-2">—</td>
                <td className="text-right py-2">
                  €{formatEuro((Number(cost.amount) || 0))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <td
                colSpan={3}
                className="text-right py-3 font-semibold text-base"
              >
                {t("offers.totalAmount")}
              </td>
              <td className="text-right py-3 font-bold text-xl">
                €{formatEuro(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions for approved quotes */}
      {isPrivilegedUser && quote.status === "approved" && (
        <div className="mt-4 flex justify-end gap-3">
          <Link to={`/offers/${quote.id}`}>
            <Button variant="outline" size="lg">
              {t("offers.viewOffer")}
            </Button>
          </Link>
          <Link to={`/orders/create/${quote.id}`}>
            <Button size="lg">{t("offers.createSalesOrder")}</Button>
          </Link>
        </div>
      )}

      <ProductPickerDialog
        open={productPickerOpen}
        onOpenChange={setProductPickerOpen}
        existingProductIds={items.map(i => i.product.id)}
        onAdd={newItems => setItems(prev => [...prev, ...newItems])}
      />

      {/* Mockup Generator Dialog */}
      {mockupDialogItemIdx !== null && items[mockupDialogItemIdx] && (
        <MockupGeneratorDialog
          open={mockupDialogItemIdx !== null}
          onOpenChange={open => {
            if (!open) setMockupDialogItemIdx(null);
          }}
          productImageUrl={
            items[mockupDialogItemIdx].product.images?.[0] ||
            items[mockupDialogItemIdx].imageUrl ||
            ""
          }
          productName={items[mockupDialogItemIdx].product.name}
          customerCompanyLogo={customerCompanyLogo}
          customerName={quote?.customer?.companyName}
          existingMockup={items[mockupDialogItemIdx].mockupImage}
          onMockupGenerated={mockupUrl => {
            updateItem(mockupDialogItemIdx, { mockupImage: mockupUrl });
          }}
          onMockupRemoved={() => {
            updateItem(mockupDialogItemIdx, { mockupImage: undefined });
          }}
        />
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightboxImage(null)}
          >
            <X size={28} />
          </button>
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
