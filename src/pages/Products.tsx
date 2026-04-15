import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Product } from "@/data/mockData";
import { productImages } from "@/assets/products";
import {
  Search,
  Filter,
  Package,
  Upload,
  FileText,
  Check,
  Eye,
  Edit,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import ProductImportDialog from "@/components/ProductImportDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { useLanguage } from "@/i18n/LanguageContext";
import apiService from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { formatEuro } from "@/lib/utils";

export default function Products() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [page, setPage] = useState(1);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<Product[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 12;

  // Fetch categories and brands from API
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesResult, brandsResult] = await Promise.all([
          apiService.fetchCategories(),
          apiService.fetchBrands(),
        ]);

        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data);
        } else {
          console.error("Failed to fetch categories:", categoriesResult);
        }

        if (brandsResult.success && brandsResult.data) {
          setBrands(brandsResult.data);
        } else {
          console.error("Failed to fetch brands:", brandsResult);
        }
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };

    fetchFilters();
  }, []);

  // Fetch products from API with query parameters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const result = await apiService.fetchProducts({
          page,
          limit,
          search: debouncedSearch || undefined,
          category: category === "all" ? undefined : category,
          brand: brand === "all" ? undefined : brand,
        });

        if (result.success && result.data) {
          setProducts(result.data);
          if (result.pagination) {
            setTotal(result.pagination.total);
            setTotalPages(result.pagination.pages);
          }
        } else {
          console.error("Failed to fetch products:", result);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, debouncedSearch, category, brand, refreshKey]);

  const toggleProduct = (productNumber: string) => {
    const next = new Set(selectedProducts);
    if (next.has(productNumber)) next.delete(productNumber);
    else next.add(productNumber);
    setSelectedProducts(next);
  };

  const handleCreateQuote = () => {
    const productNumbers = Array.from(selectedProducts).join(",");
    navigate(`/quotes/new?products=${productNumbers}`);
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleCategory = (v: string) => {
    setCategory(v);
    setPage(1);
  };
  const handleBrand = (v: string) => {
    setBrand(v);
    setPage(1);
  };

  const refreshProducts = () => {
    setRefreshKey(k => k + 1);
  };

  const handleDeleteSingle = (product: Product) => {
    setDeleteTargets([product]);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSelected = () => {
    const selected = products.filter(p =>
      selectedProducts.has(p.productNumber),
    );
    if (selected.length === 0) return;
    setDeleteTargets(selected);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        deleteTargets.map(p => apiService.deleteProduct(p.id)),
      );
      const failed = results.filter(r => !r.success);
      if (failed.length === 0) {
        toast({
          title: t("products.deleteSuccess"),
          description: `${deleteTargets.length} product(s) deleted.`,
        });
      } else {
        toast({
          title: t("products.deleteFailed"),
          description: `${failed.length} of ${deleteTargets.length} failed to delete.`,
          variant: "destructive",
        });
      }
      setSelectedProducts(new Set());
      refreshProducts();
    } catch {
      toast({
        title: t("products.deleteFailed"),
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteTargets([]);
    }
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background pt-1 pb-4 -mt-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">
              {t("products.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {total} {t("common.product").toLowerCase()}s
            </p>
          </div>
          <div className="flex gap-2">
            {selectedProducts.size > 0 && (
              <>
                <Button onClick={handleCreateQuote}>
                  <FileText size={16} className="mr-2" />{" "}
                  {t("products.createOffer")} ({selectedProducts.size})
                </Button>
              </>
            )}
            <Button onClick={() => navigate("/products/new")}>
              <Plus size={16} className="mr-2" /> {t("products.addProduct")}
            </Button>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload size={16} className="mr-2" /> {t("products.importExcel")}
            </Button>
            {selectedProducts.size > 0 && (
              <Button variant="destructive" onClick={handleDeleteSelected}>
                <Trash2 size={16} className="mr-2" />
                {t("products.deleteProduct")} ({selectedProducts.size})
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder={t("products.search")}
              className="pl-9"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={handleCategory}>
            <SelectTrigger className="w-[160px]">
              <Filter size={14} className="mr-2" />
              <SelectValue placeholder={t("products.allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("products.allCategories")}</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={brand} onValueChange={handleBrand}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("products.allBrands")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("products.allBrands")}</SelectItem>
              {brands.map(b => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>{t("common.loadingProducts")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                selected={selectedProducts.has(p.productNumber)}
                onToggle={() => toggleProduct(p.productNumber)}
                onViewDetail={() => setDetailProduct(p)}
                onEdit={() => navigate(`/products/${p.id}/edit`)}
              />
            ))}
          </div>
          {products.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Package size={40} className="mx-auto mb-3 opacity-40" />
              <p>{t("products.noProducts")}</p>
            </div>
          )}
        </>
      )}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
      <ProductDetailDialog
        product={detailProduct}
        open={!!detailProduct}
        onOpenChange={open => !open && setDetailProduct(null)}
      />
      <ProductImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportSuccess={() => {
          // Refresh products after import
          setPage(1);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("products.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("products.deleteConfirmDesc")}
              {deleteTargets.length === 1 ? (
                <span className="block mt-2 font-medium text-foreground">
                  {deleteTargets[0].name} ({deleteTargets[0].productNumber})
                </span>
              ) : (
                <span className="block mt-2 font-medium text-foreground">
                  {deleteTargets.length} products selected
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  {t("common.delete")}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductCard({
  product,
  selected,
  onToggle,
  onViewDetail,
  onEdit,
}: {
  product: Product;
  selected: boolean;
  onToggle: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`bg-card rounded-lg border overflow-hidden hover:shadow-md transition-all cursor-pointer group ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}
    >
      <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Package size={32} className="text-muted-foreground/40" />
        )}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-md flex items-center justify-center">
            <Check size={14} />
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex gap-2">
          <button
            onClick={e => {
              e.stopPropagation();
              onEdit();
            }}
            className="w-7 h-7 bg-background/80 backdrop-blur-sm border border-border rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <Edit size={14} className="text-foreground" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              onViewDetail();
            }}
            className="w-7 h-7 bg-background/80 backdrop-blur-sm border border-border rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <Eye size={14} className="text-foreground" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm">{product.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {product.productNumber}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {product.category === "" ? "Unknown" : product.category}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div>
            <p className="text-lg font-semibold">
              €{formatEuro(product.salesPrice)}
            </p>
            <p className="text-xs text-muted-foreground">
              Buy: €{formatEuro(product.purchasePrice)}
            </p>
          </div>
          <span className="text-xs font-medium text-success">
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
          </span>
        </div>
      </div>
    </div>
  );
}
