import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { QuoteItem, Quote } from "@/data/mockData";
import {
  ArrowLeft,
  Package,
  Send,
  Trash2,
  Save,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductPickerDialog from "@/components/ProductPickerDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import apiService from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { parseEuroNumber, formatEuro } from "@/lib/utils";

interface SpecialCostInput {
  name: string;
  amount: number;
}

function getItemProductImage(item: Record<string, unknown>) {
  const imageUrl =
    item.imageUrl && typeof item.imageUrl === "string"
      ? item.imageUrl
      : undefined;

  if (imageUrl) {
    return {
      imageUrl,
      images: [imageUrl],
    };
  }

  const images = Array.isArray(item.images)
    ? item.images.filter((image): image is string => typeof image === "string")
    : [];

  return {
    imageUrl: images[0],
    images,
  };
}

// helper to map API offer shape to Quote type used by this component
function mapApiOfferToQuote(api: Record<string, unknown>): Quote {
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
        const { imageUrl, images } = getItemProductImage(item);

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
            images,
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
    status: "draft" as Quote["status"],
    version: 1,
    customerResponse: "pending" as "pending" | "accepted" | "rejected",
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
    customerComments: [],
    respondedAt: "",
  };
}

export default function QuoteDuplicate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [sourceOffer, setSourceOffer] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [validUntil, setValidUntil] = useState("");
  const [additionalTerms, setAdditionalTerms] = useState("");
  const [showTotalPrice, setShowTotalPrice] = useState(true);
  const [specialCosts, setSpecialCosts] = useState<SpecialCostInput[]>([]);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  // Display string map for numeric text inputs to allow intermediate states like "5."
  const [displayValues, setDisplayValues] = useState<Record<string, string>>(
    {},
  );

  // fetch source offer from API when id changes
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiService
      .getOfferById(id)
      .then(res => {
        if (res.success && res.data) {
          const mapped = mapApiOfferToQuote(res.data);
          setSourceOffer(mapped);
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

  // sync form fields when source offer loads
  useEffect(() => {
    if (sourceOffer) {
      setItems(sourceOffer.items.map(i => ({ ...i })));
      setValidUntil(sourceOffer.validUntil || "");
      setAdditionalTerms(sourceOffer.additionalTerms || "");
      setShowTotalPrice(sourceOffer.showTotalPrice);
      setSpecialCosts(sourceOffer.specialCosts || []);
      setDisplayValues({});
    }
  }, [sourceOffer]);

  const updateItem = (index: number, updates: Partial<QuoteItem>) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
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

  const handleNumericKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    allowDecimal: boolean = true,
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
      !e.currentTarget.value.includes(".") &&
      !e.currentTarget.value.includes(",")
    )
      return;
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const itemsSubtotal = items.reduce((sum, item) => {
    const discountedPrice = item.unitPrice * (1 - item.discount / 100);
    return sum + (discountedPrice + item.markingCost) * item.quantity;
  }, 0);

  const specialCostsTotal = specialCosts.reduce(
    (sum, cost) => sum + (Number(cost.amount) || 0),
    0,
  );

  const totalAmount = itemsSubtotal + specialCostsTotal;

  const handleCancel = () => {
    if (sourceOffer) {
      navigate(`/quotes/${sourceOffer.id}`);
    } else {
      navigate("/quotes");
    }
  };

  const handleSave = async (sendEmail: boolean = false) => {
    if (!sourceOffer) return;

    // Validate
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "At least one item is required",
      });
      return;
    }

    if (sendingEmail || saving) return;

    setSaving(true);
    if (sendEmail) {
      setSendingEmail(true);
    }

    try {
      const result = await apiService.createOffer({
        customerId: sourceOffer.customer.id,
        customerName: sourceOffer.customer.companyName,
        contactPerson: sourceOffer.customer.contactPerson,
        email: sourceOffer.customer.email,
        phone: sourceOffer.customer.phone,
        address: sourceOffer.customer.address,
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
          showTotalPrice,
          additionalTerms,
          additionalTermsEnabled: !!additionalTerms,
          specialCosts,
        },
        totalAmount,
        itemCount: items.length,
      });

      if (result.success && result.data) {
        const createdOfferId = String(result.data._id || result.data.offerId);
        if (sendEmail && createdOfferId) {
          const sendResult = await apiService.sendOffer(createdOfferId);
          if (!sendResult.success) {
            toast({
              variant: "destructive",
              title: "Error",
              description: sendResult.message || "Failed to send offer",
            });
            navigate(`/quotes/${createdOfferId}`);
            return;
          }
        }
        toast({
          title: "Success",
          description: sendEmail
            ? "Offer duplicated and email sent successfully!"
            : "Offer duplicated successfully!",
        });
        navigate(`/quotes/${createdOfferId}`);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to duplicate offer",
        });
      }
    } catch (err) {
      console.error("Error saving offer:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to duplicate offer. Please try again.",
      });
    } finally {
      setSaving(false);
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="animate-spin mx-auto h-8 w-8 mb-4" />
        <p className="text-muted-foreground">Loading offer data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive mb-4">{error}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={handleCancel}>
            Back to Offers
          </Button>
        </div>
      </div>
    );
  }

  if (!sourceOffer) {
    return null;
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background -mt-6 pt-6 -mx-6 px-6 pb-4 border-b border-border mb-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Duplicate Offer - {sourceOffer.quoteNumber}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Editing copy of{" "}
            <Link
              to={`/quotes/${sourceOffer.id}`}
              className="text-primary hover:underline"
            >
              {sourceOffer.quoteNumber}
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving || sendingEmail}
          >
            {saving ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving || sendingEmail}
          >
            {sendingEmail ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Send size={16} className="mr-2" />
            )}
            {sendingEmail ? "Sending..." : "Save & Send Email"}
          </Button>
        </div>
      </div>
      </div>

      {/* Customer Information (Read-only) */}
      <div className="bg-muted/50 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Customer Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Company</Label>
            <p className="text-sm">{sourceOffer.customer.companyName}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Contact Person</Label>
            <p className="text-sm">{sourceOffer.customer.contactPerson}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <p className="text-sm">{sourceOffer.customer.email}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Phone</Label>
            <p className="text-sm">{sourceOffer.customer.phone}</p>
          </div>
          <div className="col-span-2">
            <Label className="text-sm font-medium">Address</Label>
            <p className="text-sm">{sourceOffer.customer.address}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("offers.offerItems")}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setProductPickerOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No items added yet. Click "Add Item" to add products to the offer.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">Quantity</th>
                  <th className="text-left p-3 font-medium">Unit Price</th>
                  <th className="text-left p-3 font-medium">Discount %</th>
                  <th className="text-left p-3 font-medium">Marking Cost</th>
                  <th className="text-left p-3 font-medium">
                    {t("offers.internalMarkingCost")}
                  </th>
                  <th className="text-left p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const discountedPrice =
                    item.unitPrice * (1 - item.discount / 100);
                  const total =
                    (discountedPrice + item.markingCost) * item.quantity;
                  const productImage =
                    item.product.images?.[0] || item.imageUrl || undefined;

                  return (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-muted shrink-0">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={item.product.name}
                                className="h-full w-full object-cover"
                                onError={e => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  target.nextElementSibling?.classList.remove(
                                    "hidden",
                                  );
                                }}
                              />
                            ) : null}
                            <Package
                              size={16}
                              className={`text-muted-foreground ${productImage ? "hidden" : ""}`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.product.productNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={item.quantity}
                          onKeyDown={e => handleNumericKeyDown(e, false)}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "");
                            updateItem(index, {
                              quantity: parseInt(val) || 1,
                            });
                          }}
                          className="w-24"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={
                            displayValues[`${index}-unitPrice`] ??
                            item.unitPrice
                          }
                          onKeyDown={e => handleNumericKeyDown(e)}
                          onChange={e => {
                            const v = e.target.value;
                            if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                              const current =
                                displayValues[`${index}-unitPrice`] ??
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
                                [`${index}-unitPrice`]: display,
                              }));
                              updateItem(index, {
                                unitPrice:
                                  display === "" ? 0 : parseEuroNumber(display),
                              });
                            }
                          }}
                          onBlur={() => {
                            const parsed = parseEuroNumber(
                              displayValues[`${index}-unitPrice`] ??
                                String(item.unitPrice),
                            );
                            setDisplayValues(prev => ({
                              ...prev,
                              [`${index}-unitPrice`]: String(parsed),
                            }));
                          }}
                          className="w-24"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={
                            displayValues[`${index}-discount`] ?? item.discount
                          }
                          onKeyDown={e => handleNumericKeyDown(e)}
                          onChange={e => {
                            const v = e.target.value;
                            if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                              const current =
                                displayValues[`${index}-discount`] ??
                                String(item.discount);
                              const display =
                                current === "0" &&
                                v.length > 1 &&
                                !v.startsWith("0.") &&
                                !v.startsWith("0,")
                                  ? v.replace(/^0+/, "") || "0"
                                  : v;
                              setDisplayValues(prev => ({
                                ...prev,
                                [`${index}-discount`]: display,
                              }));
                              const num =
                                display === "" ? 0 : parseEuroNumber(display);
                              updateItem(index, {
                                discount: Math.min(num, 100),
                              });
                            }
                          }}
                          onBlur={() => {
                            const parsed = parseEuroNumber(
                              displayValues[`${index}-discount`] ??
                                String(item.discount),
                            );
                            setDisplayValues(prev => ({
                              ...prev,
                              [`${index}-discount`]: String(parsed),
                            }));
                          }}
                          className="w-20"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={
                            displayValues[`${index}-markingCost`] ??
                            item.markingCost
                          }
                          onKeyDown={e => handleNumericKeyDown(e)}
                          onChange={e => {
                            const v = e.target.value;
                            if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                              const current =
                                displayValues[`${index}-markingCost`] ??
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
                                [`${index}-markingCost`]: display,
                              }));
                              updateItem(index, {
                                markingCost:
                                  display === "" ? 0 : parseEuroNumber(display),
                              });
                            }
                          }}
                          onBlur={() => {
                            const parsed = parseEuroNumber(
                              displayValues[`${index}-markingCost`] ??
                                String(item.markingCost),
                            );
                            setDisplayValues(prev => ({
                              ...prev,
                              [`${index}-markingCost`]: String(parsed),
                            }));
                          }}
                          className="w-24"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={
                            displayValues[`${index}-internalMarkingCost`] ??
                            (item.internalMarkingCost || 0)
                          }
                          onKeyDown={e => handleNumericKeyDown(e)}
                          onChange={e => {
                            const v = e.target.value;
                            if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                              const current =
                                displayValues[`${index}-internalMarkingCost`] ??
                                String(item.internalMarkingCost || 0);
                              const display =
                                current === "0" &&
                                v.length > 1 &&
                                !v.startsWith("0.") &&
                                !v.startsWith("0,")
                                  ? v.replace(/^0+/, "") || "0"
                                  : v;
                              setDisplayValues(prev => ({
                                ...prev,
                                [`${index}-internalMarkingCost`]: display,
                              }));
                              updateItem(index, {
                                internalMarkingCost:
                                  display === "" ? 0 : parseEuroNumber(display),
                              });
                            }
                          }}
                          onBlur={() => {
                            const parsed = parseEuroNumber(
                              displayValues[`${index}-internalMarkingCost`] ??
                                String(item.internalMarkingCost || 0),
                            );
                            setDisplayValues(prev => ({
                              ...prev,
                              [`${index}-internalMarkingCost`]: String(parsed),
                            }));
                          }}
                          className="w-24"
                        />
                      </td>
                      <td className="p-3 font-medium">€{formatEuro(total)}</td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Special Costs Summary */}
        {/* {items.length > 0 && specialCosts.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">
              {t("offers.specialCosts")}
            </h3>
            <div className="space-y-1">
              {specialCosts.map((cost, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {cost.name || t("offers.specialCostName")}
                  </span>
                  <span>+ €{formatEuro((Number(cost.amount) || 0))}</span>
                </div>
              ))}
            </div>
          </div>
        )} */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>{t("offers.specialCosts")}</Label>
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
                  onKeyDown={e => handleNumericKeyDown(e)}
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
                        amount: display === "" ? 0 : parseEuroNumber(display),
                      });
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseEuroNumber(
                      displayValues[`sc-${idx}-amount`] ?? String(cost.amount),
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

        {/* Total */}
        {items.length > 0 && (
          <div className="flex justify-end">
            <div className="bg-muted/50 rounded-lg p-4 w-72">
              <div className="flex justify-between mb-1 text-sm">
                <span className="text-muted-foreground">Items Subtotal:</span>
                <span>€{formatEuro(itemsSubtotal)}</span>
              </div>
              {specialCosts.map((cost, idx) =>
                (Number(cost.amount) || 0) > 0 ? (
                  <div key={idx} className="flex justify-between mb-1 text-sm">
                    <span className="text-muted-foreground">
                      + {cost.name || t("offers.specialCostName")}:
                    </span>
                    <span>€{formatEuro(Number(cost.amount) || 0)}</span>
                  </div>
                ) : null,
              )}
              {specialCostsTotal > 0 && <div className="border-t mt-1 pt-1" />}
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">
                  Total Amount:
                </span>
                <span className="font-bold text-lg">
                  €{formatEuro(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Offer Details */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold">Offer Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="validUntil">Valid Until</Label>
            <Input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="showTotalPrice"
              checked={showTotalPrice}
              onCheckedChange={setShowTotalPrice}
            />
            <Label htmlFor="showTotalPrice">Show Total Price</Label>
          </div>
        </div>
        <div>
          <Label htmlFor="additionalTerms">Additional Terms</Label>
          <Textarea
            id="additionalTerms"
            value={additionalTerms}
            onChange={e => setAdditionalTerms(e.target.value)}
            rows={4}
            placeholder="Enter any additional terms and conditions..."
          />
        </div>
        {/* <div>
          <div className="flex items-center justify-between mb-3">
            <Label>{t("offers.specialCosts")}</Label>
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
                  value={cost.amount}
                  placeholder={t("offers.specialCostAmount")}
                  onKeyDown={e => handleNumericKeyDown(e)}
                  onChange={e => {
                    const val = e.target.value.replace(/[^\d.,]/g, "");
                    updateSpecialCost(idx, {
                      amount: parseEuroNumber(val),
                    });
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
        </div> */}
      </div>

      {/* Product Picker Dialog */}
      {productPickerOpen && (
        <ProductPickerDialog
          open={productPickerOpen}
          onOpenChange={setProductPickerOpen}
          existingProductIds={items.map(i => i.product.id)}
          onAdd={newItems => setItems(prev => [...prev, ...newItems])}
        />
      )}
    </div>
  );
}
