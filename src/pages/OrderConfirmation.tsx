import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Send,
  Eye,
  Loader2,
  Download,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect, useMemo, useCallback } from "react";
import ImageLightbox, { ZoomOverlay } from "@/components/ImageLightbox";
import { useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import apiService, { type PrintingSheet } from "@/services/api";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useAuth } from "@/contexts/AuthContext";
import { formatEuro } from "@/lib/utils";

export interface Order {
  _id: string;
  orderNumber: string;
  offerId: string;
  customerId: string;
  customerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  items: Array<{
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
  }>;
  specialCosts?: Array<{
    name: string;
    amount: number;
  }>;
  totalAmount: number;
  totalMargin: number;
  salesperson?: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

interface OrderConfirmationProps {
  initialOrder?: Order;
  initialSheets?: PrintingSheet[];
  pdfMode?: boolean;
}

export default function OrderConfirmation({
  initialOrder,
  initialSheets,
  pdfMode: propPdfMode,
}: OrderConfirmationProps) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const pdfMode =
    propPdfMode ?? Boolean(new URLSearchParams(location.search).get("autoPdf"));
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isPrivilegedUser } = useAuth();
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [productImages, setProductImages] = useState<Record<string, string>>(
    {},
  );
  const fetchedImagesRef = useRef<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  // Fetch product images for all order items
  useEffect(() => {
    if (!order || !order.items) return;
    const fetchImages = async () => {
      const newImages: Record<string, string> = {};
      await Promise.all(
        order.items.map(async item => {
          if (item.productId && !fetchedImagesRef.current[item.productId]) {
            try {
              const res = await apiService.fetchProductById(item.productId);
              if (res.success && res.data) {
                const img =
                  res.data.imageUrl || (res.data.images && res.data.images[0]);
                if (img) {
                  newImages[item.productId] = img;
                  fetchedImagesRef.current[item.productId] = true;
                }
              }
            } catch {
              console.log("failed to fetch images");
            }
          }
        }),
      );
      if (Object.keys(newImages).length > 0) {
        setProductImages(prev => ({ ...prev, ...newImages }));
      }
    };
    fetchImages();
  }, [order]);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState<string | null>(null);
  const [printingSheets, setPrintingSheets] = useState<PrintingSheet[]>(
    initialSheets || [],
  );
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [sheetsLoading, setSheetsLoading] = useState(!initialSheets);
  const loadPrintingSheets = useCallback(async () => {
    if (!orderId) return;
    setSheetsLoading(true);
    try {
      const result = await apiService.getPrintingSheets({ orderId });
      if (result.success && result.data) {
        setPrintingSheets(result.data);
      }
    } catch (err) {
      console.error("Error fetching printing sheets:", err);
    } finally {
      setSheetsLoading(false);
    }
  }, [orderId]);
  const [downloadingGroupId, setDownloadingGroupId] = useState<string | null>(
    null,
  );
  const [sendingToPress, setSendingToPress] = useState(false);
  const [sendingConfirmation, setSendingConfirmation] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<
    "completed" | "cancelled" | null
  >(null);
  const [pendingStatus, setPendingStatus] = useState<
    "pending" | "processing" | "completed" | "cancelled" | null
  >(null);

  const confirmStatusUpdate = (
    status: "pending" | "processing" | "completed" | "cancelled",
  ) => {
    setPendingStatus(status);
  };

  const handleStatusUpdate = async (
    newStatus: "pending" | "processing" | "completed" | "cancelled",
  ) => {
    if (!order) return;
    setUpdatingStatus(newStatus as "completed" | "cancelled");
    try {
      const result = await apiService.updateOrderStatus(order._id, newStatus);
      if (result.success) {
        setOrder(prev => (prev ? { ...prev, status: newStatus } : prev));
        toast({
          title: t("common.success"),
          description: t("orders.statusUpdateSuccess"),
        });
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
    } finally {
      setUpdatingStatus(null);
    }
  };

  useEffect(() => {
    if (initialOrder) return;
    const fetchOrder = async () => {
      if (!orderId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiService.getOrderById(orderId);
        if (result.success && result.data) {
          setOrder(result.data);
        } else {
          setError(result.message || t("orderConfirmation.failedToFetchOrder"));
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(t("orderConfirmation.failedToFetchOrderRetry"));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, initialOrder, t]);

  useEffect(() => {
    if (initialSheets) return;
    loadPrintingSheets();
  }, [initialSheets, loadPrintingSheets]);

  // Group printing sheets by groupId for display
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

  // helper to preload images before capturing a sheet or page
  const preloadImages = useCallback(
    (container: HTMLElement): Promise<void[]> => {
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
    },
    [],
  );

  // generate PDF of whole order confirmation section
  const generateOrderPDF = useCallback(async () => {
    if (!order) return;
    const element = document.getElementById("order-confirmation-content");
    if (!element) return;
    try {
      await preloadImages(element);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 56.7;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL("image/png");
      const imgProps = pdf.getImageProperties(imgData);
      let imgWidth = pageWidth - margin * 2;
      let imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      if (imgHeight > pageHeight - margin * 2) {
        imgHeight = pageHeight - margin * 2;
        imgWidth = (imgProps.width * imgHeight) / imgProps.height;
      }
      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      pdf.save(`order-${order.orderNumber}.pdf`);
      // close window if opened separately
      if (window.opener) {
        window.close();
      }
    } catch (err) {
      console.error("Error generating order PDF:", err);
    }
  }, [order, preloadImages]);

  // check URL params for automatic order export
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const autoPdf = params.get("autoPdf");
    if (order && autoPdf) {
      // give page some time to render
      setTimeout(() => {
        generateOrderPDF();
      }, 300);
    }
  }, [location.search, order, generateOrderPDF]);
  // Handle download for grouped or single printing sheets
  // Generates PDF locally rather than navigating to a new page
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
        await loadPrintingSheets();
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

  const handleSendToPress = async () => {
    if (!order) return;
    setSendingToPress(true);
    try {
      const result = await apiService.updateOrderStatus(
        order._id,
        "processing",
      );
      if (result.success) {
        toast({
          title: t("common.success"),
          description: t("orderConfirmation.orderSentToPress"),
        });
        navigate("/orders");
        return;
      } else {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description:
            result.message || t("orderConfirmation.failedToSendOrderToPress"),
        });
      }
    } catch (err) {
      console.error("Error sending to press:", err);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("orderConfirmation.failedToSendOrderToPressRetry"),
      });
    } finally {
      setSendingToPress(false);
    }
  };

  const handleSendConfirmation = async () => {
    if (!order) return;
    if (!order.email) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("orderConfirmation.noCustomerEmail"),
      });
      return;
    }
    setSendingConfirmation(true);
    try {
      const result = await apiService.sendOrderConfirmationEmail(order._id);
      if (result.success) {
        toast({
          title: t("common.success"),
          description: `${t("orderConfirmation.orderConfirmationEmailSent")} ${order.email}`,
        });
        navigate("/orders");
        return;
      } else {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description:
            result.message ||
            t("orderConfirmation.failedToSendOrderConfirmation"),
        });
      }
    } catch (err) {
      console.error("Error sending confirmation:", err);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("orderConfirmation.failedToSendOrderConfirmationRetry"),
      });
    } finally {
      setSendingConfirmation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">
          {t("common.loading")}
        </span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">
          {error || t("orderConfirmation.orderNotFound")}
        </p>
        <Link to="/orders">
          <Button variant="outline" className="mt-4">
            {t("common.back")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      id="order-confirmation-content"
      className="max-w-3xl mx-auto"
      style={
        pdfMode
          ? {
              fontSize: "15px",
              lineHeight: "1.6",
              color: "#111111",
            }
          : undefined
      }
    >
      <div
        className={`flex items-center gap-3 mb-6${!pdfMode ? " sticky top-0 z-10 bg-background py-3 -mx-4 px-4" : ""}`}
      >
        {!pdfMode && (
          <Link to="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
        )}
        <h1
          className="text-2xl font-bold"
          style={
            pdfMode ? { fontSize: "22px", marginBottom: "8px" } : undefined
          }
        >
          {t("orders.orderDetails")}
        </h1>
      </div>

      {/* Customer Details Section */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {!pdfMode && <Package size={18} />}
          {t("orderConfirmation.customerDetails")}
        </h2>
        <div
          className={
            pdfMode
              ? "grid grid-cols-2 gap-4"
              : "grid grid-cols-1 md:grid-cols-2 gap-4"
          }
        >
          <div>
            <Label className="text-xs text-muted-foreground">
              {t("orderConfirmation.customerName")}
            </Label>
            <p className="font-medium mt-1">{order.customerName}</p>
          </div>
          {order.contactPerson && (
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("common.contactPerson")}
              </Label>
              <p className="font-medium mt-1">{order.contactPerson}</p>
            </div>
          )}
          {order.email && (
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("common.email")}
              </Label>
              <p className="font-medium mt-1">{order.email}</p>
            </div>
          )}
          {order.phone && (
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("common.phone")}
              </Label>
              <p className="font-medium mt-1">{order.phone}</p>
            </div>
          )}
          {order.address && (
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">
                {t("common.address")}
              </Label>
              <p className="font-medium mt-1">{order.address}</p>
            </div>
          )}
        </div>
      </div>

      {!pdfMode && (
        <div className="bg-card rounded-lg border border-border p-5 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {t("orders.printSheets")}
          </h3>
          {sheetsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">
                {t("common.loadingPrintingSheets")}
              </span>
            </div>
          ) : Object.entries(sheetsGroupMap).length > 0 ? (
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
                              {groupSheets.length}{" "}
                              {t("orderConfirmation.productsInGroup")}
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
                          {t("orderConfirmation.downloadPdf")}{" "}
                          {isMultiProduct &&
                            `(${groupSheets.length} ${t("orderConfirmation.pages")})`}
                        </Button>
                        {isPrivilegedUser && (
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
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs p-0"
                        onClick={() => {
                          // Navigate to the view page with groupId parameter
                          navigate(
                            `/orders/${order._id}/printing-sheets/view?groupId=${groupId}`,
                          );
                        }}
                      >
                        <Eye size={14} className="mr-1" />
                        {t("orderConfirmation.viewDetails")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("orders.noPrintSheets")}
            </p>
          )}
        </div>
      )}

      {/* hidden sheets markup for PDF generation */}
      <div className="hidden">
        {printingSheets.map(sheet => (
          <div
            key={sheet.productId}
            id={`print-sheet-${sheet.productId}`}
            className="bg-white p-5"
          >
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
                  <h2 className="text-lg font-bold mb-1">
                    {t("orderConfirmation.brandiVaate")}
                  </h2>
                  <p className="text-sm font-semibold">
                    {t("orderConfirmation.workCard")}
                  </p>
                  <div className="text-sm text-muted-foreground mt-2 space-y-0.5">
                    <p>{t("orderConfirmation.address")}</p>
                    <p>{t("orderConfirmation.email")}</p>
                    <p>{t("orderConfirmation.businessId")}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
                    <Label className="text-sm font-semibold text-right -mt-3">
                      {t("orderConfirmation.orderDate")}
                    </Label>
                    <div className="h-[38px] bg-muted px-2">
                      {sheet.orderDate || ""}
                    </div>
                    <Label className="text-sm font-semibold text-right -mt-3">
                      {t("orderConfirmation.reference")}
                    </Label>
                    <div className="h-[38px] bg-muted px-2">
                      {sheet.reference || ""}
                    </div>
                    <Label className="text-sm font-semibold text-right -mt-3">
                      {t("orderConfirmation.seller")}
                    </Label>
                    <div className="h-[38px] bg-muted px-2">
                      {sheet.seller || ""}
                    </div>
                    <Label className="text-sm font-semibold text-right -mt-3">
                      {t("orderConfirmation.deliveryDate")}
                    </Label>
                    <div className="h-[38px] bg-muted px-2">
                      {sheet.deliveryDate || ""}
                    </div>
                    <Label className="text-sm font-semibold text-right -mt-3">
                      {t("orderConfirmation.deliveryTime")}
                    </Label>
                    <div className="h-[38px] bg-muted px-2">
                      {sheet.deliveryTime || ""}
                    </div>
                    <Label className="text-sm font-semibold text-right -mt-3">
                      {t("orderConfirmation.customer")}
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
                  {t("orderConfirmation.product")}
                </Label>
                <div className="h-[38px] bg-muted px-2">
                  {`${sheet.productNumber} - ${sheet.productName}`}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Label className="text-sm font-semibold w-40 -mt-3">
                  {t("orderConfirmation.printingMethod")}
                </Label>
                <div className="h-[38px] bg-muted px-2">
                  {sheet.printMethod || ""}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Label className="text-sm font-semibold w-40 -mt-3">
                  {t("orderConfirmation.printingMethodOther")}
                </Label>
                <div className="h-[38px] bg-muted px-2">
                  {sheet.printMethodOther || ""}
                </div>
              </div>
            </div>

            <div className="p-2 mb-4">
              <h3 className="text-sm font-semibold mb-3 text-center">
                {t("orderConfirmation.sizeQty")}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border px-2 py-1.5 text-left">
                        {t("orderConfirmation.size")}
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
                        {t("orderConfirmation.total")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border px-2 py-1.5 font-medium">
                        {t("orderConfirmation.quantity")}
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
                        <td key={s} className="border border-border px-1 py-1">
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
                  <Label className="text-sm font-semibold">
                    {t("orderConfirmation.workInstructions")}
                  </Label>
                  <div className="mt-2 min-h-[120px] whitespace-pre-wrap bg-muted px-2">
                    {sheet.workInstructions || ""}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    {t("orderConfirmation.productImageWithLogo")}
                  </Label>
                  <div className="w-full h-[360px] border-2 border-dashed border-border rounded-lg flex items-center justify-center mt-2">
                    {sheet.mockupImage || sheet.productImage ? (
                      <img
                        src={sheet.mockupImage || sheet.productImage}
                        alt={sheet.productName}
                        crossOrigin="anonymous"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        {t("orderConfirmation.printProductPic")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* full order information */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">
          {t("orders.orderDetails")}
        </h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>{t("orders.orderNumber")}:</strong> {order.orderNumber}
          </p>
          <p>
            <strong>{t("common.status")}:</strong>{" "}
            <span
              className={`status-badge ${
                order.status === "completed"
                  ? "status-completed"
                  : order.status === "processing"
                    ? "status-sent"
                    : order.status === "cancelled"
                      ? "status-cancelled"
                      : "status-draft"
              }`}
            >
              {t(`orders.status.${order.status}`)}
            </span>
          </p>
          {order.salesperson && (
            <p>
              <strong>{t("offers.salesperson")}:</strong> {order.salesperson}
            </p>
          )}
          <p>
            <strong>{t("common.created")}:</strong>{" "}
            {new Date(order.createdAt).toLocaleString("de-DE")}
          </p>
          <p>
            <strong>{t("common.updated")}:</strong>{" "}
            {new Date(order.updatedAt).toLocaleString("de-DE")}
          </p>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {t("orderConfirmation.lineItems")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left">{t("common.item")}</th>
                  <th className="text-right">{t("common.qty")}</th>
                  <th className="text-right">{t("common.price")}</th>
                  <th className="text-right">{t("common.discount")}</th>
                  <th className="text-right">{t("orders.markingCost")}</th>
                  <th className="text-right">{t("common.total")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items.map(i => {
                  const lineTotal =
                    i.unitPrice * i.quantity * (1 - i.discount / 100) +
                    i.markingCost * i.quantity;
                  return (
                    <tr key={i.productId}>
                      <td className="flex items-center gap-2 py-2">
                        {productImages[i.productId] && (
                          <div
                            style={{
                              position: "relative",
                              width: 60,
                              height: 60,
                            }}
                            className="group"
                            onClick={() =>
                              setLightboxImage(productImages[i.productId])
                            }
                          >
                            <img
                              src={productImages[i.productId]}
                              alt={i.productName}
                              style={{
                                width: 60,
                                height: 60,
                                objectFit: "cover",
                                borderRadius: 6,
                                border: "1px solid #eee",
                                cursor: "pointer",
                              }}
                            />
                            <div style={{ position: "absolute", inset: 0 }}>
                              <ZoomOverlay />
                            </div>
                          </div>
                        )}
                        <span>{i.productName}</span>
                      </td>
                      <td className="text-right">{i.quantity}</td>
                      <td className="text-right">€{formatEuro(i.unitPrice)}</td>
                      <td className="text-right">{i.discount}%</td>
                      <td className="text-right">
                        €{formatEuro(i.markingCost)}
                      </td>
                      <td className="text-right font-medium">
                        €{formatEuro(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
                {(order.specialCosts || []).map((cost, idx) => (
                  <tr key={`special-cost-${idx}`}>
                    <td>{cost.name || t("offers.specialCostName")}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="text-right font-medium">
                      €{formatEuro(cost.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{t("common.total")}</h2>
            <div className="border-t border-border mt-4 pt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  {t("orderConfirmation.totalAmount")}
                </span>
                <span className="text-xl font-bold">
                  €{formatEuro(order.totalAmount)}
                </span>
              </div>
              {!pdfMode && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    {t("orderConfirmation.totalMargin")}
                  </span>
                  <span className="text-xl font-bold text-success">
                    €{formatEuro(order.totalMargin)}
                  </span>
                </div>
              )}
            </div>
            {!pdfMode && (
              <div className="border-t border-border mt-3 pt-3 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/quotes/${order.offerId}`)}
                >
                  <Eye size={14} className="mr-2" />
                  {t("orders.viewOffer")}
                </Button>
                {isPrivilegedUser && order.status === "pending" && (
                  <Button
                    className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                    onClick={handleSendConfirmation}
                    disabled={sendingConfirmation}
                  >
                    {sendingConfirmation ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={14} />
                        {t("orderConfirmation.sending")}
                      </>
                    ) : (
                      <>
                        <Send size={14} className="mr-2" />
                        {t("orders.sendOrderConfirmation")}
                      </>
                    )}
                  </Button>
                )}
                {isPrivilegedUser && order.status === "processing" && (
                  <Button
                    className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                    onClick={() => confirmStatusUpdate("completed")}
                    disabled={updatingStatus !== null}
                  >
                    {updatingStatus === "completed" ? (
                      <Loader2 className="animate-spin mr-2" size={14} />
                    ) : null}
                    {t("orders.completeOrder")}
                  </Button>
                )}
                {isPrivilegedUser &&
                  order.status !== "completed" &&
                  order.status !== "cancelled" && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => confirmStatusUpdate("cancelled")}
                      disabled={updatingStatus !== null}
                    >
                      {updatingStatus === "cancelled" ? (
                        <Loader2 className="animate-spin mr-2" size={14} />
                      ) : null}
                      {t("orders.cancelOrder")}
                    </Button>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={!!pendingStatus}
        onOpenChange={open => {
          if (!open) setPendingStatus(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("orders.statusChangeConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus &&
                t("orders.statusChangeConfirmDescription").replace(
                  "{{status}}",
                  t(`orders.status.${pendingStatus}`),
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingStatus) {
                  handleStatusUpdate(pendingStatus);
                  setPendingStatus(null);
                }
              }}
              className={
                pendingStatus === "cancelled"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Lightbox for product images — must be outside table for valid HTML */}
      <ImageLightbox
        src={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
