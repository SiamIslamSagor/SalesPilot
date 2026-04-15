import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
  Building2,
  Package,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import apiService from "@/services/api";
import { Product } from "@/data/mockData";
import { compressImage } from "@/lib/imageUtils";
import ImageLightbox from "@/components/ImageLightbox";

interface MockupItem {
  index: number;
  product: Product;
  mockupImage?: string;
}

interface MockupBatchSectionProps {
  items: MockupItem[];
  customerCompanyLogo?: string;
  customerName?: string;
  onMockupGenerated: (itemIndex: number, mockupUrl: string) => void;
  onMockupRemoved: (itemIndex: number) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export default function MockupBatchSection({
  items,
  customerCompanyLogo,
  customerName,
  onMockupGenerated,
  onMockupRemoved,
  onGeneratingChange,
}: MockupBatchSectionProps) {
  const { t } = useLanguage();
  const [logoSource, setLogoSource] = useState<"company" | "custom">(
    customerCompanyLogo ? "company" : "custom",
  );
  const [customLogo, setCustomLogo] = useState<string>("");
  const [customLogoPreview, setCustomLogoPreview] = useState<string | null>(
    null,
  );
  const [generatingItems, setGeneratingItems] = useState<Set<number>>(
    new Set(),
  );

  // Notify parent when generating state changes
  const updateGeneratingItems = useCallback(
    (updater: (prev: Set<number>) => Set<number>) => {
      setGeneratingItems(prev => {
        const next = updater(prev);
        onGeneratingChange?.(next.size > 0);
        return next;
      });
    },
    [onGeneratingChange],
  );
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomLogoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError(t("mockup.invalidFileType"));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(t("mockup.fileTooLarge"));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        try {
          // Compress logo to max 512px for faster processing
          const compressed = await compressImage(result, 512);
          setCustomLogoPreview(compressed);
          setCustomLogo(compressed);
          setError(null);
        } catch {
          setCustomLogoPreview(result);
          setCustomLogo(result);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    },
    [t],
  );

