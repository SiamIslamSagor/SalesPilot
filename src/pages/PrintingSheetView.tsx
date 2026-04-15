import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import apiService, { type PrintingSheet } from "@/services/api";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const sizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

export default function PrintingSheetView() {
  const { orderId, quoteId } = useParams();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("groupId");
  const { toast } = useToast();
  const { t } = useLanguage();
  const backLink = orderId
    ? `/orders/confirm/${orderId}`
    : quoteId
      ? `/orders/create/${quoteId}`
      : "/orders";

  const [loading, setLoading] = useState(true);
  const [printingSheets, setPrintingSheets] = useState<PrintingSheet[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchSheets = async () => {
      if (!groupId || (!orderId && !quoteId)) return;
      setLoading(true);
      try {
        const params = orderId ? { orderId } : { offerId: quoteId as string };
        const result = await apiService.getPrintingSheets(params);
        if (result.success && result.data) {
          // Filter sheets by groupId
          const groupSheets = result.data.filter(
            sheet => sheet.groupId === groupId,
          );
          setPrintingSheets(groupSheets);
        }
      } catch (error) {
        console.error("Error fetching printing sheets:", error);
        toast({
          title: "Error",
          description: "Failed to load printing sheets. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSheets();
  }, [orderId, quoteId, groupId, toast]);

  // Helper to preload images before capturing a sheet
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

  // Handle download for all sheets in the group
  const handleDownloadPDF = async () => {
    if (printingSheets.length === 0) return;

    setDownloading(true);
    try {
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 56.7; // 20mm margin
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      // Process each sheet in the group
      for (let i = 0; i < printingSheets.length; i++) {
        const sheet = printingSheets[i];
        const element = document.getElementById(
          `print-sheet-view-${sheet.productId}`,
        );
        if (!element) continue;

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
      const productNames = printingSheets.map(s => s.productNumber).join("-");
      const filename =
        printingSheets.length > 1
          ? `printing-sheets-${productNames}.pdf`
          : `printing-sheet-${productNames}.pdf`;

      pdf.save(filename);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
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
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">
          {t("common.loadingPrintingSheets")}
        </span>
      </div>
    );
  }

  if (printingSheets.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to={backLink}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Printing Sheets</h1>
        </div>
        <p className="text-muted-foreground text-center py-20">
          No printing sheets found for this group.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to={backLink}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Printing Sheets</h1>
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="gap-2"
        >
          {downloading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Downloading...
            </>
          ) : (
            <>
              <Download size={16} />
              Download PDF ({printingSheets.length}{" "}
              {printingSheets.length === 1 ? "page" : "pages"})
            </>
          )}
        </Button>
      </div>

      {/* Display sheets */}
      <div className="space-y-8">
        {printingSheets.map((sheet, index) => (
          <div
            key={sheet.productId}
            className="bg-card rounded-lg border border-border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Sheet {index + 1} of {printingSheets.length}
              </h2>
            </div>

            {/* Sheet content - read-only view */}
            <div
              id={`print-sheet-view-${sheet.productId}`}
              className="bg-white p-5 rounded"
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
                    {`${sheet.productNumber} - ${sheet.productName}`}
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
                        {sizes.map(size => (
                          <th
                            key={size}
                            className="border border-border px-2 py-1.5 text-center min-w-[50px]"
                          >
                            {size}
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
                        {sizes.map(size => (
                          <td
                            key={size}
                            className="border border-border px-1 py-1"
                          >
                            <div className="h-7 text-center text-sm w-full min-w-[40px]">
                              {sheet.sizeQuantities?.[size] || ""}
                            </div>
                          </td>
                        ))}
                        <td className="border border-border px-2 py-1.5 text-center font-semibold">
                          {sheet.totalQuantity || 0}
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
                      {sheet.mockupImage || sheet.productImage ? (
                        <img
                          src={sheet.mockupImage || sheet.productImage}
                          alt={sheet.productName}
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
          </div>
        ))}
      </div>
    </div>
  );
}
