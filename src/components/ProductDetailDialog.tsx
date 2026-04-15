import { useState } from "react";
import { Product } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Calendar, Euro, Layers } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatEuro } from "@/lib/utils";

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductDetailDialog({
  product,
  open,
  onOpenChange,
}: Props) {
  const { t } = useLanguage();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  if (!product) return null;

  const images =
    product.images && product.images.length > 0 ? product.images : [];

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
          <p className="text-sm text-muted-foreground font-mono">
            {product.productNumber}
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Images */}
          <div className="space-y-3">
            <div className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
              {images.length > 0 ? (
                <img
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={64} className="text-muted-foreground/30" />
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      idx === selectedImageIndex
                        ? "border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            {/* Category and Gender Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm">
                {product.category === "" ? "Unknown" : product.category}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {product.gender}
              </Badge>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium mb-1">
                {t("products.description")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description || "-"}
              </p>
            </div>

            <Separator />

            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Layers size={16} />
                {t("products.basicInfo")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("products.productNumber")}
                  </p>
                  <p className="text-sm font-medium font-mono">
                    {product.productNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("products.brand")}
                  </p>
                  <p className="text-sm font-medium">{product.brand}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("products.category")}
                  </p>
                  <p className="text-sm font-medium">
                    {product.category === "" ? "Unknown" : product.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Gender</p>
                  <p className="text-sm font-medium">{product.gender}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Euro size={16} />
                {t("products.pricing")}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("products.salesPrice")}
                  </p>
                  <p className="text-lg font-semibold">
                    €{formatEuro(product.salesPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("products.purchasePrice")}
                  </p>
                  <p className="text-sm font-medium">
                    €{formatEuro(product.purchasePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("common.margin")}
                  </p>
                  <p className="text-sm font-semibold text-success">
                    {product.margin === 0
                      ? (
                          ((product.salesPrice - product.purchasePrice) /
                            product.salesPrice) *
                          100
                        )
                          .toFixed(1)
                          .replace(".", ",")
                      : product.margin.toFixed(1).replace(".", ",")}
                    % margin
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Fabrics */}
            <div>
              <h3 className="text-sm font-medium mb-1">Fabrics</h3>
              <p className="text-sm text-muted-foreground">
                {product.fabrics || "-"}
              </p>
            </div>

            <Separator />

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">
                  {t("products.variants")} ({product.variants.length})
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {product.variants.map((v, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-muted/50 border"
                    >
                      <div className="flex items-center gap-2">
                        {v.colorCode && (
                          <div
                            className="w-4 h-4 rounded-full border border-border"
                            style={{ backgroundColor: v.colorCode }}
                          />
                        )}
                        <span className="font-medium">
                          {v.color || "-"} / {v.size}
                        </span>
                      </div>
                      {v.price && (
                        <span className="text-sm font-medium">
                          €{formatEuro(v.price)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Timestamps */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar size={16} />
                Timestamps
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("common.created")}
                  </p>
                  <p className="text-sm font-medium">
                    {formatDate(product.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("common.updated")}
                  </p>
                  <p className="text-sm font-medium">
                    {formatDate(product.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
