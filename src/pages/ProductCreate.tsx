import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ProductVariant } from "@/data/mockData";
import apiService from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Trash2,
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { parseEuroNumber } from "@/lib/utils";

interface FormData {
  productNumber: string;
  name: string;
  brand: string;
  category: string;
  gender: string;
  description: string;
  fabrics: string;
  purchasePrice: number;
  salesPrice: number;
  margin: number;
  status: "active" | "inactive";
}

const emptyForm: FormData = {
  productNumber: "",
  name: "",
  brand: "",
  category: "",
  gender: "",
  description: "",
  fabrics: "",
  purchasePrice: 0,
  salesPrice: 0,
  margin: 0,
  status: "active",
};

export default function ProductCreate() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({ ...emptyForm });
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // String display states for pricing fields to allow free typing
  const [purchasePriceDisplay, setPurchasePriceDisplay] = useState("0");
  const [salesPriceDisplay, setSalesPriceDisplay] = useState("0");
  const [marginDisplay, setMarginDisplay] = useState("0");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newVariantRef = useRef<HTMLInputElement>(null);
  const [lastAddedVariantIndex, setLastAddedVariantIndex] = useState<
    number | null
  >(null);

  // Fetch filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesResult, brandsResult, gendersResult] =
          await Promise.all([
            apiService.fetchCategories(),
            apiService.fetchBrands(),
            apiService.fetchGenders(),
          ]);
        if (categoriesResult.success && categoriesResult.data)
          setCategories(categoriesResult.data);
        if (brandsResult.success && brandsResult.data)
          setBrands(brandsResult.data);
        if (gendersResult.success && gendersResult.data)
          setGenders(gendersResult.data);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    fetchFilters();
  }, []);

  // Auto-focus new variant
  useEffect(() => {
    if (lastAddedVariantIndex !== null && newVariantRef.current) {
      newVariantRef.current.focus();
      setLastAddedVariantIndex(null);
    }
  }, [lastAddedVariantIndex]);

  const handleChange = (
    field: keyof FormData,
    value: string | number | "active" | "inactive",
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.productNumber.trim()) {
      errors.productNumber = "Product number is required.";
    }
    if (!formData.name.trim()) {
      errors.name = "Product name is required.";
    }
    if (!formData.brand.trim()) {
      errors.brand = "Brand is required.";
    }
    if (!formData.category.trim()) {
      errors.category = "Category is required.";
    }
    if (!formData.fabrics.trim()) {
      errors.fabrics = "Fabrics information is required.";
    }
    if (!formData.status) {
      errors.status = "Status is required.";
    }
    if (isNaN(formData.purchasePrice) || formData.purchasePrice < 0) {
      errors.purchasePrice =
        "Purchase price must be a valid non-negative number.";
    }
    if (isNaN(formData.salesPrice) || formData.salesPrice <= 0) {
      errors.salesPrice = "Sales price is required and must be greater than 0.";
    }
    if (
      isNaN(formData.margin) ||
      formData.margin < 0 ||
      formData.margin > 100
    ) {
      errors.margin = "Margin must be between 0 and 100.";
    }
    if (
      formData.salesPrice > 0 &&
      formData.purchasePrice > formData.salesPrice
    ) {
      errors.purchasePrice = "Purchase price should not exceed sales price.";
    }

    // Variants validation (backend requires at least 1 variant)
    if (variants.length === 0) {
      errors.variants = "At least one variant is required.";
    } else {
      variants.forEach((variant, index) => {
        if (!variant.size || !variant.size.trim()) {
          errors[`variant_${index}_size`] = "Size is required.";
        }
        if (!variant.colorCode || !variant.colorCode.trim()) {
          errors[`variant_${index}_colorCode`] = "Color code is required.";
        }
      });
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleVariantChange = (
    index: number,
    field: keyof ProductVariant,
    value: string,
  ) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
    const errorKey = `variant_${index}_${field}`;
    if (fieldErrors[errorKey]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[errorKey];
        if (next.variants) delete next.variants;
        return next;
      });
    }
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: `v-${Date.now()}`,
      size: "",
      color: "",
      colorCode: "#000000",
      price: undefined,
    };
    const newVariants = [...variants, newVariant];
    setVariants(newVariants);
    setLastAddedVariantIndex(newVariants.length - 1);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 2MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImageUrls(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const productData = {
        ...formData,
        images: imageUrls,
        variants:
          variants.length > 0
            ? variants.map(v => ({
                ...v,
                price:
                  v.price !== undefined
                    ? parseEuroNumber(String(v.price))
                    : undefined,
              }))
            : [],
      };

      const result = await apiService.createProduct(productData);

      if (result.success) {
        toast({
          title: t("products.addProduct"),
          description: "Product created successfully.",
        });
        navigate("/products");
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create product.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
          <ArrowLeft size={16} className="mr-2" /> {t("products.title")}
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-6">{t("products.addProduct")}</h1>

      <div className="space-y-8">
        {/* Basic Information */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t("products.basicInfo")}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productNumber">
                {t("products.productNumber")} *
              </Label>
              <Input
                id="productNumber"
                value={formData.productNumber}
                onChange={e => handleChange("productNumber", e.target.value)}
                placeholder="e.g. PRD-001"
                className={
                  fieldErrors.productNumber ? "border-destructive" : ""
                }
              />
              {fieldErrors.productNumber && (
                <p className="text-xs text-destructive">
                  {fieldErrors.productNumber}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t("products.name")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleChange("name", e.target.value)}
                placeholder="Product name"
                className={fieldErrors.name ? "border-destructive" : ""}
              />
              {fieldErrors.name && (
                <p className="text-xs text-destructive">{fieldErrors.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("products.description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => handleChange("description", e.target.value)}
              rows={3}
              placeholder="Product description..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t("products.category")} *</Label>
              <Select
                value={formData.category || "Unknown"}
                onValueChange={value => handleChange("category", value)}
              >
                <SelectTrigger
                  id="category"
                  className={fieldErrors.category ? "border-destructive" : ""}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  <SelectItem key="Unknown" value="Unknown">
                    Unknown
                  </SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.category && (
                <p className="text-xs text-destructive">
                  {fieldErrors.category}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">{t("products.brand")} *</Label>
              <Select
                value={formData.brand || undefined}
                onValueChange={value => handleChange("brand", value)}
              >
                <SelectTrigger
                  id="brand"
                  className={fieldErrors.brand ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map(b => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.brand && (
                <p className="text-xs text-destructive">{fieldErrors.brand}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender || undefined}
                onValueChange={value => handleChange("gender", value)}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genders.map(g => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  handleChange("status", value)
                }
              >
                <SelectTrigger
                  id="status"
                  className={fieldErrors.status ? "border-destructive" : ""}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fabrics">Fabrics *</Label>
            <Textarea
              id="fabrics"
              value={formData.fabrics}
              onChange={e => handleChange("fabrics", e.target.value)}
              rows={2}
              placeholder="Enter fabric details..."
              className={fieldErrors.fabrics ? "border-destructive" : ""}
            />
            {fieldErrors.fabrics && (
              <p className="text-xs text-destructive">{fieldErrors.fabrics}</p>
            )}
          </div>
        </section>

        {/* Images */}
        <section className="space-y-4 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Images ({imageUrls.length})
          </h3>

          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageFileUpload}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} className="mr-2" /> Upload Image
              </Button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Enter image URL..."
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                />
              </div>
              <Button type="button" onClick={addImageUrl} variant="outline">
                <Plus size={16} className="mr-2" /> Add URL
              </Button>
            </div>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                      <img
                        src={url}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={e => {
                          e.currentTarget.src = "";
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImageUrl(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {imageUrls.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                <p>No images added yet</p>
                <p className="text-xs mt-1">Upload images or add URLs above</p>
              </div>
            )}
          </div>
        </section>

        {/* Pricing */}
        <section className="space-y-4 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t("products.pricing")}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">
                {t("products.purchasePrice")}
              </Label>
              <Input
                id="purchasePrice"
                type="text"
                inputMode="decimal"
                value={purchasePriceDisplay}
                onChange={e => {
                  const v = e.target.value;
                  if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                    const display =
                      purchasePriceDisplay === "0" &&
                      v.length > 1 &&
                      !v.startsWith("0.") &&
                      !v.startsWith("0,")
                        ? v.replace(/^0+/, "") || "0"
                        : v;
                    setPurchasePriceDisplay(display);
                    handleChange("purchasePrice", parseEuroNumber(display));
                  }
                }}
                onBlur={() => {
                  const parsed = parseEuroNumber(purchasePriceDisplay);
                  setPurchasePriceDisplay(String(parsed));
                }}
                className={
                  fieldErrors.purchasePrice ? "border-destructive" : ""
                }
              />
              {fieldErrors.purchasePrice && (
                <p className="text-xs text-destructive">
                  {fieldErrors.purchasePrice}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="salesPrice">{t("products.salesPrice")}</Label>
              <Input
                id="salesPrice"
                type="text"
                inputMode="decimal"
                value={salesPriceDisplay}
                onChange={e => {
                  const v = e.target.value;
                  if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                    const display =
                      salesPriceDisplay === "0" &&
                      v.length > 1 &&
                      !v.startsWith("0.") &&
                      !v.startsWith("0,")
                        ? v.replace(/^0+/, "") || "0"
                        : v;
                    setSalesPriceDisplay(display);
                    handleChange("salesPrice", parseEuroNumber(display));
                  }
                }}
                onBlur={() => {
                  const parsed = parseEuroNumber(salesPriceDisplay);
                  setSalesPriceDisplay(String(parsed));
                }}
                className={fieldErrors.salesPrice ? "border-destructive" : ""}
              />
              {fieldErrors.salesPrice && (
                <p className="text-xs text-destructive">
                  {fieldErrors.salesPrice}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="margin">{t("products.productMargin")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="margin"
                  type="text"
                  inputMode="decimal"
                  value={marginDisplay}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                      const display =
                        marginDisplay === "0" &&
                        v.length > 1 &&
                        !v.startsWith("0.") &&
                        !v.startsWith("0,")
                          ? v.replace(/^0+/, "") || "0"
                          : v;
                      setMarginDisplay(display);
                      handleChange("margin", parseEuroNumber(display));
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseEuroNumber(marginDisplay);
                    setMarginDisplay(String(parsed));
                  }}
                  className={fieldErrors.margin ? "border-destructive" : ""}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              {fieldErrors.margin && (
                <p className="text-xs text-destructive">{fieldErrors.margin}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("products.marginAutoCalcHint")}
              </p>
            </div>
          </div>
        </section>

        {/* Variants */}
        <section className="space-y-4 pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t("products.variants")} ({variants.length}) *
              </h3>
              {fieldErrors.variants && (
                <p className="text-xs text-destructive mt-1">
                  {fieldErrors.variants}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
            >
              <Plus size={14} className="mr-2" /> {t("common.add")}
            </Button>
          </div>

          {variants.length > 0 ? (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="p-4 bg-muted/50 rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t("products.size")} *
                        </Label>
                        <Input
                          ref={
                            index === lastAddedVariantIndex
                              ? newVariantRef
                              : undefined
                          }
                          value={variant.size || ""}
                          onChange={e =>
                            handleVariantChange(index, "size", e.target.value)
                          }
                          placeholder={t("products.size")}
                          className={
                            fieldErrors[`variant_${index}_size`]
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {fieldErrors[`variant_${index}_size`] && (
                          <p className="text-xs text-destructive">
                            {fieldErrors[`variant_${index}_size`]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("products.color")}</Label>
                        <Input
                          value={variant.color || ""}
                          onChange={e =>
                            handleVariantChange(index, "color", e.target.value)
                          }
                          placeholder={t("products.color")}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Color Code *</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={variant.colorCode || "#000000"}
                            onChange={e =>
                              handleVariantChange(
                                index,
                                "colorCode",
                                e.target.value,
                              )
                            }
                            className="w-12 h-9 p-0 border-0 cursor-pointer"
                          />
                          <Input
                            value={variant.colorCode || "#000000"}
                            onChange={e =>
                              handleVariantChange(
                                index,
                                "colorCode",
                                e.target.value,
                              )
                            }
                            placeholder="#000000"
                            className={`flex-1 ${fieldErrors[`variant_${index}_colorCode`] ? "border-destructive" : ""}`}
                          />
                        </div>
                        {fieldErrors[`variant_${index}_colorCode`] && (
                          <p className="text-xs text-destructive">
                            {fieldErrors[`variant_${index}_colorCode`]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={variant.price || ""}
                          onChange={e => {
                            const v = e.target.value;
                            if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
                              handleVariantChange(index, "price", v);
                            }
                          }}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("products.noVariants")}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 pb-4 border-t border-border sticky bottom-0 bg-background z-10">
          <Button
            variant="outline"
            onClick={() => navigate("/products")}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Creating...
              </>
            ) : (
              t("products.addProduct")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
