import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  Package,
  FileText,
  Send,
  Loader2,
  Image as ImageIcon,
  Printer,
  Download,
  Trash2,
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
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import apiService, { type PrintingSheet } from "@/services/api";
import OfferItemPickerDialog from "@/components/OfferItemPickerDialog";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { formatEuro } from "@/lib/utils";

interface OfferItem {
  productId: string;
  productNumber: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  markingCost: number;
  internalMarkingCost: number;
  showUnitPrice: boolean;
  showTotalPrice: boolean;
  hideMarkingCost: boolean;
  generateMockup: boolean;
}

interface SpecialCost {
  name: string;
  amount: number;
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
    specialCosts?: SpecialCost[];
  };
  totalAmount: number;
  itemCount: number;
  status: string;
  customerResponse?: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

interface OrderItemData {
  productId: string;
  selectedColor?: string;
  selectedSize?: string;
  printingMethod?: string;
  quantity?: number;
}

interface ProductVariant {
  id?: string;
  size?: string;
  color?: string;
  colorCode?: string;
  sku?: string;
  price?: number;
}

interface Product {
  _id?: string;
  id: string;
  productNumber: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  gender: string;
  fabrics: string;
  purchasePrice: number;
  salesPrice: number;
  margin: number;
  status: "active" | "inactive";
  images: string[];
  imageUrl?: string;
  variants: ProductVariant[];
}