  const removeCustomLogo = useCallback(() => {
    setCustomLogoPreview(null);
    setCustomLogo("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const getSelectedLogo = (): string | null => {
    if (logoSource === "company" && customerCompanyLogo) {
      return customerCompanyLogo;
    }
    if (logoSource === "custom" && customLogo) {
      return customLogo;
    }
    return null;
  };

  const generateSingle = async (item: MockupItem) => {
    const logo = getSelectedLogo();
    if (!logo) {
      setError(t("mockup.noLogoSelected"));
      return;
    }

    const productImageUrl = item.product.images?.[0];
    if (!productImageUrl) {
      setError(t("mockup.noProductImage"));
      return;
    }

    updateGeneratingItems(prev => new Set(prev).add(item.index));
    setError(null);

    // Compress company logo before sending
    let compressedLogo = logo;
    if (logoSource === "company" && !logo.startsWith("http")) {
      try {
        compressedLogo = await compressImage(logo, 512);
      } catch {
        // Fall back to uncompressed
      }
    }

    try {
      const result = await apiService.generateMockupImage({
        productImageUrl,
        logoImage: compressedLogo,
      });

      if (result.success) {
        onMockupGenerated(item.index, result.mockupImageUrl);
      } else {
        setError(result.message);
      }
    } catch {
      setError(t("mockup.generationFailed"));
    } finally {
      updateGeneratingItems(prev => {
        const next = new Set(prev);
        next.delete(item.index);
        return next;
      });
    }
  };

  const generateAll = async () => {
    const logo = getSelectedLogo();
    if (!logo) {
      setError(t("mockup.noLogoSelected"));
      return;
    }

    const itemsToGenerate = items.filter(
      item => !item.mockupImage && item.product.images?.[0],
    );

    if (itemsToGenerate.length === 0) return;

    setError(null);
    updateGeneratingItems(() => new Set(itemsToGenerate.map(i => i.index)));

    // Compress company logo before sending (custom logos already compressed on upload)
    let compressedLogo = logo;
    if (logoSource === "company" && logo.startsWith("http")) {
      // For URL-based logos, send as-is (backend handles fetching)
      compressedLogo = logo;
    } else if (logoSource === "company") {
      try {
        compressedLogo = await compressImage(logo, 512);
      } catch {
        // Fall back to uncompressed
      }
    }

    // Use batch API for multiple items (logo parsed once, parallel processing)
    if (itemsToGenerate.length > 1) {
      try {
        const batchResult = await apiService.generateMockupBatch({
          logoImage: compressedLogo,
          items: itemsToGenerate.map(item => ({
            index: item.index,
            productImageUrl: item.product.images![0],
          })),
        });

        if (batchResult.success) {
          for (const result of batchResult.results) {
            if (result.success && result.mockupImageUrl) {
              onMockupGenerated(result.index, result.mockupImageUrl);
            } else {
              setError(result.message || t("mockup.generationFailed"));
            }
          }
        } else {
          setError(
            "message" in batchResult
              ? batchResult.message
              : t("mockup.generationFailed"),
          );
        }
      } catch {
        setError(t("mockup.generationFailed"));
      } finally {
        updateGeneratingItems(() => new Set());
      }
      return;
    }

    // Single item - use individual endpoint
    for (const item of itemsToGenerate) {
      const productImageUrl = item.product.images?.[0];
      if (!productImageUrl) continue;

      try {
        const result = await apiService.generateMockupImage({
          productImageUrl,
          logoImage: compressedLogo,
        });

        if (result.success) {
          onMockupGenerated(item.index, result.mockupImageUrl);
        } else {
          setError(result.message);
        }
      } catch {
        setError(t("mockup.generationFailed"));
      } finally {
        updateGeneratingItems(prev => {
          const next = new Set(prev);
          next.delete(item.index);
          return next;
        });
      }
    }
  };

  const hasLogo = getSelectedLogo() !== null;
  const isAnyGenerating = generatingItems.size > 0;
  const pendingCount = items.filter(
    item => !item.mockupImage && item.product.images?.[0],
  ).length;

  return (
    <div className="bg-card rounded-lg border border-border p-5 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {t("mockup.batchTitle")} ({items.length})
      </h3>

      {/* Logo Source Selection */}
      <div className="mb-5">
        <Label className="text-sm font-medium">{t("mockup.selectLogo")}</Label>
        <RadioGroup
          value={logoSource}
          onValueChange={v => setLogoSource(v as "company" | "custom")}
          className="mt-2 space-y-3"
        >
          {/* Company Logo Option */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              logoSource === "company"
                ? "border-primary bg-primary/5"
                : "border-border"
            } ${!customerCompanyLogo ? "opacity-50" : "cursor-pointer"}`}
          >
            <RadioGroupItem
              value="company"
              id="batch-logo-company"
              disabled={!customerCompanyLogo}
            />
            <Label
              htmlFor="batch-logo-company"
              className="flex items-center gap-3 flex-1 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-md border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {customerCompanyLogo ? (
                  <img
                    src={customerCompanyLogo}
                    alt={customerName || "Company logo"}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 size={18} className="text-muted-foreground/40" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {t("mockup.useCompanyLogo")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {customerCompanyLogo
                    ? customerName || t("mockup.companyLogoAvailable")
                    : t("mockup.noCompanyLogo")}
                </p>
              </div>
            </Label>
          </div>

          {/* Custom Upload Option */}
          <div
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              logoSource === "custom"
                ? "border-primary bg-primary/5"
                : "border-border"
            } cursor-pointer`}
          >
            <RadioGroupItem
              value="custom"
              id="batch-logo-custom"
              className="mt-0.5"
            />
            <Label
              htmlFor="batch-logo-custom"
              className="flex-1 cursor-pointer"
            >
              <p className="text-sm font-medium">
                {t("mockup.uploadCustomLogo")}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {t("mockup.uploadCustomLogoDesc")}
              </p>

              {logoSource === "custom" && (
                <div className="flex items-center gap-3">
                  {customLogoPreview ? (
                    <div className="relative w-14 h-14 rounded-md border border-border overflow-hidden bg-muted">
                      <img
                        src={customLogoPreview}
                        alt="Custom logo"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          removeCustomLogo();
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-14 h-14 rounded-md border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={e => {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload size={18} className="text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={e => {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload size={14} className="mr-2" />
                    {customLogoPreview
                      ? t("mockup.changeLogo")
                      : t("mockup.chooseLogo")}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleCustomLogoChange}
                  />
                </div>
              )}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Generate All Button */}
      {pendingCount > 0 && (
        <div className="mb-5">
          <Button onClick={generateAll} disabled={!hasLogo || isAnyGenerating}>
            {isAnyGenerating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {t("mockup.generating")}
              </>
            ) : (
              <>
                <ImageIcon size={16} className="mr-2" />
                {t("mockup.generateAll")} ({pendingCount})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Product Mockup Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => {
          const productImage = item.product.images?.[0];
          const isGenerating = generatingItems.has(item.index);

          return (
            <div
              key={item.product.id}
              className="rounded-lg border border-border overflow-hidden bg-background"
            >
              {/* Product header */}
              <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
                <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={16} className="text-muted-foreground/40" />
                  )}
                </div>
                <p className="text-sm font-medium truncate">
                  {item.product.name}
                </p>
              </div>

              {/* Mockup area */}
              <div className="p-3">
                {item.mockupImage ? (
                  <div>
                    <div
                      className="rounded-md border border-border overflow-hidden bg-muted mb-2 cursor-zoom-in"
                      onClick={() => {
                        setLightboxImage(item.mockupImage!);
                        setLightboxAlt(`Mockup - ${item.product.name}`);
                      }}
                    >
                      <img
                        src={item.mockupImage}
                        alt={`Mockup - ${item.product.name}`}
                        className="w-full h-auto max-h-[200px] object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        disabled={!hasLogo || isGenerating}
                        onClick={() => generateSingle(item)}
                      >
                        {isGenerating ? (
                          <Loader2 size={12} className="mr-1 animate-spin" />
                        ) : (
                          <ImageIcon size={12} className="mr-1" />
                        )}
                        {t("mockup.regenerate")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive text-xs"
                        onClick={() => onMockupRemoved(item.index)}
                      >
                        <X size={12} className="mr-1" />
                        {t("mockup.removeMockup")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    {isGenerating ? (
                      <>
                        <Loader2
                          size={24}
                          className="animate-spin text-primary mb-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("mockup.generating")}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center mb-2">
                          <ImageIcon
                            size={24}
                            className="text-muted-foreground/30"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                          disabled={!hasLogo || !productImage}
                          onClick={() => generateSingle(item)}
                        >
                          <ImageIcon size={12} className="mr-1" />
                          {t("mockup.generate")}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        src={lightboxImage}
        alt={lightboxAlt}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
