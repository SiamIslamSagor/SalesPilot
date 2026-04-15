import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  type ChangeEvent,
  type HTMLInputTypeAttribute,
} from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  FileText,
  Loader2,
  LucideIcon,
  Plus,
  ShoppingCart,
  TrendingUp,
  Percent,
  Upload,
  ImageIcon,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import api, { Customer, Offer, Order } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSortable } from "@/hooks/useSortable";
import { SortableHeader } from "@/components/SortableHeader";
import { formatEuro } from "@/lib/utils";

type CustomerFormState = {
  companyName: string;
  businessId: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  notes: string;
};

const EMPTY_FORM: CustomerFormState = {
  companyName: "",
  businessId: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postcode: "",
  country: "Finland",
  notes: "",
};

function toFormState(customer: Customer): CustomerFormState {
  return {
    companyName: customer.companyName || "",
    businessId: customer.businessId || "",
    contactPerson: customer.contactPerson || "",
    phone: customer.phone || "",
    email: customer.email || "",
    address: customer.address || "",
    city: customer.city || "",
    postcode: customer.postcode || "",
    country: customer.country || "Finland",
    notes: customer.notes || "",
  };
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormState>(EMPTY_FORM);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string>("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const {
    sorted: sortedOffers,
    sortKey: offerSortKey,
    sortDir: offerSortDir,
    handleSort: handleOfferSort,
  } = useSortable<Offer>(offers);
  const {
    sorted: sortedOrders,
    sortKey: orderSortKey,
    sortDir: orderSortDir,
    handleSort: handleOrderSort,
  } = useSortable<Order>(orders);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchCustomerData = async () => {
      try {
        setLoading(true);

        const [customerResponse, offersResponse, ordersResponse] =
          await Promise.all([
            api.getCustomerById(id),
            api.getOffersByCustomerId(id, { page: 1, limit: 20 }),
            api.getOrders({ customerId: id, page: 1, limit: 20 }),
          ]);

        if (!customerResponse.success || !customerResponse.data) {
          toast({
            title: t("common.error"),
            description:
              customerResponse.message || t("customers.failedToFetchCustomer"),
            variant: "destructive",
          });
          return;
        }

        setCustomer(customerResponse.data);
        setForm(toFormState(customerResponse.data));
        setLogoPreview(customerResponse.data.companyLogo || null);
        setLogoBase64(customerResponse.data.companyLogo || "");
        setOffers(offersResponse.success ? offersResponse.data : []);
        setOrders(ordersResponse.success ? ordersResponse.data : []);
      } catch (error) {
        console.error("Error fetching customer detail:", error);
        toast({
          title: t("common.error"),
          description: t("customers.failedToFetchCustomer"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [id, t, toast]);

  const handleLogoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: t("common.error"),
          description: "Please select an image file (PNG, JPG, SVG, etc.)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: t("common.error"),
          description: "Logo image must be under 2MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setLogoBase64(result);
      };
      reader.readAsDataURL(file);
    },
    [toast, t],
  );

  const handleRemoveLogo = useCallback(() => {
    setLogoPreview(null);
    setLogoBase64("");
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  }, []);

  const approvalRate = useMemo(() => {
    if (offers.length === 0) {
      return 0;
    }

    const approvedOffers = offers.filter(
      offer => offer.status === "accepted" || offer.status === "completed",
    );

    return Math.round((approvedOffers.length / offers.length) * 100);
  }, [offers]);

  const hasChanges = useMemo(() => {
    if (!customer) {
      return false;
    }

    const original = toFormState(customer);
    const formChanged = JSON.stringify(original) !== JSON.stringify(form);
    const logoChanged = logoBase64 !== (customer.companyLogo || "");
    return formChanged || logoChanged;
  }, [customer, form, logoBase64]);

  const handleInputChange =
    (field: keyof CustomerFormState) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm(current => ({
        ...current,
        [field]: event.target.value,
      }));
      if (fieldErrors[field]) {
        setFieldErrors(prev => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };

  const handleSave = async () => {
    if (!id) {
      return;
    }

    const errors: Record<string, string> = {};
    if (!form.companyName.trim())
      errors.companyName = t("validation.companyNameRequired");
    if (!form.contactPerson.trim())
      errors.contactPerson = t("validation.contactPersonRequired");
    if (!form.phone.trim()) errors.phone = t("validation.phoneRequired");
    if (!form.email.trim()) errors.email = t("validation.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errors.email = t("validation.emailInvalid");
    if (!form.address.trim()) errors.address = t("validation.addressRequired");
    if (!form.city.trim()) errors.city = t("validation.cityRequired");
    if (!form.postcode.trim())
      errors.postcode = t("validation.postcodeRequired");
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setSaving(true);

      const response = await api.updateCustomer(id, {
        ...form,
        companyLogo: logoBase64 || "",
      });

      if (response.success && response.data) {
        setCustomer(response.data);
        setForm(toFormState(response.data));
        setLogoPreview(response.data.companyLogo || null);
        setLogoBase64(response.data.companyLogo || "");
        toast({
          title: t("common.success"),
          description: t("customers.customerUpdatedSuccessfully"),
        });
        return;
      }

      toast({
        title: t("common.error"),
        description: response.message || t("customers.failedToUpdateCustomer"),
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      const message =
        error instanceof Error
          ? error.message
          : t("customers.failedToUpdateCustomer");
      toast({
        title: t("common.error"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t("customers.loadingCustomer")}</span>
        </div>
      </div>
    );
  }

  if (!customer || !id) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{t("customers.notFound")}</p>
        <Link to="/customers">
          <Button variant="outline" className="mt-4">
            {t("customers.backToCustomers")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center sticky top-0 z-10 bg-background py-4 -mt-4 -mx-1 px-1">
        <div className="flex items-center gap-3">
          <Link to="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          {customer.companyLogo ? (
            <div className="w-10 h-10 rounded-lg border border-border overflow-hidden bg-muted">
              <img
                src={customer.companyLogo}
                alt={customer.companyName}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 size={20} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{customer.companyName}</h1>
            <p className="text-sm text-muted-foreground">
              {customer.contactPerson} · {customer.email} · {customer.phone}
            </p>
          </div>
        </div>
        <div className="flex flex-1 justify-end gap-3">
          <Link to={`/quotes/new?customer=${customer.id}`}>
            <Button variant="outline">
              <Plus size={16} className="mr-2" />
              {t("offers.newOfferFromCustomer")}
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
            {saving ? t("common.saving") : t("customers.saveChanges")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox
          icon={TrendingUp}
          label={t("customers.totalSales")}
          value={`€${customer.totalSales.toLocaleString("de-DE")}`}
          color="bg-primary/10 text-primary"
        />
        <StatBox
          icon={TrendingUp}
          label={t("customers.totalMargin")}
          value={`€${customer.totalMargin.toLocaleString("de-DE")}`}
          color="bg-success/10 text-success"
        />
        <StatBox
          icon={Percent}
          label={t("customers.discountPercent")}
          value={`${customer.discountPercent}%`}
          color="bg-warning/10 text-warning"
        />
        <StatBox
          icon={FileText}
          label={t("customers.approvalRate")}
          value={`${approvalRate}%`}
          color="bg-info/10 text-info"
        />
      </div>

      <div className="grid gap-6 mb-8 xl:grid-cols-[1.6fr_1fr]">
        <section className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold">
                {t("customers.customerInfo")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("customers.editCustomerInfo")}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Company Logo */}
            <div className="space-y-2 md:col-span-2">
              <Label>
                {t("customers.companyLogo")}{" "}
                <span className="text-muted-foreground font-normal">
                  ({t("common.optional")})
                </span>
              </Label>
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <div className="relative w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <ImageIcon size={20} className="text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload size={14} className="mr-2" />
                    {logoPreview
                      ? t("customers.changeLogo")
                      : t("customers.uploadLogo")}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG or SVG. Max 2MB.
                  </p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            <FormField
              id="companyName"
              label={t("customers.companyName")}
              value={form.companyName}
              onChange={handleInputChange("companyName")}
              error={fieldErrors.companyName}
            />
            <div className="space-y-2">
              <Label htmlFor="businessId">
                {t("customers.businessId")} ({t("common.optional")})
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex align-middle ml-1"
                      >
                        <Info
                          size={13}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px]">
                      <p className="text-xs">{t("customers.businessIdHint")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="businessId"
                value={form.businessId}
                onChange={handleInputChange("businessId")}
              />
            </div>
            <FormField
              id="contactPerson"
              label={t("customers.contactPerson")}
              value={form.contactPerson}
              onChange={handleInputChange("contactPerson")}
              error={fieldErrors.contactPerson}
            />
            <FormField
              id="phone"
              label={t("common.phone")}
              value={form.phone}
              onChange={handleInputChange("phone")}
              error={fieldErrors.phone}
            />
            <FormField
              id="email"
              type="email"
              label={t("common.email")}
              value={form.email}
              onChange={handleInputChange("email")}
              error={fieldErrors.email}
            />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">{t("common.address")}</Label>
              <Input
                id="address"
                value={form.address}
                onChange={handleInputChange("address")}
                className={fieldErrors.address ? "border-destructive" : ""}
              />
              {fieldErrors.address && (
                <p className="text-xs text-destructive">
                  {fieldErrors.address}
                </p>
              )}
            </div>
            <FormField
              id="city"
              label={t("customers.city")}
              value={form.city}
              onChange={handleInputChange("city")}
              error={fieldErrors.city}
            />
            <FormField
              id="postcode"
              label={t("customers.postcode")}
              value={form.postcode}
              onChange={handleInputChange("postcode")}
              error={fieldErrors.postcode}
            />
            <FormField
              id="country"
              label={`${t("customers.country") || "Country"} (${t("common.optional")})`}
              value={form.country}
              onChange={handleInputChange("country")}
            />
          </div>
        </section>

        <section className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-lg font-semibold mb-4">
            {t("customers.contactDetails")}
          </h2>
          <div className="space-y-4 text-sm">
            <InfoRow label={t("customers.totalOffers")} value={offers.length} />
            <InfoRow label={t("customers.salesOrders")} value={orders.length} />
            <InfoRow
              label={t("customers.discountPercent")}
              value={`${customer.discountPercent}%`}
            />
            <InfoRow
              label={t("common.updated")}
              value={new Date(customer.updatedAt).toLocaleDateString()}
            />
          </div>
        </section>
      </div>

      <div className="bg-card rounded-lg border border-border p-5 mb-8">
        <div className="space-y-2">
          <Label htmlFor="customerNotes">{t("customers.notes")}</Label>
          <Textarea
            id="customerNotes"
            value={form.notes}
            onChange={handleInputChange("notes")}
            placeholder={t("customers.notesPlaceholder")}
            className="min-h-[140px]"
          />
          <p className="text-xs text-muted-foreground">
            {t("customers.notesHelp")}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <FileText size={18} /> {t("offers.title")} ({offers.length})
      </h2>
      <div className="bg-card rounded-lg border border-border overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <SortableHeader
                  label={t("offers.offerNumber")}
                  sortKey="offerNumber"
                  currentKey={offerSortKey as string | null}
                  direction={offerSortDir}
                  onClick={k => handleOfferSort(k as keyof Offer)}
                />
                <SortableHeader
                  label={t("common.status")}
                  sortKey="status"
                  currentKey={offerSortKey as string | null}
                  direction={offerSortDir}
                  onClick={k => handleOfferSort(k as keyof Offer)}
                />
                <SortableHeader
                  label={t("common.items")}
                  sortKey="itemCount"
                  currentKey={offerSortKey as string | null}
                  direction={offerSortDir}
                  onClick={k => handleOfferSort(k as keyof Offer)}
                />
                <SortableHeader
                  label={t("common.created")}
                  sortKey="createdAt"
                  currentKey={offerSortKey as string | null}
                  direction={offerSortDir}
                  onClick={k => handleOfferSort(k as keyof Offer)}
                />
                <SortableHeader
                  label={t("common.amount")}
                  sortKey="totalAmount"
                  currentKey={offerSortKey as string | null}
                  direction={offerSortDir}
                  onClick={k => handleOfferSort(k as keyof Offer)}
                  className="text-right"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedOffers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {t("customers.noOffersYet")}
                  </td>
                </tr>
              )}
              {sortedOffers.map(offer => (
                <tr
                  key={offer._id}
                  className="hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/quotes/${offer._id}`)}
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/quotes/${offer._id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {offer.offerNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-badge status-${offer.status}`}>
                      {offer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {offer.itemCount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(offer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    €{offer.totalAmount.toLocaleString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <ShoppingCart size={18} /> {t("customers.salesOrders")} ({orders.length}
        )
      </h2>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <SortableHeader
                  label={t("orders.orderNumber")}
                  sortKey="orderNumber"
                  currentKey={orderSortKey as string | null}
                  direction={orderSortDir}
                  onClick={k => handleOrderSort(k as keyof Order)}
                />
                <SortableHeader
                  label={t("common.status")}
                  sortKey="status"
                  currentKey={orderSortKey as string | null}
                  direction={orderSortDir}
                  onClick={k => handleOrderSort(k as keyof Order)}
                />
                <SortableHeader
                  label={t("orders.offerRef")}
                  sortKey="offerId"
                  currentKey={orderSortKey as string | null}
                  direction={orderSortDir}
                  onClick={k => handleOrderSort(k as keyof Order)}
                />
                <SortableHeader
                  label={t("common.created")}
                  sortKey="createdAt"
                  currentKey={orderSortKey as string | null}
                  direction={orderSortDir}
                  onClick={k => handleOrderSort(k as keyof Order)}
                />
                <SortableHeader
                  label={t("common.amount")}
                  sortKey="totalAmount"
                  currentKey={orderSortKey as string | null}
                  direction={orderSortDir}
                  onClick={k => handleOrderSort(k as keyof Order)}
                  className="text-right"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {t("customers.noOrdersYet")}
                  </td>
                </tr>
              )}
              {sortedOrders.map(order => (
                <tr
                  key={order._id}
                  className="hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/orders/confirm/${order._id}`)}
                >
                  <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`status-badge ${
                        order.status === "completed"
                          ? "status-completed"
                          : order.status === "processing"
                            ? "status-sent"
                            : "status-draft"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/quotes/${order.offerId}`}
                      className="text-primary hover:underline"
                    >
                      {order.offerNumber || order.offerId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    €{order.totalAmount.toLocaleString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  type = "text",
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: HTMLInputTypeAttribute;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        className={error ? "border-destructive" : ""}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