export default function OrderCreate() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [products, setProducts] = useState<Record<string, Product>>({});

  const [items, setItems] = useState<(OfferItem & OrderItemData)[]>([]);
  const [printSheetDialogOpen, setPrintSheetDialogOpen] = useState(false);

  // sheets already stored for this offer
  const [printingSheets, setPrintingSheets] = useState<PrintingSheet[]>([]);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [downloadingGroupId, setDownloadingGroupId] = useState<string | null>(null);

  // map groupId -> sheets (for multi-page PDF generation)
  // Sheets without groupId are treated as individual groups (use _id as fallback groupId)
  const sheetsGroupMap = useMemo(() => {
    const map: Record<string, PrintingSheet[]> = {};
    printingSheets.forEach(sheet => {
      // Use groupId if available, otherwise use _id as fallback for backward compatibility
      const effectiveGroupId = sheet.groupId || sheet._id || sheet.productId;
      if (!map[effectiveGroupId]) map[effectiveGroupId] = [];
      map[effectiveGroupId].push(sheet);
    });
    return map;
  }, [printingSheets]);

  // Also keep productId -> sheets for individual sheet lookups (backward compatibility)
  const sheetsMap = useMemo(() => {
    const map: Record<string, PrintingSheet[]> = {};
    printingSheets.forEach(sheet => {
      if (!map[sheet.productId]) map[sheet.productId] = [];
      map[sheet.productId].push(sheet);
    });
    return map;
  }, [printingSheets]);

  const refreshPrintingSheets = useCallback(async () => {
    if (!quoteId) return;
    try {
      const sheetsRes = await apiService.getPrintingSheets({
        offerId: quoteId,
      });
      if (sheetsRes.success && sheetsRes.data) {
        setPrintingSheets(sheetsRes.data);
      }
    } catch (err) {
      console.error("Error fetching printing sheets:", err);
    }
  }, [quoteId]);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!quoteId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiService.getOfferById(quoteId);
        if (result.success && result.data) {
          setOffer(result.data);

          await refreshPrintingSheets();

          // Initialize items with order data
          setItems(
            result.data.items.map(item => ({
              ...item,
              selectedColor: "",
              selectedSize: "",
              printingMethod: "",
            })),
          );

          // Fetch product details by product numbers
          const productNumbers = result.data.items.map(
            item => item.productNumber,
          );
          if (productNumbers.length > 0) {
            const productsResult = await apiService.fetchProducts({
              productNumbers,
            });
            if (productsResult.success && productsResult.data) {
              const productsMap: Record<string, Product> = {};
              productsResult.data.forEach(product => {
                productsMap[product.productNumber] = product;
              });
              setProducts(productsMap);
            }
          }
        } else {
          setError(result.message || "Failed to fetch offer");
        }
      } catch (err) {
        console.error("Error fetching offer:", err);
        setError("Failed to fetch offer. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [quoteId, refreshPrintingSheets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">
          {error || t("offers.offerNotFound")}
        </p>
        <Link to="/quotes">
          <Button variant="outline" className="mt-4">
            {t("offers.backToOffers")}
          </Button>
        </Link>
      </div>
    );
  }

  if (offer.customerResponse !== "accepted") {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">
          Cannot create order from non-accepted offer
        </p>
        <Link to={`/quotes/${offer._id}`}>
          <Button variant="outline" className="mt-4">
            Back to Offer
          </Button>
        </Link>
      </div>
    );
  }

  const updateItem = (idx: number, updates: Partial<OrderItemData>) => {
    setItems(prev =>
      prev.map((item, i) => (i === idx ? { ...item, ...updates } : item)),
    );
  };

  const handleCreateOrder = async () => {
    setCreating(true);
    try {
      const orderData = {
        offerId: offer._id,
        items: items.map(item => ({
          productId: item.productId,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          printingMethod: item.printingMethod,
          quantity: item.quantity,
        })),
        salesperson: user?.name,
      };

      const result = await apiService.createOrderFromQuote(orderData);
      if (result.success && result.data) {
        navigate(`/orders/confirm/${result.data._id}`);
      } else {
        setError(result.message || "Failed to create order");
      }
    } catch (err) {
      console.error("Error creating order:", err);
      setError("Failed to create order. Please try again later.");
    } finally {
      setCreating(false);
    }
  };

  const handleCreatePrintSheet = (selectedItems: OfferItem[]) => {
    // Navigate to the print sheet page with the selected items
    if (selectedItems.length > 0) {
      navigate(`/orders/create/${quoteId}/print-sheet`, {
        state: { selectedItems },
      });
    }
  };

  // helper to preload images before capturing a sheet
  const preloadImages = (container: HTMLElement): Promise<void[]> => {
    const images = container.querySelectorAll("img");
    const promises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(() => resolve(), 10000);
      });
    });
    return Promise.all(promises);
  };

  // Generate multi-page PDF for a group of sheets
  const handleDownloadGroupPDF = async (groupId: string) => {
    if (downloadingGroupId) return;
    const groupSheets = sheetsGroupMap[groupId];
    if (!groupSheets || groupSheets.length === 0) return;

    setDownloadingGroupId(groupId);
    try {
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 56.7; // 20mm margin
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      // Process each sheet in the group
      for (let i = 0; i < groupSheets.length; i++) {
        const sheet = groupSheets[i];
        const element = document.getElementById(
          `print-sheet-${sheet.productId}`,
        );
        if (!element) continue;

        // Ensure all input values are properly set in DOM before capturing
        const inputs = element.querySelectorAll("input, textarea");
        inputs.forEach(input => {
          const value = input.getAttribute("value");
          if (value !== null) {
            input.setAttribute("value", value);
          }
        });

        // Clone element for offscreen rendering
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.position = "fixed";
        clone.style.top = "-10000px";
        clone.style.left = "-10000px";
        clone.style.display = "block";
        clone.style.visibility = "visible";
        clone.style.backgroundColor = "#ffffff";
        clone.style.width = "794px"; // A4 width at 96 DPI
        clone.style.padding = "20px";
        document.body.appendChild(clone);

        // Preload all images in clone before capturing
        await preloadImages(clone);
        await new Promise(r => setTimeout(r, 300));

        // Capture with proper CORS and configuration
        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 15000,
        });

        // Remove clone
        if (clone.parentNode) {
          document.body.removeChild(clone);
        }

        if (!canvas) {
          console.error(`Failed to create canvas for sheet ${i}`);
          continue;
        }

        // Add new page for all sheets after the first one
        if (i > 0) {
          pdf.addPage();
        }

        const imgData = canvas.toDataURL("image/png");
        const imgProps = pdf.getImageProperties(imgData);

        // Scale image to fit inside margins
        let imgWidth = contentWidth;
        let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        if (imgHeight > contentHeight) {
          imgHeight = contentHeight;
          imgWidth = (imgProps.width * imgHeight) / imgProps.height;
        }

        pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      }

      // Generate filename based on group content
      const productNames = groupSheets.map(s => s.productNumber).join("-");
      const filename =
        groupSheets.length > 1
          ? `printing-sheets-${productNames}.pdf`
          : `printing-sheet-${productNames}.pdf`;

      pdf.save(filename);
    } catch (err) {
      console.error("Error downloading group PDF:", err);
      // Clean up any remaining clones
      const clones = document.querySelectorAll(
        `[style*="position: fixed"][style*="top: -10000px"]`,
      );
      clones.forEach(clone => {
        if (clone.parentNode) {
          document.body.removeChild(clone);
        }
      });
    } finally {
      setDownloadingGroupId(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!groupId) return;
    setDeletingGroupId(groupId);
    try {
      const result = await apiService.deletePrintingSheetGroup(groupId);
      if (result.success) {
        toast({
          title: t("common.success"),
          description: t("printingSheet.deleteSuccess"),
        });
        await refreshPrintingSheets();
      } else {
        toast({
          title: t("common.error"),
          description: result.message || t("printingSheet.deleteError"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting printing sheet group:", error);
      toast({
        title: t("common.error"),
        description: t("printingSheet.deleteError"),
        variant: "destructive",
      });
    } finally {
      setDeletingGroupId(prev => (prev === groupId ? null : prev));
    }
  };

  const handleViewGroup = (groupId: string) => {
    if (!quoteId) return;
    navigate(
      `/orders/create/${quoteId}/printing-sheets/view?groupId=${groupId}`,
    );
  };

  const totalAmount =
    items.reduce((sum, item) => {
      const discounted = item.unitPrice * (1 - item.discount / 100);
      return sum + (discounted + item.markingCost) * item.quantity;
    }, 0) +
    (offer.offerDetails.specialCosts || []).reduce(
      (sum, cost) => sum + (Number(cost.amount) || 0),
      0,
    );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 sticky top-0 z-10 bg-background py-3 -mx-4 px-4">
        <Link to={`/quotes/${offer._id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t("orders.createOrder")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("orders.from")} {offer.offerNumber} · {offer.customerName}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setPrintSheetDialogOpen(true)}
          disabled={items.length === 0}
        >
          <Printer size={16} className="mr-2" /> Create Print Info Sheet
        </Button>
        <Button onClick={handleCreateOrder} disabled={creating}>
          {creating ? (
            <Loader2 className="animate-spin mr-2" size={16} />
          ) : (
            <Send size={16} className="mr-2" />
          )}
          {creating ? "Creating..." : t("orders.createOrder")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {items.map((item, idx) => {
          const product = products[item.productNumber];
          const productImage = product?.images?.[0] || product?.imageUrl;

          // Extract unique colors and sizes from product variants
          const uniqueColors = product?.variants
            ? Array.from(
                new Set(product.variants.map(v => v.color).filter(Boolean)),
              ).sort()
            : [];
          const uniqueSizes = product?.variants
            ? Array.from(
                new Set(product.variants.map(v => v.size).filter(Boolean)),
              ).sort()
            : [];

          return (
            <div
              key={item.productId}
              className="bg-card rounded-lg border border-border p-4 flex flex-col"
            >
              <div className="w-full aspect-[2/2] bg-muted rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                {productImage ? (
                  <img
                    src={productImage}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={40} className="text-muted-foreground/30" />
                )}
              </div>
              <div className="mb-3">
                <p className="font-semibold text-sm">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.productNumber}
                </p>
                {product && (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Category:</span>{" "}
                      {product.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Brand:</span>{" "}
                      {product.brand}
                    </p>
                  </div>
                )}
              </div>

              {/* Product Information Display */}
              <div className="bg-muted/50 rounded-lg p-3 mb-3 space-y-1.5 text-xs">
                {item.showUnitPrice && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span className="font-medium">
                      €{formatEuro(item.unitPrice)}
                    </span>
                  </div>
                )}
                {item.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium text-green-600">
                      -{item.discount}%
                    </span>
                  </div>
                )}
                {!item.hideMarkingCost && item.markingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marking Cost:</span>
                    <span className="font-medium">
                      €{formatEuro(item.markingCost)}
                    </span>
                  </div>
                )}
                {item.showTotalPrice && (
                  <div className="flex justify-between border-t border-border pt-1.5 mt-1.5">
                    <span className="text-muted-foreground">Total Price:</span>
                    <span className="font-bold text-sm">
                      €
                      {formatEuro(
                        (item.unitPrice * (1 - item.discount / 100) +
                          item.markingCost) *
                          item.quantity,
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={item.quantity}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === "" || /^\d+$/.test(v)) {
                        updateItem(idx, {
                          quantity: v === "" ? 0 : parseInt(v) || 0,
                        });
                      }
                    }}
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">
                    {t("orders.quantityLabel")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {uniqueColors.length > 0 ? (
                    <Select
                      value={item.selectedColor || ""}
                      onValueChange={v => updateItem(idx, { selectedColor: v })}
                    >
                      <SelectTrigger className="flex-1 h-8 text-sm">
                        <SelectValue placeholder="Color" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueColors.map(color => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={item.selectedColor || ""}
                      onChange={e =>
                        updateItem(idx, { selectedColor: e.target.value })
                      }
                      placeholder="Color"
                      className="flex-1 h-8 text-sm"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {uniqueSizes.length > 0 ? (
                    <Select
                      value={item.selectedSize || ""}
                      onValueChange={v => updateItem(idx, { selectedSize: v })}
                    >
                      <SelectTrigger className="flex-1 h-8 text-sm">
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueSizes.map(size => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={item.selectedSize || ""}
                      onChange={e =>
                        updateItem(idx, { selectedSize: e.target.value })
                      }
                      placeholder="Size"
                      className="flex-1 h-8 text-sm"
                    />
                  )}
                </div>

                <Select
                  value={item.printingMethod || ""}
                  onValueChange={v => updateItem(idx, { printingMethod: v })}
                >
                  <SelectTrigger className="w-full h-8 text-sm">
                    <SelectValue placeholder="Printing method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Screen Printing">
                      Screen Printing
                    </SelectItem>
                    <SelectItem value="DTG">DTG</SelectItem>
                    <SelectItem value="Heat Transfer">Heat Transfer</SelectItem>
                    <SelectItem value="Embroidery">Embroidery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden div for PDF generation */}
      <div className="hidden">
        {items.map(item => {
          const sheet = sheetsMap[item.productId]?.[0];
          if (!sheet) return null;
          return (
            <div
              key={item.productId}
              id={`print-sheet-${item.productId}`}
              className="bg-white p-5"
            >
              <div className="p-4 mb-4">
                <div className="flex items-center gap-4">
                  {products[item.productNumber]?.images?.[0] && (
                    <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={products[item.productNumber]?.images?.[0]}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {item.productName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.productNumber}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-lg font-bold mb-1">Brändi vaate</h2>
                    <p className="text-sm font-semibold">työkortti</p>
                    <div className="text-sm text-muted-foreground mt-2 space-y-0.5">
                      <p>Vaunukatu 11, 20100 Turku</p>
                      <p>sähköposti: patricia@brandivaate.fi</p>
                      <p>Y-tunnus: 2912646-7</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
                      <Label className="text-sm font-semibold text-right -mt-3">
                        Tilaus pvm:
                      </Label>
                      <div className="h-[38px] bg-muted px-2">
                        {sheet.orderDate || ""}
                      </div>
                      <Label className="text-sm font-semibold text-right -mt-3">
                        Viite:
                      </Label>
                      <div className="h-[38px] bg-muted px-2">
                        {sheet.reference || ""}
                      </div>
                      <Label className="text-sm font-semibold text-right -mt-3">
                        Myyjä:
                      </Label>
                      <div className="h-[38px] bg-muted px-2">
                        {sheet.seller || ""}
                      </div>
                      <Label className="text-sm font-semibold text-right -mt-3">
                        Toimitus aika:
                      </Label>
                      <div className="h-[38px] bg-muted px-2">
                        {sheet.deliveryDate || ""}
                      </div>
                      <Label className="text-sm font-semibold text-right -mt-3">
                        Toimitusaika:
                      </Label>
                      <div className="h-[38px] bg-muted px-2">
                        {sheet.deliveryTime || ""}
                      </div>
                      <Label className="text-sm font-semibold text-right -mt-3">
                        Asiakas:
                      </Label>
                      <div className="h-[38px] bg-muted px-2">
                        {sheet.customerName || ""}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2 mb-4 space-y-4">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-semibold w-40 -mt-3">
                    Tuote
                  </Label>
                  <div className="h-[38px] bg-muted px-2">
                    {`${item.productNumber} - ${item.productName}`}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-semibold w-40 -mt-3">
                    Merkkaus tapa
                  </Label>
                  <div className="h-[38px] bg-muted px-2">
                    {sheet.printMethod || ""}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-semibold w-40 -mt-3">
                    Merkkaus tapa muu
                  </Label>
                  <div className="h-[38px] bg-muted px-2">
                    {sheet.printMethodOther || ""}
                  </div>
                </div>
              </div>

              <div className="p-2 mb-4">
                <h3 className="text-sm font-semibold mb-3 text-center">
                  Koko / KPL
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border border-border px-2 py-1.5 text-left">
                          Koko
                        </th>
                        {[
                          "XS",
                          "S",
                          "M",
                          "L",
                          "XL",
                          "XXL",
                          "3XL",
                          "4XL",
                          "5XL",
                        ].map(s => (
                          <th
                            key={s}
                            className="border border-border px-2 py-1.5 text-center min-w-[50px]"
                          >
                            {s}
                          </th>
                        ))}
                        <th className="border border-border px-2 py-1.5 text-center">
                          Yhteensä
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border px-2 py-1.5 font-medium">
                          Määrä
                        </td>
                        {[
                          "XS",
                          "S",
                          "M",
                          "L",
                          "XL",
                          "XXL",
                          "3XL",
                          "4XL",
                          "5XL",
                        ].map(s => (
                          <td
                            key={s}
                            className="border border-border px-1 py-1"
                          >
                            <div className="h-7 text-center text-sm w-full min-w-[40px]">
                              {sheet.sizeQuantities?.[s] || ""}
                            </div>
                          </td>
                        ))}
                        <td className="border border-border px-2 py-1.5 text-center font-semibold">
                          {Object.values(sheet.sizeQuantities || {}).reduce(
                            (sum, v) => sum + (parseInt(v) || 0),
                            0,
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold">Työohje</Label>
                    <div className="mt-2 min-h-[120px] whitespace-pre-wrap bg-muted px-2">
                      {sheet.workInstructions || ""}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">
                      Tuotekuva logolla
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      (print product pic. here with AI logo)
                    </p>
                    <div className="w-full h-[360px] border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                      {sheet.mockupImage ||
                      sheet.productImage ||
                      products[item.productNumber]?.images?.[0] ? (
                        <img
                          src={
                            sheet.mockupImage ||
                            sheet.productImage ||
                            products[item.productNumber]?.images?.[0]
                          }
                          alt={item.productName}
                          crossOrigin="anonymous"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Product mockup area
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Printing Sheet Summary Section - Grouped by groupId */}
      {Object.keys(sheetsGroupMap).length > 0 && (
        <div className="bg-card rounded-lg border border-border p-5 mb-6">
          <h3 className="text-lg font-semibold mb-4">Printing Sheets</h3>
          <div className="space-y-3">
            {Object.entries(sheetsGroupMap).map(([groupId, groupSheets]) => {
              const isMultiProduct = groupSheets.length > 1;
              return (
                <div key={groupId} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {isMultiProduct ? (
                        <>
                          <p className="font-medium">
                            {groupSheets.map(s => s.productName).join(", ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {groupSheets.length} products in group
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">
                            {groupSheets[0].productName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {groupSheets[0].productNumber}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleDownloadGroupPDF(groupId)}
                        disabled={!!downloadingGroupId}
                      >
                        {downloadingGroupId === groupId ? (
                          <Loader2 size={12} className="mr-1 animate-spin" />
                        ) : (
                          <Download size={12} className="mr-1" />
                        )}
                        Download PDF{" "}
                        {isMultiProduct && `(${groupSheets.length} pages)`}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={() => handleDeleteGroup(groupId)}
                        disabled={deletingGroupId === groupId}
                      >
                        <Trash2 size={12} className="mr-1" />
                        {deletingGroupId === groupId
                          ? t("common.loading")
                          : t("common.delete")}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs p-0"
                      onClick={() => handleViewGroup(groupId)}
                    >
                      <Eye size={14} className="mr-1" />
                      View Group
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-5 mb-6">
        <div className="flex justify-end">
          <div className="text-right">
            {(offer.offerDetails.specialCosts || []).length > 0 && (
              <div className="mb-3 space-y-1">
                {offer.offerDetails.specialCosts?.map((cost, idx) => (
                  <p key={`${cost.name}-${idx}`} className="text-sm">
                    <span className="text-muted-foreground">
                      {cost.name || t("offers.specialCostName")}
                    </span>{" "}
                    €{formatEuro(cost.amount)}
                  </p>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">{t("common.price")}</p>
            <p className="text-2xl font-bold">€{formatEuro(totalAmount)}</p>
          </div>
        </div>
      </div>

      <OfferItemPickerDialog
        open={printSheetDialogOpen}
        onOpenChange={setPrintSheetDialogOpen}
        items={items}
        products={products}
        onCreate={handleCreatePrintSheet}
        existingPrintingSheets={printingSheets}
      />
    </div>
  );
}
