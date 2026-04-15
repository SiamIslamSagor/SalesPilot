import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  AlertCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import apiService, { type PrintingSheet } from "@/services/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ReactDOMServer from "react-dom/server";
import { markingMethods } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";

const deliveryTimeOptions = [
  "1-2 viikkoa",
  "2-3 viikkoa",
  "3-4 viikkoa",
  "4-6 viikkoa",
  "Sopimuksen mukaan",
];
const sizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

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
  mockupImage?: string;
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
  status: string;
  customerResponse?: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
  salesperson?: string;
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
  variants?: ProductVariant[];
}

interface PrintingSheetData {
  orderDate: string;
  reference: string;
  seller: string;
  deliveryDate: string;
  deliveryTime: string;
  customerName: string;
  printMethod: string;
  printMethodOther: string;
  sizeQuantities: Record<string, string>;
  workInstructions: string;
}

interface SelectedProductData extends OfferItem {
  product: Product;
  printingData: PrintingSheetData;
}

export default function PrintingSheet() {
  const { quoteId, itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Get selected items from navigation state (for multi-product mode)
  const selectedItems = useMemo(
    () => (location.state?.selectedItems as OfferItem[]) || [],
    [location.state],
  );

  // previously saved sheets for this offer
  const [existingSheets, setExistingSheets] = useState<PrintingSheet[]>([]);
  const [deletingSheetGroupId, setDeletingSheetGroupId] = useState<
    string | null
  >(null);
  const loadExistingSheets = useCallback(async () => {
    if (!quoteId) return;
    try {
      const result = await apiService.getPrintingSheets({ offerId: quoteId });
      if (result.success && result.data) {
        setExistingSheets(result.data);
      }
    } catch (error) {
      console.error("Error fetching existing printing sheets:", error);
    }
  }, [quoteId]);

  useEffect(() => {
    loadExistingSheets();
  }, [loadExistingSheets]);

  // Determine if we're in single-product mode (itemId provided) or multi-product mode
  const isSingleProductMode = !!itemId;

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [selectedProductsData, setSelectedProductsData] = useState<
    SelectedProductData[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [downloadingSheetId, setDownloadingSheetId] = useState<string | null>(null);

  // Validation errors state - tracks errors for each product
  const [validationErrors, setValidationErrors] = useState<
    Record<
      number,
      { seller?: string; deliveryTime?: string; printMethod?: string }
    >
  >({});

  // Fetch offer and products
  useEffect(() => {
    const fetchData = async () => {
      if (!quoteId) return;
      setLoading(true);
      try {
        // Fetch offer details
        const offerResult = await apiService.getOfferById(quoteId);
        if (offerResult.success && offerResult.data) {
          setOffer(offerResult.data);
        }

        // Determine which products to fetch based on mode
        let itemsToFetch: OfferItem[] = [];

        if (isSingleProductMode) {
          // Single product mode: fetches specific item from offer
          if (offerResult.success && offerResult.data) {
            const item = offerResult.data.items.find(
              i => i.productId === itemId,
            );
            if (item) {
              itemsToFetch = [item];
            }
          }
        } else {
          // Multi-product mode: use selected items from navigation state
          itemsToFetch = selectedItems;
        }

        // Fetch product details
        const productNumbers = itemsToFetch.map(item => item.productNumber);
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

            // Initialize selected products data
            const initialData: SelectedProductData[] = itemsToFetch.map(
              item => {
                const product = productsMap[item.productNumber];
                return {
                  ...item,
                  product: product || ({} as Product),
                  printingData: {
                    orderDate: new Date().toISOString().split("T")[0],
                    reference: offerResult.data?.customerName || "",
                    seller: user?.name || offerResult.data?.customerName || "",
                    deliveryDate: new Date(
                      Date.now() + 30 * 24 * 60 * 60 * 1000,
                    )
                      .toISOString()
                      .split("T")[0],
                    deliveryTime: "",
                    customerName: offerResult.data?.customerName || "",
                    printMethod: "",
                    printMethodOther: "",
                    sizeQuantities: Object.fromEntries(sizes.map(s => [s, ""])),
                    workInstructions: "",
                  },
                };
              },
            );
            setSelectedProductsData(initialData);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: t("common.error"),
          description: t("printingSheet.errorLoadDescription"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quoteId, itemId, selectedItems, isSingleProductMode, toast, user, t]);

  const updateProductPrintingData = (
    index: number,
    updates: Partial<PrintingSheetData>,
  ) => {
    setSelectedProductsData(prev =>
      prev.map((item, i) =>
        i === index
          ? { ...item, printingData: { ...item.printingData, ...updates } }
          : item,
      ),
    );
  };

  const handleSave = async () => {
    // Validate all products before saving
    const errors: Record<
      number,
      { seller?: string; deliveryTime?: string; printMethod?: string }
    > = {};
    let hasErrors = false;

    selectedProductsData.forEach((item, index) => {
      const productErrors: {
        seller?: string;
        deliveryTime?: string;
        printMethod?: string;
      } = {};

      if (!item.printingData.seller || item.printingData.seller.trim() === "") {
        productErrors.seller = t("printingSheet.validationErrorSeller");
        hasErrors = true;
      }

      if (
        !item.printingData.deliveryTime ||
        item.printingData.deliveryTime.trim() === ""
      ) {
        productErrors.deliveryTime = t(
          "printingSheet.validationErrorDeliveryTime",
        );
        hasErrors = true;
      }

      if (
        !item.printingData.printMethod ||
        item.printingData.printMethod.trim() === ""
      ) {
        productErrors.printMethod = t(
          "printingSheet.validationErrorPrintMethod",
        );
        hasErrors = true;
      }

      if (Object.keys(productErrors).length > 0) {
        errors[index] = productErrors;
      }
    });

    if (hasErrors) {
      setValidationErrors(errors);
      toast({
        title: t("printingSheet.validationErrorToastTitle"),
        description: t("printingSheet.validationErrorToastDescription"),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Generate a unique groupId for all sheets being saved together
      // This allows multi-page PDF generation for sheets created in the same batch
      const groupId = crypto.randomUUID();

      // Prepare printing sheet data for saving
      const printingSheetsData = selectedProductsData.map(item => ({
        productId: item.productId,
        productNumber: item.productNumber,
        productName: item.productName,
        productImage: item.product?.images?.[0] || item.product?.imageUrl,
        mockupImage: item.mockupImage || undefined,
        orderDate: item.printingData.orderDate,
        reference: item.printingData.reference,
        seller: item.printingData.seller,
        deliveryDate: item.printingData.deliveryDate,
        deliveryTime: item.printingData.deliveryTime,
        customerName: item.printingData.customerName,
        printMethod: item.printingData.printMethod,
        printMethodOther: item.printingData.printMethodOther,
        sizeQuantities: item.printingData.sizeQuantities,
        workInstructions: item.printingData.workInstructions,
        totalQuantity: Object.values(item.printingData.sizeQuantities).reduce(
          (s, v) => s + (parseInt(v) || 0),
          0,
        ),
        groupId, // same groupId for all sheets in this batch
      }));

      // send to backend API
      const result = await apiService.savePrintingSheets({
        offerId: quoteId as string,
        sheets: printingSheetsData,
      });

      if (result.success) {
        toast({
          title: t("common.success"),
          description: `${selectedProductsData.length} ${t(
            "printingSheet.sheetsSavedDescription",
          )}`,
        });
        setTimeout(() => {
          navigate(`/orders/create/${quoteId}`);
        }, 1500);
      } else {
        throw new Error(result.message || "API failure");
      }
    } catch (error) {
      console.error("Error saving printing sheets:", error);
      // Check if it's a validation error from backend
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (
        errorMessage.includes("ValidationError") ||
        errorMessage.includes("required")
      ) {
        toast({
          title: t("printingSheet.validationErrorToastTitle"),
          description: t("printingSheet.validationBackendDescription"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("common.error"),
          description: t("printingSheet.errorSaveDescription"),
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Clear validation error for a specific field when user starts typing
  const clearFieldError = (
    index: number,
    field: "seller" | "deliveryTime" | "printMethod",
  ) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors[index]) {
        const fieldErrors = { ...newErrors[index] };
        delete fieldErrors[field];
        if (Object.keys(fieldErrors).length === 0) {
          delete newErrors[index];
        } else {
          newErrors[index] = fieldErrors;
        }
      }
      return newErrors;
    });
  };

  const handlePrint = () => {
    // Print functionality - trigger browser print
    // Add a small delay to ensure all data is rendered
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Helper function to preload all images in a container
  const preloadImages = (container: HTMLElement): Promise<void[]> => {
    const images = container.querySelectorAll("img");
    const promises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continue even if image fails
        // Timeout after 10 seconds
        setTimeout(() => resolve(), 10000);
      });
    });
    return Promise.all(promises);
  };

  // Helper function to inject CSS styles for PDF generation
  const injectPDFStyles = (container: HTMLElement): void => {
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      .border { border: 1px solid #e5e7eb; }
      .border-border { border-color: #e5e7eb; }
      .bg-card { background-color: #ffffff; }
      .bg-muted { background-color: #f3f4f6; }
      .bg-muted\\/50 { background-color: rgba(243, 244, 246, 0.5); }
      .text-muted-foreground { color: #6b7280; }
      .font-semibold { font-weight: 600; }
      .font-bold { font-weight: 700; }
      .font-medium { font-weight: 500; }
      .text-sm { font-size: 0.875rem; }
      .text-xs { font-size: 0.75rem; }
      .text-lg { font-size: 1.125rem; }
      .p-2 { padding: 0.5rem; }
      .p-4 { padding: 1rem; }
      .p-5 { padding: 1.25rem; }
      .mb-1 { margin-bottom: 0.25rem; }
      .mb-2 { margin-bottom: 0.5rem; }
      .mb-3 { margin-bottom: 0.75rem; }
      .mb-4 { margin-bottom: 1rem; }
      .mb-8 { margin-bottom: 2rem; }
      .mt-2 { margin-top: 0.5rem; }
      .gap-2 { gap: 0.5rem; }
      .gap-3 { gap: 0.75rem; }
      .gap-4 { gap: 1rem; }
      .gap-6 { gap: 1.5rem; }
      .gap-x-3 { column-gap: 0.75rem; }
      .gap-y-2 { row-gap: 0.5rem; }
      .grid { display: grid; }
      .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid-cols-[auto_1fr] { grid-template-columns: auto 1fr; }
      .flex { display: flex; }
      .flex-1 { flex: 1 1 0%; }
      .items-center { align-items: center; }
      .justify-center { justify-content: center; }
      .w-16 { width: 4rem; }
      .w-40 { width: 10rem; }
      .w-full { width: 100%; }
      .h-8 { height: 2rem; }
      .h-7 { height: 1.75rem; }
      .h-16 { height: 4rem; }
      .h-full { height: 100%; }
      .h-[360px] { height: 360px; }
      .min-h-[120px] { min-height: 120px; }
      .max-h-full { max-height: 100%; }
      .max-w-full { max-width: 100%; }
      .rounded { border-radius: 0.375rem; }
      .rounded-lg { border-radius: 0.5rem; }
      .border-2 { border-width: 2px; }
      .border-dashed { border-style: dashed; }
      .overflow-hidden { overflow: hidden; }
      .overflow-x-auto { overflow-x: auto; }
      .shrink-0 { flex-shrink: 0; }
      .object-cover { object-fit: cover; }
      .object-contain { object-fit: contain; }
      .whitespace-pre-wrap { white-space: pre-wrap; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-left { text-align: left; }
      .space-y-0\\.5 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.125rem; }
      .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }
      .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
      .table { display: table; }
      .border-collapse { border-collapse: collapse; }
      .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
      .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
      .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
      .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
      .leading-8 { line-height: 2rem; }
      .last\\:mb-0:last-child { margin-bottom: 0; }
      .relative { position: relative; }
      .absolute { position: absolute; }
      .top-2 { top: 0.5rem; }
      .right-2 { right: 0.5rem; }
      .z-10 { z-index: 10; }
    `;
    container.appendChild(styleEl);
  };

  // Helper function to generate sheet HTML with inline styles
  const generateSheetHTML = (sheet: {
    productName?: string;
    productNumber?: string;
    productImage?: string;
    mockupImage?: string;
    orderDate?: string;
    reference?: string;
    seller?: string;
    deliveryDate?: string;
    deliveryTime?: string;
    customerName?: string;
    printMethod?: string;
    printMethodOther?: string;
    sizeQuantities?: Record<string, string>;
    workInstructions?: string;
  }) => {
    const totalQty = Object.values(sheet.sizeQuantities || {}).reduce(
      (s, v) => s + (parseInt(v) || 0),
      0,
    );
    const orderLabel = t("printingSheet.orderDate");
    const referenceLabel = t("printingSheet.reference");
    const sellerLabel = t("printingSheet.seller");
    const deliveryLabel = t("printingSheet.deliveryDate");
    const deliveryTimeLabel = t("printingSheet.deliveryTime");
    const customerLabel = t("common.customer");
    const productLabel = t("common.product");
    const printMethodLabel = t("printingSheet.printMethod");
    const printMethodOtherLabel = t("printingSheet.printMethodOther");
    const sizeLabel = t("products.size");
    const totalLabel = t("common.total");
    const quantityLabel = t("common.quantity");
    const sizeQuantitiesLabel = t("printingSheet.sizeQuantities");
    const workInstructionsLabel = t("printingSheet.workInstructions");
    const productImageLabel = t("printingSheet.productImageLabel");
    const productImageDescription = t("printingSheet.productImageDescription");
    const productMockupArea = t("printingSheet.productMockupArea");
    const workSheetLabel = t("printingSheet.workSheetLabel");

    return `
      <div class="mb-8 bg-card border border-border rounded-lg p-5" style="background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.25rem; margin-bottom: 2rem;">
        <div class="p-4 mb-4" style="padding: 1rem; margin-bottom: 1rem;">
          <div class="flex items-center gap-4" style="display: flex; align-items: center; gap: 1rem;">
            ${
              sheet.productImage
                ? `
              <div class="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden" style="width: 4rem; height: 4rem; background: #f3f4f6; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;">
                <img src="${sheet.productImage}" alt="${sheet.productName}" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" />
              </div>
            `
                : ""
            }
            <div class="flex-1" style="flex: 1;">
              <h3 class="font-semibold text-lg" style="font-weight: 600; font-size: 1.125rem;">${sheet.productName || ""}</h3>
              <p class="text-sm text-muted-foreground" style="font-size: 0.875rem; color: #6b7280;">${sheet.productNumber || ""}</p>
            </div>
          </div>
        </div>

        <div class="p-2 mb-4" style="padding: 0.5rem; margin-bottom: 1rem;">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6" style="display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 1.5rem;">
            <div>
              <h2 class="text-lg font-bold mb-1" style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.25rem;">Brändi vaate</h2>
              <p class="text-sm font-semibold" style="font-size: 0.875rem; font-weight: 600;">${workSheetLabel}</p>
              <div class="text-sm text-muted-foreground mt-2 space-y-0.5" style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
                <p style="margin-top: 0.125rem;">Vaunukatu 11, 20100 Turku</p>
                <p style="margin-top: 0.125rem;">sähköposti: patricia@brandivaate.fi</p>
                <p style="margin-top: 0.125rem;">Y-tunnus: 2912646-7</p>
              </div>
            </div>
            <div class="space-y-3" style="margin-top: 0.75rem;">
              <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center" style="display: grid; grid-template-columns: auto 1fr; column-gap: 0.75rem; row-gap: 0.5rem; align-items: center;">
                <div class="text-sm font-semibold text-right" style="font-size: 0.875rem; font-weight: 600; text-align: right;">${orderLabel}:</div>
                <div class="h-8 leading-8" style="height: 2rem; line-height: 2rem;">${sheet.orderDate || ""}</div>
                <div class="text-sm font-semibold text-right" style="font-size: 0.875rem; font-weight: 600; text-align: right;">${referenceLabel}:</div>
                <div class="h-8 leading-8" style="height: 2rem; line-height: 2rem;">${sheet.reference || ""}</div>
                <div class="text-sm font-semibold text-right" style="font-size: 0.875rem; font-weight: 600; text-align: right;">${sellerLabel}:</div>
                <div class="h-8 leading-8" style="height: 2rem; line-height: 2rem;">${sheet.seller || ""}</div>
                <div class="text-sm font-semibold text-right" style="font-size: 0.875rem; font-weight: 600; text-align: right;">${deliveryLabel}:</div>
                <div class="h-8 leading-8" style="height: 2rem; line-height: 2rem;">${sheet.deliveryDate || ""}</div>
                <div class="text-sm font-semibold text-right" style="font-size: 0.875rem; font-weight: 600; text-align: right;">${deliveryTimeLabel}:</div>
                <div class="h-8 leading-8" style="height: 2rem; line-height: 2rem;">${sheet.deliveryTime || ""}</div>
                <div class="text-sm font-semibold text-right" style="font-size: 0.875rem; font-weight: 600; text-align: right;">${customerLabel}:</div>
                <div class="h-8 leading-8" style="height: 2rem; line-height: 2rem;">${sheet.customerName || ""}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-2 mb-4 space-y-4" style="padding: 0.5rem; margin-bottom: 1rem;">
          <div class="flex items-center gap-4" style="display: flex; align-items: center; gap: 1rem;">
            <div class="text-sm font-semibold w-40" style="font-size: 0.875rem; font-weight: 600; width: 10rem;">${productLabel}</div>
            <div class="flex-1 bg-muted h-8 leading-8" style="flex: 1; background: #f3f4f6; height: 2rem; line-height: 2rem;">${sheet.productNumber || ""} - ${sheet.productName || ""}</div>
          </div>
          <div class="flex items-center gap-4" style="display: flex; align-items: center; gap: 1rem;">
            <div class="text-sm font-semibold w-40" style="font-size: 0.875rem; font-weight: 600; width: 10rem;">${printMethodLabel}</div>
            <div class="flex-1 h-8 leading-8" style="flex: 1; height: 2rem; line-height: 2rem;">${sheet.printMethod || ""}</div>
          </div>
          <div class="flex items-center gap-4" style="display: flex; align-items: center; gap: 1rem;">
            <div class="text-sm font-semibold w-40" style="font-size: 0.875rem; font-weight: 600; width: 10rem;">${printMethodOtherLabel}</div>
            <div class="flex-1 h-8 leading-8" style="flex: 1; height: 2rem; line-height: 2rem;">${sheet.printMethodOther || ""}</div>
          </div>
        </div>

        <div class="p-2 mb-4" style="padding: 0.5rem; margin-bottom: 1rem;">
          <h3 class="text-sm font-semibold mb-3 text-center" style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem; text-align: center;">${sizeQuantitiesLabel}</h3>
          <div class="overflow-x-auto" style="overflow-x: auto;">
            <table class="w-full text-sm border border-border" style="width: 100%; font-size: 0.875rem; border: 1px solid #e5e7eb;">
              <thead>
                <tr class="bg-muted/50" style="background: rgba(243, 244, 246, 0.5);">
                  <th class="border border-border px-2 py-1.5 text-left" style="border: 1px solid #e5e7eb; padding-left: 0.5rem; padding-right: 0.5rem; padding-top: 0.375rem; padding-bottom: 0.375rem; text-align: left;">${sizeLabel}</th>
                  ${sizes
                    .map(
                      s => `
                    <th class="border border-border px-2 py-1.5 text-center min-w-[50px]" style="border: 1px solid #e5e7eb; padding-left: 0.5rem; padding-right: 0.5rem; padding-top: 0.375rem; padding-bottom: 0.375rem; text-align: center; min-width: 50px;">${s}</th>
                  `,
                    )
                    .join("")}
                  <th class="border border-border px-2 py-1.5 text-center" style="border: 1px solid #e5e7eb; padding-left: 0.5rem; padding-right: 0.5rem; padding-top: 0.375rem; padding-bottom: 0.375rem; text-align: center;">${totalLabel}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="border border-border px-2 py-1.5 font-medium" style="border: 1px solid #e5e7eb; padding-left: 0.5rem; padding-right: 0.5rem; padding-top: 0.375rem; padding-bottom: 0.375rem; font-weight: 500;">${quantityLabel}</td>
                  ${sizes
                    .map(
                      s => `
                    <td class="border border-border px-1 py-1" style="border: 1px solid #e5e7eb; padding-left: 0.25rem; padding-right: 0.25rem; padding-top: 0.25rem; padding-bottom: 0.25rem;">
                      <div class="h-7 text-center text-sm w-full min-w-[40px]" style="height: 1.75rem; text-align: center; font-size: 0.875rem; width: 100%; min-width: 40px;">${sheet.sizeQuantities?.[s] || ""}</div>
                    </td>
                  `,
                    )
                    .join("")}
                  <td class="border border-border px-2 py-1.5 text-center font-semibold" style="border: 1px solid #e5e7eb; padding-left: 0.5rem; padding-right: 0.5rem; padding-top: 0.375rem; padding-bottom: 0.375rem; text-align: center; font-weight: 600;">${totalQty}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="p-2" style="padding: 0.5rem;">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6" style="display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 1.5rem;">
            <div>
              <div class="text-sm font-semibold" style="font-size: 0.875rem; font-weight: 600;">${workInstructionsLabel}</div>
              <div class="mt-2 min-h-[120px] whitespace-pre-wrap" style="margin-top: 0.5rem; min-height: 120px; white-space: pre-wrap;">${sheet.workInstructions || ""}</div>
            </div>
            <div>
              <div class="text-sm font-semibold" style="font-size: 0.875rem; font-weight: 600;">${productImageLabel}</div>
              <p class="text-xs text-muted-foreground mb-2" style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.5rem;">${productImageDescription}</p>
              <div class="w-full h-[360px] border-2 border-dashed border-border rounded-lg flex items-center justify-center" style="width: 100%; height: 360px; border: 2px dashed #e5e7eb; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
                ${
                  sheet.mockupImage || sheet.productImage
                    ? `
                  <img src="${sheet.mockupImage || sheet.productImage}" alt="${sheet.productName}" style="max-height: 100%; max-width: 100%; object-fit: contain;" crossorigin="anonymous" />
                `
                    : `<span class="text-sm text-muted-foreground" style="font-size: 0.875rem; color: #6b7280;">${productMockupArea}</span>`
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // export using offscreen container with proper styling and image handling
  const handleExportCurrent = async () => {
    const sheets = selectedProductsData.map(item => ({
      productName: item.productName,
      productNumber: item.productNumber,
      productImage: item.product?.images?.[0] || item.product?.imageUrl,
      mockupImage: item.mockupImage || undefined,
      orderDate: item.printingData.orderDate,
      reference: item.printingData.reference,
      seller: item.printingData.seller,
      deliveryDate: item.printingData.deliveryDate,
      deliveryTime: item.printingData.deliveryTime,
      customerName: item.printingData.customerName,
      printMethod: item.printingData.printMethod,
      printMethodOther: item.printingData.printMethodOther,
      sizeQuantities: item.printingData.sizeQuantities,
      workInstructions: item.printingData.workInstructions,
    }));

    try {
      // create a hidden container offscreen with proper styling
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "-10000px";
      container.style.left = "-10000px";
      container.style.width = "794px"; // A4 width in pixels at 96 DPI
      container.style.backgroundColor = "#ffffff";
      container.style.padding = "0px";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.fontSize = "14px";
      document.body.appendChild(container);

      // Inject CSS styles for PDF generation
      injectPDFStyles(container);

      // Generate HTML with inline styles
      const html = sheets.map(s => generateSheetHTML(s)).join("");
      container.innerHTML = html;

      // Ensure all input values are properly set in DOM before capturing
      const inputs = container.querySelectorAll("input, textarea");
      inputs.forEach(input => {
        const value = input.getAttribute("value");
        if (value !== null) {
          input.setAttribute("value", value);
        }
      });

      // Preload all images before capturing
      await preloadImages(container);

      // Wait additional time for layout
      await new Promise(r => setTimeout(r, 500));

      // Capture with proper CORS and configuration
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true, // Enable CORS for cross-origin images
        allowTaint: true, // Allow tainted canvas
        backgroundColor: "#ffffff", // Prevent black backgrounds
        logging: true, // Enable debugging
        imageTimeout: 15000, // Wait up to 15s for images
        removeContainer: false, // We'll remove it manually
        onclone: clonedDoc => {
          // Ensure values are also set in cloned document
          const clonedContainer = clonedDoc.querySelector(
            'div[style*="position: fixed"]',
          );
          if (clonedContainer) {
            const clonedInputs =
              clonedContainer.querySelectorAll("input, textarea");
            clonedInputs.forEach(input => {
              const value = input.getAttribute("value");
              if (value !== null) {
                input.setAttribute("value", value);
                (input as HTMLInputElement).value = value;
              }
            });
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });

      const margin = 56; // � 20mm margin (good for printing)
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);

      // available area inside margins
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      let imgWidth = contentWidth;
      let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      // prevent overflow
      if (imgHeight > contentHeight) {
        imgHeight = contentHeight;
        imgWidth = (imgProps.width * imgHeight) / imgProps.height;
      }

      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      pdf.save(`printing-sheet-${quoteId || ""}.pdf`);

      // Clean up
      document.body.removeChild(container);
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({
        title: t("common.error"),
        description: t("printingSheet.errorPdfDescription"),
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (sheetId: string) => {
    if (downloadingSheetId) return;
    const element = document.getElementById(`saved-sheet-${sheetId}`);
    if (!element) return;
    setDownloadingSheetId(sheetId);
    try {
      // Ensure all input values are properly set in the DOM before capturing
      const inputs = element.querySelectorAll("input, textarea");
      inputs.forEach(input => {
        // Force the input to render its value by setting it directly
        const value = input.getAttribute("value");
        if (value !== null) {
          input.setAttribute("value", value);
        }
      });

      // Preload all images in the element before capturing
      await preloadImages(element);

      // Wait additional time for layout and value rendering
      await new Promise(r => setTimeout(r, 500));

      // Capture with proper CORS and configuration
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true, // Enable CORS for cross-origin images
        allowTaint: true, // Allow tainted canvas
        backgroundColor: "#ffffff", // Prevent black backgrounds
        logging: true, // Enable debugging
        imageTimeout: 15000, // Wait up to 15s for images
        onclone: clonedDoc => {
          const clonedElement = clonedDoc.getElementById(
            `saved-sheet-${sheetId}`,
          );
          if (clonedElement) {
            const clonedInputs =
              clonedElement.querySelectorAll("input, textarea");
            clonedInputs.forEach(input => {
              const valueAttr = input.getAttribute("value");
              if (valueAttr !== null) {
                input.setAttribute("value", valueAttr);
                (input as HTMLInputElement).value = valueAttr;
              }
            });
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`printing-sheet-${sheetId}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({
        title: t("common.error"),
        description: t("printingSheet.errorPdfDescription"),
        variant: "destructive",
      });
    } finally {
      setDownloadingSheetId(null);
    }
  };
  const handleDeleteGroup = async (groupId: string) => {
    if (!groupId) return;
    setDeletingSheetGroupId(groupId);
    try {
      const result = await apiService.deletePrintingSheetGroup(groupId);
      if (result.success) {
        toast({
          title: t("common.success"),
          description: t("printingSheet.deleteSuccess"),
        });
        await loadExistingSheets();
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
      setDeletingSheetGroupId(prev => (prev === groupId ? null : prev));
    }
  };

  // helper that renders the same sheet layout used for saved sheets
  const renderSheet = (sheet: {
    productName?: string;
    productNumber?: string;
    productImage?: string;
    mockupImage?: string;
    orderDate?: string;
    reference?: string;
    seller?: string;
    deliveryDate?: string;
    deliveryTime?: string;
    customerName?: string;
    printMethod?: string;
    printMethodOther?: string;
    sizeQuantities?: Record<string, string>;
    workInstructions?: string;
  }) => {
    const totalQty = Object.values(sheet.sizeQuantities || {}).reduce(
      (s, v) => s + (parseInt(v) || 0),
      0,
    );
    return (
      <div className="mb-8 bg-card border border-border rounded-lg p-5">
        <div className="p-4 mb-4">
          <div className="flex items-center gap-4">
            {sheet.productImage && (
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={sheet.productImage}
                  alt={sheet.productName}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{sheet.productName}</h3>
              <p className="text-sm text-muted-foreground">
                {sheet.productNumber}
              </p>
            </div>
          </div>
        </div>

        <div className="p-2 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-bold mb-1">Brändi vaate</h2>
              <p className="text-sm font-semibold">
                {t("printingSheet.workSheetLabel")}
              </p>
              <div className="text-sm text-muted-foreground mt-2 space-y-0.5">
                <p>Vaunukatu 11, 20100 Turku</p>
                <p>sähköposti: patricia@brandivaate.fi</p>
                <p>Y-tunnus: 2912646-7</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
                <Label className="text-sm font-semibold text-right">
                  {t("printingSheet.orderDate")}
                </Label>
                <div className="h-8 leading-8">{sheet.orderDate}</div>
                <Label className="text-sm font-semibold text-right">
                  {t("printingSheet.reference")}
                </Label>
                <div className="h-8 leading-8">{sheet.reference}</div>
                <Label className="text-sm font-semibold text-right">
                  {t("printingSheet.seller")}
                </Label>
                <div className="h-8 leading-8">{sheet.seller}</div>
                <Label className="text-sm font-semibold text-right">
                  {t("printingSheet.deliveryDate")}
                </Label>
                <div className="h-8 leading-8">{sheet.deliveryDate}</div>
                <Label className="text-sm font-semibold text-right">
                  {t("printingSheet.deliveryTime")}
                </Label>
                <div className="h-8 leading-8">{sheet.deliveryTime}</div>
                <Label className="text-sm font-semibold text-right">
                  {t("common.customer")}
                </Label>
                <div className="h-8 leading-8">{sheet.customerName}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 mb-4 space-y-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold w-40">
              {t("common.product")}
            </Label>
            <div className="flex-1 bg-muted h-8 leading-8">
              {`${sheet.productNumber} - ${sheet.productName}`}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold w-40">
              {t("printingSheet.printMethod")}
            </Label>
            <div className="flex-1 h-8 leading-8">{sheet.printMethod}</div>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold w-40">
              {t("printingSheet.printMethodOther")}
            </Label>
            <div className="flex-1 h-8 leading-8">{sheet.printMethodOther}</div>
          </div>
        </div>

        <div className="p-2 mb-4">
          <h3 className="text-sm font-semibold mb-3 text-center">
            {t("printingSheet.sizeQuantities")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-2 py-1.5 text-left">
                    {t("products.size")}
                  </th>
                  {sizes.map(s => (
                    <th
                      key={s}
                      className="border border-border px-2 py-1.5 text-center min-w-[50px]"
                    >
                      {s}
                    </th>
                  ))}
                  <th className="border border-border px-2 py-1.5 text-center">
                    {t("common.total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-2 py-1.5 font-medium">
                    {t("common.quantity")}
                  </td>
                  {sizes.map(s => (
                    <td key={s} className="border border-border px-1 py-1">
                      <div className="h-7 text-center text-sm w-full min-w-[40px]">
                        {sheet.sizeQuantities?.[s] || ""}
                      </div>
                    </td>
                  ))}
                  <td className="border border-border px-2 py-1.5 text-center font-semibold">
                    {totalQty}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-semibold">
                {t("printingSheet.workInstructions")}
              </Label>
              <div className="mt-2 min-h-[120px] whitespace-pre-wrap">
                {sheet.workInstructions}
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">
                {t("printingSheet.productImageLabel")}
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                {t("printingSheet.productImageDescription")}
              </p>
              <div className="w-full h-[360px] border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                {sheet.mockupImage || sheet.productImage ? (
                  <img
                    src={sheet.mockupImage || sheet.productImage}
                    alt={sheet.productName}
                    className="max-h-full max-w-full object-contain"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("printingSheet.productMockupArea")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render editable form for a single product
  const renderEditableSheet = (item: SelectedProductData, index: number) => {
    const totalQty = Object.values(item.printingData.sizeQuantities).reduce(
      (s, v) => s + (parseInt(v) || 0),
      0,
    );

    const errors = validationErrors[index] || {};

    return (
      <div
        key={item.productId}
        className="mb-8 bg-card border border-border rounded-lg p-5"
      >
        {/* Validation Error Alert for this product */}
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">
                {item.productName} - {t("printingSheet.missingFieldsTitle")}
              </div>
              <ul className="list-disc list-inside text-sm">
                {errors.seller && <li>{errors.seller}</li>}
                {errors.deliveryTime && <li>{errors.deliveryTime}</li>}
                {errors.printMethod && <li>{errors.printMethod}</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        <div className="p-4 mb-4">
          <div className="flex items-center gap-4">
            {item.product?.images?.[0] && (
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={item.product.images[0]}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{item.productName}</h3>
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
              <p className="text-sm font-semibold">
                {t("printingSheet.workSheetLabel")}
              </p>
              <div className="text-sm text-muted-foreground mt-2 space-y-0.5">
                <p>Vaunukatu 11, 20100 Turku</p>
                <p>sähköposti: patricia@brandivaate.fi</p>
                <p>Y-tunnus: 2912646-7</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
                <Label className="text-sm font-semibold text-right">
                  {t("printingSheet.orderDate")}
                </Label>
                <Input
                  type="date"
                  value={item.printingData.orderDate}
                  onChange={e =>
                    updateProductPrintingData(index, {
                      orderDate: e.target.value,
                    })
                  }
                  className="h-8"
                />
                <Label className="text-sm font-semibold text-right">
                  {t("printingSheet.reference")}
                </Label>
                <Input
                  value={item.printingData.reference}
                  onChange={e =>
                    updateProductPrintingData(index, {
                      reference: e.target.value,
                    })
                  }
                  className="h-8"
                />
                <Label className="text-sm font-semibold text-right">
                  {t("printingSheet.seller")}
                  {errors.seller && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Input
                  value={item.printingData.seller}
                  onChange={e => {
                    updateProductPrintingData(index, {
                      seller: e.target.value,
                    });
                    clearFieldError(index, "seller");
                  }}
                  className={`h-8 ${errors.seller ? "border-destructive ring-1 ring-destructive" : ""}`}
                  placeholder={t("printingSheet.sellerPlaceholder")}
                />
                {errors.seller && (
                  <div className="col-span-2 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.seller}
                  </div>
                )}
                <Label className="text-sm font-semibold text-right">
                  {t("printingSheet.deliveryDate")}
                </Label>
                <Input
                  type="date"
                  value={item.printingData.deliveryDate}
                  onChange={e =>
                    updateProductPrintingData(index, {
                      deliveryDate: e.target.value,
                    })
                  }
                  className="h-8"
                />
                <Label className="text-sm font-semibold text-right">
                  {t("printingSheet.deliveryTime")}
                  {errors.deliveryTime && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Select
                  value={item.printingData.deliveryTime}
                  onValueChange={value => {
                    updateProductPrintingData(index, { deliveryTime: value });
                    clearFieldError(index, "deliveryTime");
                  }}
                >
                  <SelectTrigger
                    className={`h-8 ${errors.deliveryTime ? "border-destructive ring-1 ring-destructive" : ""}`}
                  >
                    <SelectValue
                      placeholder={t(
                        "printingSheet.selectDeliveryTimePlaceholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryTimeOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.deliveryTime && (
                  <div className="col-span-2 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.deliveryTime}
                  </div>
                )}
                <Label className="text-sm font-semibold text-right">
                  {t("common.customer")}
                </Label>
                <Input
                  value={item.printingData.customerName}
                  onChange={e =>
                    updateProductPrintingData(index, {
                      customerName: e.target.value,
                    })
                  }
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 mb-4 space-y-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold w-40">
              {t("common.product")}
            </Label>
            <div className="flex-1 bg-muted h-8 leading-8 px-2">
              {`${item.productNumber} - ${item.productName}`}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold w-40">
              {t("printingSheet.printMethod")}
              {errors.printMethod && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            <Select
              value={item.printingData.printMethod}
              onValueChange={value => {
                updateProductPrintingData(index, {
                  printMethod: value,
                });
                clearFieldError(index, "printMethod");
              }}
            >
              <SelectTrigger
                className={`flex-1 h-8 ${errors.printMethod ? "border-destructive ring-1 ring-destructive" : ""}`}
              >
                <SelectValue
                  placeholder={t("printingSheet.selectPrintMethodPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {markingMethods.map(method => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.printMethod && (
            <div className="flex items-center gap-4 pl-40">
              <div className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.printMethod}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold w-40">
              {t("printingSheet.printMethodOther")}
            </Label>
            <Input
              value={item.printingData.printMethodOther}
              onChange={e =>
                updateProductPrintingData(index, {
                  printMethodOther: e.target.value,
                })
              }
              className="flex-1 h-8"
            />
          </div>
        </div>

        <div className="p-2 mb-4">
          <h3 className="text-sm font-semibold mb-3 text-center">
            {t("printingSheet.sizeQuantities")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-2 py-1.5 text-left">
                    {t("products.size")}
                  </th>
                  {sizes.map(s => (
                    <th
                      key={s}
                      className="border border-border px-2 py-1.5 text-center min-w-[50px]"
                    >
                      {s}
                    </th>
                  ))}
                  <th className="border border-border px-2 py-1.5 text-center">
                    {t("common.total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-2 py-1.5 font-medium">
                    {t("common.quantity")}
                  </td>
                  {sizes.map(s => (
                    <td key={s} className="border border-border px-1 py-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={item.printingData.sizeQuantities[s] || ""}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "" || /^\d+$/.test(v)) {
                            updateProductPrintingData(index, {
                              sizeQuantities: {
                                ...item.printingData.sizeQuantities,
                                [s]: v,
                              },
                            });
                          }
                        }}
                        className="h-7 text-center text-sm w-full min-w-[40px]"
                      />
                    </td>
                  ))}
                  <td className="border border-border px-2 py-1.5 text-center font-semibold">
                    {totalQty}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-semibold">
                {t("printingSheet.workInstructions")}
              </Label>
              <Textarea
                value={item.printingData.workInstructions}
                onChange={e =>
                  updateProductPrintingData(index, {
                    workInstructions: e.target.value,
                  })
                }
                className="mt-2 min-h-[120px]"
                placeholder={t("printingSheet.workInstructionsPlaceholder")}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">
                {t("printingSheet.productImageLabel")}
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                {t("printingSheet.productImageDescription")}
              </p>
              <div className="w-full h-[360px] border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                {item.mockupImage || item.product?.images?.[0] ? (
                  <img
                    src={item.mockupImage || item.product.images[0]}
                    alt={item.productName}
                    crossOrigin="anonymous"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("printingSheet.productMockupArea")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (selectedProductsData.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">
          {t("printingSheet.noProductsSelected")}
        </p>
        <Link to={`/orders/create/${quoteId}`}>
          <Button variant="outline" className="mt-4">
            {t("common.back")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6 sticky top-0 z-10 bg-background py-3 -mx-4 px-4">
        <Link to={`/orders/create/${quoteId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {isSingleProductMode
              ? t("printingSheet.singleTitle")
              : t("printingSheet.multiTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isSingleProductMode
              ? `${t("printingSheet.viewingSheetFor")} ${
                  selectedProductsData[0]?.productName || t("common.product")
                }`
              : `${selectedProductsData.length} ${t(
                  "offers.productsSelected",
                )}`}
          </p>
        </div>
        <div className="flex gap-2">
          {/* <Button variant="outline" onClick={handlePrint}>
            <Printer size={16} className="mr-2" /> Print
          </Button>
          <Button variant="outline" onClick={handleExportCurrent}>
            <Download size={16} className="mr-2" /> PDF
          </Button> */}
          {isSingleProductMode || (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download size={16} className="mr-2" />
              )}
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          )}
        </div>
      </div>

      {/* New Printing sheets section - Editable forms for selected products */}
      {/* Only show when creating new sheets (not when viewing a specific saved sheet) */}
      {!isSingleProductMode && selectedProductsData.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {selectedProductsData.length > 1
              ? t("printingSheet.newSheetsHeadingPlural")
              : t("printingSheet.newSheetsHeadingSingle")}
          </h2>
          {selectedProductsData.map((item, index) =>
            renderEditableSheet(item, index),
          )}
        </div>
      )}

      {/* existing sheets list */}
      {existingSheets.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            {isSingleProductMode
              ? t("printingSheet.savedSheetsHeadingSingle")
              : t("printingSheet.savedSheetsHeadingPlural")}
          </h2>
          {existingSheets
            .filter(sheet => !isSingleProductMode || sheet.productId === itemId)
            .map(sheet => (
              <div key={sheet._id} className="relative">
                {/* download button positioned at top right */}
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(sheet._id!)}
                    disabled={!!downloadingSheetId}
                  >
                    {downloadingSheetId === sheet._id ? (
                      <Loader2 size={14} className="mr-1 animate-spin" />
                    ) : (
                      <Download size={14} className="mr-1" />
                    )}
                    PDF
                  </Button>
                </div>
                <div
                  id={`saved-sheet-${sheet._id}`}
                  className="mb-8 bg-card rounded-lg p-5"
                >
                  {/* replicate full sheet layout using sheet data */}
                  <div className="p-4 mb-4">
                    <div className="flex items-center gap-4">
                      {sheet.productImage && (
                        <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={sheet.productImage}
                            alt={sheet.productName}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {sheet.productName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {sheet.productNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h2 className="text-lg font-bold mb-1">Brändi vaate</h2>
                        <p className="text-sm font-semibold">
                          {t("printingSheet.workSheetLabel")}
                        </p>
                        <div className="text-sm text-muted-foreground mt-2 space-y-0.5">
                          <p>Vaunukatu 11, 20100 Turku</p>
                          <p>sähköposti: patricia@brandivaate.fi</p>
                          <p>Y-tunnus: 2912646-7</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
                          <Label className="text-sm font-semibold text-right -mt-3">
                            {t("printingSheet.orderDate")}:
                          </Label>
                          <div className="h-[38px] bg-muted px-2">
                            {sheet.orderDate || ""}
                          </div>
                          <Label className="text-sm font-semibold text-right -mt-3">
                            {t("printingSheet.reference")}:
                          </Label>
                          <div className="h-[38px] bg-muted px-2">
                            {sheet.reference || ""}
                          </div>
                          <Label className="text-sm font-semibold text-right -mt-3">
                            {t("printingSheet.seller")}:
                          </Label>
                          <div className="h-[38px] bg-muted px-2">
                            {sheet.seller || ""}
                          </div>
                          <Label className="text-sm font-semibold text-right -mt-3">
                            {t("printingSheet.deliveryDate")}:
                          </Label>
                          <div className="h-[38px] bg-muted px-2">
                            {sheet.deliveryDate || ""}
                          </div>
                          <Label className="text-sm font-semibold text-right -mt-3">
                            {t("printingSheet.deliveryTime")}:
                          </Label>
                          <div className="h-[38px] bg-muted px-2">
                            {sheet.deliveryTime || ""}
                          </div>
                          <Label className="text-sm font-semibold text-right -mt-3">
                            {t("common.customer")}:
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
                      <Label className="text-sm font-semibold w-40  -mt-3">
                        {t("common.product")}
                      </Label>
                      <div className="h-[38px] bg-muted px-2">
                        {`${sheet.productNumber} - ${sheet.productName}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-semibold w-40  -mt-3">
                        {t("printingSheet.printMethod")}
                      </Label>
                      <div className="h-[38px] bg-muted px-2">
                        {sheet.printMethod || ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-semibold w-40  -mt-3">
                        {t("printingSheet.printMethodOther")}
                      </Label>
                      <div className="h-[38px] bg-muted px-2">
                        {sheet.printMethodOther || ""}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 mb-4">
                    <h3 className="text-sm font-semibold mb-3 text-center">
                      {t("printingSheet.sizeQuantities")}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-border">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border border-border px-2 py-1.5 text-left">
                              {t("products.size")}
                            </th>
                            {sizes.map(s => (
                              <th
                                key={s}
                                className="border border-border px-2 py-1.5 text-center min-w-[50px]"
                              >
                                {s}
                              </th>
                            ))}
                            <th className="border border-border px-2 py-1.5 text-center">
                              {t("common.total")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-border px-2 py-1.5 font-medium">
                              {t("common.quantity")}
                            </td>
                            {sizes.map(s => (
                              <td
                                key={s}
                                className="border border-border px-1 py-1"
                              >
                                <div className="h-7 text-center text-sm w-full min-w-[40px]">
                                  {sheet.sizeQuantities[s] || ""}
                                </div>
                              </td>
                            ))}
                            <td className="border border-border px-2 py-1.5 text-center font-semibold">
                              {sheet.totalQuantity}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold">
                          {t("printingSheet.workInstructions")}
                        </Label>
                        <div className="mt-2 min-h-[120px] whitespace-pre-wrap bg-muted px-2">
                          {sheet.workInstructions || ""}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">
                          {t("printingSheet.productImageLabel")}
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          {t("printingSheet.productImageDescription")}
                        </p>
                        <div className="w-full h-[360px] border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                          {sheet.mockupImage || sheet.productImage ? (
                            <img
                              src={sheet.mockupImage || sheet.productImage}
                              alt={sheet.productName}
                              crossOrigin="anonymous"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {t("printingSheet.productMockupArea")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-8">
        <Button variant="outline" asChild>
          <Link to={`/orders/create/${quoteId}`}>{t("common.back")}</Link>
        </Button>
      </div>
    </div>
  );
}
