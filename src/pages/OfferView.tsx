import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Package, CheckCircle, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import apiService from "@/services/api";
import { formatEuro } from "@/lib/utils";

interface CustomerComment {
  comment?: string;
  timestamp: string;
}

export default function OfferView() {
  const { id } = useParams();
  const { t } = useLanguage();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quote, setQuote] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<"accepted" | "rejected" | null>(
    null,
  );
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);

  const getOfferExpiryDate = useCallback(
    (offer: {
      validUntil?: string;
      validDays?: string;
      createdAt?: string;
    }) => {
      if (offer.validUntil) {
        const expiry = new Date(offer.validUntil);
        expiry.setHours(0, 0, 0, 0);
        return expiry;
      }

      if (offer.validDays && offer.createdAt) {
        const days = Number(offer.validDays);
        if (!Number.isNaN(days) && days > 0) {
          const createdAt = new Date(offer.createdAt);
          createdAt.setHours(0, 0, 0, 0);
          const expiry = new Date(createdAt);
          expiry.setDate(expiry.getDate() + days);
          return expiry;
        }
      }

      return null;
    },
    [],
  );

  const handleResponse = useCallback(
    async (customerResponse: "accepted" | "rejected") => {
      if (!id) return;

      setSubmitting(true);
      try {
        const result = await apiService.updateCustomerResponseByAccessCode(
          id,
          customerResponse,
          comment.trim() || undefined,
        );

        if (result.success) {
          setResponse(customerResponse);
        } else {
          setError(result.message || "Failed to submit response");
        }
      } catch (err) {
        console.error("Error submitting response:", err);
        setError("Failed to submit response. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [id, comment],
  );

  useEffect(() => {
    if (!id) return;

    if (id === "preview-draft") {
      const raw = sessionStorage.getItem("offer_preview_draft");
      if (!raw) {
        setError(t("offer.notFound"));
        return;
      }
      try {
        const api = JSON.parse(raw);
        const normalized = {
          ...api,
          quoteNumber: api.offerNumber,
          validUntil: api.offerDetails?.validUntil,
          validDays: api.offerDetails?.validDays,
          additionalTerms: api.offerDetails?.additionalTerms,
          showTotalPrice: api.offerDetails?.showTotalPrice,
          specialCosts: api.offerDetails?.specialCosts || [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: (api.items || []).map((i: any) => ({
            ...i,
            id: i.productId,
            imageUrl: i.imageUrl,
            product: {
              name: i.productName,
              productNumber: i.productNumber,
              id: i.productId,
            },
          })),
          customer: {
            companyName: api.customerName,
            contactPerson: api.contactPerson,
          },
        };
        setQuote(normalized);
        setIsDraft(true);
        setCurrentVersion(1);
      } catch {
        setError(t("offer.notFound"));
      }
      return;
    }

    setLoading(true);
    setError(null);
    apiService
      .getOfferByAccessCode(id)
      .then(res => {
        if (res.success && res.data) {
          // normalize shape so UI can reuse existing markup
          const api = res.data;
          const normalized = {
            ...api,
            quoteNumber: api.offerNumber,
            validUntil: api.offerDetails?.validUntil,
            validDays: api.offerDetails?.validDays,
            additionalTerms: api.offerDetails?.additionalTerms,
            showTotalPrice: api.offerDetails?.showTotalPrice,
            specialCosts: api.offerDetails?.specialCosts || [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            items: (api.items || []).map((i: any) => ({
              ...i,
              id: i.productId,
              imageUrl: i.imageUrl,
              product: {
                name: i.productName,
                productNumber: i.productNumber,
                id: i.productId,
              },
            })),
            customer: {
              companyName: api.customerName,
              contactPerson: api.contactPerson,
            },
          };
          setQuote(normalized);

          // Track current version
          const newVersion = api.version || 1;
          setCurrentVersion(newVersion);

          // If offer already has a customer response for the current version, show it
          // When admin resends an offer, customerResponse is set to "pending"
          // So we check if customerResponse is "accepted" or "rejected" - if yes, show the response message
          // If "pending" or undefined/empty, show the offer with accept/reject buttons (new version sent)
          if (
            api.customerResponse === "accepted" ||
            api.customerResponse === "rejected"
          ) {
            setResponse(api.customerResponse);
            // Get the most recent comment from the array
            const latestComment =
              api.customerComments && api.customerComments.length > 0
                ? api.customerComments[api.customerComments.length - 1].comment
                : "";
            setComment(latestComment || "");
          } else {
            // No response for current version (pending or undefined) - customer can respond
            setResponse(null);
            setComment("");
          }
        } else {
          setError(res.message || t("offer.notFound"));
        }
      })
      .catch(err => {
        console.error("Error fetching offer:", err);
        setError(t("offer.notFound"));
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center py-20">
          <p className="text-destructive text-lg">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t("offer.notFoundDesc")}
          </p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  const customer = quote.customer || {
    companyName: quote.customerName,
    contactPerson: quote.contactPerson,
  };
  const expiryDate = getOfferExpiryDate(quote);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isExpired = Boolean(expiryDate && today > expiryDate);
  const totalAmount =
    quote.items.reduce((sum, item) => {
      const discounted = item.unitPrice * (1 - item.discount / 100);
      return sum + (discounted + item.markingCost) * item.quantity;
    }, 0) +
    (quote.specialCosts || []).reduce(
      (sum: number, cost: { amount: number }) =>
        sum + (Number(cost.amount) || 0),
      0,
    );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto py-8 pb-28">
        {isDraft && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex flex-col gap-1">
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
              {t("offer.draftNotice")}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500">
              {t("offer.draftNoticeDesc")}
            </p>
          </div>
        )}

        {response && (
          <div
            className={`rounded-lg border p-4 mb-6 flex items-start gap-3 ${
              response === "accepted"
                ? "bg-green-500/10 border-green-500/30"
                : "bg-destructive/10 border-destructive/20"
            }`}
          >
            {response === "accepted" ? (
              <CheckCircle size={20} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={20} className="text-destructive shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-semibold ${response === "accepted" ? "text-green-700 dark:text-green-400" : "text-destructive"}`}>
                {response === "accepted" ? t("offer.accepted") : t("offer.rejected")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {response === "accepted" ? t("offer.acceptedMessage") : t("offer.rejectedMessage")}
              </p>
              {comment && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("offer.yourComment")}: <span className="text-foreground">{comment}</span>
                </p>
              )}
            </div>
          </div>
        )}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{t("offer.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {quote.quoteNumber || quote.offerNumber}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Version {currentVersion}
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 mb-4">
          <p className="text-sm text-muted-foreground">
            {t("common.customer")}
          </p>
          <p className="font-semibold">{customer.companyName}</p>
          <p className="text-sm text-muted-foreground">
            {customer.contactPerson}
          </p>
        </div>

        {isExpired && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-5 mb-4">
            <h2 className="text-lg font-semibold text-destructive">
              {t("offer.expired")}
            </h2>
            <p className="text-sm text-destructive/90 mt-2">
              {t("offer.expiredMessage")}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t("offer.expiredHelp")}
            </p>
          </div>
        )}

        {/* Products in a single card with dividers */}
        {quote.items.length > 0 && (
          <div className="bg-card rounded-lg border border-border mb-4">
            {quote.items.map((item, index) => {
              const discounted = item.unitPrice * (1 - item.discount / 100);
              const lineTotal = (discounted + item.markingCost) * item.quantity;
              return (
                <div key={item.id}>
                  {index > 0 && <div className="border-t border-border" />}
                  <div className="p-4">
                    <div className="flex gap-4">
                      <div
                        className={`w-20 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${item.imageUrl ? "cursor-pointer" : ""}`}
                        onClick={() =>
                          item.imageUrl && setLightboxImage(item.imageUrl)
                        }
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.nextElementSibling?.classList.remove(
                                "hidden",
                              );
                            }}
                          />
                        ) : null}
                        <Package
                          size={24}
                          className={`text-muted-foreground/30 ${item.imageUrl ? "hidden" : ""}`}
                        />
                      </div>
                      {item.mockupImage && (
                        <div
                          className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-primary/20 cursor-pointer"
                          onClick={() => setLightboxImage(item.mockupImage)}
                        >
                          <img
                            src={item.mockupImage}
                            alt={`Mockup - ${item.product.name}`}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.product.productNumber}
                        </p>
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:gap-x-4 gap-x-4 gap-y-1 mt-2 text-sm">
                          <span className="text-muted-foreground">
                            {t("common.quantity")}:
                            <span className="sm:ml-1 hidden sm:inline text-foreground">
                              {item.quantity}
                            </span>
                          </span>
                          <span className="sm:hidden">{item.quantity}</span>
                          {item.showUnitPrice && (
                            <>
                              <span className="text-muted-foreground">
                                {t("offers.showUnitPrice")}:
                                <span className="sm:ml-1 hidden sm:inline text-foreground">
                                  €{formatEuro(item.unitPrice)}
                                </span>
                              </span>
                              <span className="sm:hidden">
                                €{formatEuro(item.unitPrice)}
                              </span>
                            </>
                          )}
                          {item.discount > 0 && (
                            <>
                              <span className="text-muted-foreground">
                                {t("common.discount")}:
                                <span className="sm:ml-1 hidden sm:inline text-foreground">
                                  -{item.discount}%
                                </span>
                              </span>
                              <span className="sm:hidden">
                                -{item.discount}%
                              </span>
                            </>
                          )}
                          {!item.hideMarkingCost && item.markingCost > 0 && (
                            <>
                              <span className="text-muted-foreground">
                                {t("offers.markingCost")}:
                                <span className="sm:ml-1 hidden sm:inline text-foreground">
                                  €{formatEuro(item.markingCost)}
                                </span>
                              </span>
                              <span className="sm:hidden">
                                €{formatEuro(item.markingCost)}
                              </span>
                            </>
                          )}
                        </div>
                        {item.showTotalPrice && (
                          <div className="flex justify-between border-t border-border pt-2 mt-2">
                            <span className="text-muted-foreground text-sm">
                              {t("common.total")}:
                            </span>
                            <span className="font-semibold">
                              €{formatEuro(lineTotal)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Special Costs + Total in a single card */}
        {quote.showTotalPrice && (
          <div className="bg-card rounded-lg border border-border mb-4">
            {(quote.specialCosts || []).length > 0 && (
              <div className="p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t("offers.specialCosts")}
                </p>
                <div className="space-y-1">
                  {(quote.specialCosts || []).map(
                    (cost: { name: string; amount: number }, index: number) => (
                      <div
                        key={`${cost.name}-${index}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{cost.name || t("offers.specialCostName")}</span>
                        <span>+ €{formatEuro(cost.amount)}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {(quote.specialCosts || []).length > 0 && (
              <div className="border-t border-border" />
            )}
            <div className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{t("offer.totalPrice")}</span>
                <span className="text-2xl font-bold">
                  €{formatEuro(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-lg border border-border p-4 mb-4">
          <p className="text-sm text-muted-foreground">
            {t("offer.validUntil")}
          </p>
          <p className="font-medium">{quote.validUntil}</p>
          {quote.additionalTerms && (
            <p className="text-sm text-muted-foreground mt-2">
              {quote.additionalTerms}
            </p>
          )}
        </div>

        {/* Show previous comments as history */}
        {quote.customerComments && quote.customerComments.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-4 mb-4">
            <p className="text-sm font-medium mb-3">Previous Comments</p>
            <div className="space-y-3">
              {quote.customerComments.map((c: CustomerComment, idx: number) => (
                <div key={idx} className="bg-muted/50 rounded-lg p-3 text-left">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.timestamp).toLocaleDateString()} at{" "}
                      {new Date(c.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {idx === quote.customerComments.length - 1 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-sm">
                    {c.comment || "No comment provided"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isExpired && !isDraft && (
          <div className="bg-card rounded-lg border border-border p-5 mb-4">
            <Label className="text-sm font-medium">
              {t("offer.comment")}
            </Label>
            <Textarea
              value={comment}
              onChange={e => !response && setComment(e.target.value)}
              placeholder={t("offer.commentPlaceholder")}
              className="mt-2"
              rows={3}
              readOnly={!!response}
            />
          </div>
        )}
      </div>

      {!isExpired && !isDraft && (
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-background/95 backdrop-blur border-t border-border p-4">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => handleResponse("rejected")}
              disabled={submitting || !!response}
            >
              <XCircle size={18} className="mr-2" /> {t("offer.reject")}
            </Button>
            <Button
              className="flex-1 h-12"
              onClick={() => handleResponse("accepted")}
              disabled={submitting || !!response}
            >
              <CheckCircle size={18} className="mr-2" /> {t("offer.accept")}
            </Button>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightboxImage(null)}
          >
            <X size={28} />
          </button>
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
