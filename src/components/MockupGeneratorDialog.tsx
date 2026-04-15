import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
  Building2,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import apiService from "@/services/api";
import { compressImage } from "@/lib/imageUtils";

interface MockupGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productImageUrl: string;
  productName: string;
  customerCompanyLogo?: string;
  customerName?: string;
  existingMockup?: string;
  onMockupGenerated: (mockupImageUrl: string) => void;
  onMockupRemoved: () => void;
}

export default function MockupGeneratorDialog({
  open,
  onOpenChange,
  productImageUrl,
  productName,
  customerCompanyLogo,
  customerName,
  existingMockup,
  onMockupGenerated,
  onMockupRemoved,
}: MockupGeneratorDialogProps) {
  const { t } = useLanguage();
  const [logoSource, setLogoSource] = useState<"company" | "custom">(
    customerCompanyLogo ? "company" : "custom",
  );
  const [customLogo, setCustomLogo] = useState<string>("");
  const [customLogoPreview, setCustomLogoPreview] = useState<string | null>(
    null,
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockupResult, setMockupResult] = useState<string | null>(
    existingMockup || null,
  );
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

  const handleGenerate = async () => {
    const logo = getSelectedLogo();
    if (!logo) {
      setError(t("mockup.noLogoSelected"));
      return;
    }

    if (!productImageUrl) {
      setError(t("mockup.noProductImage"));
      return;
    }

    setGenerating(true);
    setError(null);

    // Compress company logo if it's a data URI (custom logos already compressed on upload)
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
        setMockupResult(result.mockupImageUrl);
        onMockupGenerated(result.mockupImageUrl);
      } else {
        setError(result.message);
      }
    } catch {
      setError(t("mockup.generationFailed"));
    } finally {
      setGenerating(false);
    }
  };

  const handleRemoveMockup = () => {
    setMockupResult(null);
    onMockupRemoved();
  };

  const canGenerate =
    !generating && productImageUrl && getSelectedLogo() !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("mockup.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Product Image Preview */}
          <div>
            <Label className="text-sm font-medium">
              {t("mockup.productImage")}
            </Label>
            <div className="mt-2 flex items-center gap-3">
              <div className="w-20 h-20 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {productImageUrl ? (
                  <img
                    src={productImageUrl}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={24} className="text-muted-foreground/40" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{productName}</p>
                {!productImageUrl && (
                  <p className="text-xs text-destructive mt-1">
                    {t("mockup.noProductImage")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Logo Source Selection */}
          <div>
            <Label className="text-sm font-medium">
              {t("mockup.selectLogo")}
            </Label>
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
                  id="logo-company"
                  disabled={!customerCompanyLogo}
                />
                <Label
                  htmlFor="logo-company"
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
                      <Building2
                        size={18}
                        className="text-muted-foreground/40"
                      />
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
                  id="logo-custom"
                  className="mt-0.5"
                />
                <Label htmlFor="logo-custom" className="flex-1 cursor-pointer">
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
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Existing / Generated Mockup Preview */}
          {mockupResult && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">
                  {t("mockup.result")}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemoveMockup}
                >
                  <X size={14} className="mr-1" />
                  {t("mockup.removeMockup")}
                </Button>
              </div>
              <div className="rounded-lg border border-border overflow-hidden bg-muted">
                <img
                  src={mockupResult}
                  alt="Generated mockup"
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleGenerate} disabled={!canGenerate}>
              {generating ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {t("mockup.generating")}
                </>
              ) : (
                <>
                  <ImageIcon size={16} className="mr-2" />
                  {mockupResult ? t("mockup.regenerate") : t("mockup.generate")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
