export type Language = "en" | "fi";

export const translations = {
  // Common
  "app.name": { en: "QuoteTool", fi: "QuoteTool" },
  "common.save": { en: "Save", fi: "Tallenna" },
  "common.cancel": { en: "Cancel", fi: "Peruuta" },
  "common.confirm": { en: "Confirm", fi: "Vahvista" },
  "common.delete": { en: "Delete", fi: "Poista" },
  "common.edit": { en: "Edit", fi: "Muokkaa" },
  "common.add": { en: "Add", fi: "Lisää" },
  "common.back": { en: "Back", fi: "Takaisin" },
  "common.next": { en: "Next", fi: "Seuraava" },
  "common.search": { en: "Search", fi: "Haku" },
  "common.actions": { en: "Actions", fi: "Toiminnot" },
  "common.name": { en: "Name", fi: "Nimi" },
  "common.email": { en: "Email", fi: "Sähköposti" },
  "common.password": { en: "Password", fi: "Salasana" },
  "common.role": { en: "Role", fi: "Rooli" },
  "common.created": { en: "Created", fi: "Luotu" },
  "common.updated": { en: "Updated", fi: "Päivitetty" },
  "common.status": { en: "Status", fi: "Tila" },
  "common.phone": { en: "Phone", fi: "Puhelin" },
  "common.contactPerson": { en: "Contact Person", fi: "Yhteyshenkilö" },
  "common.address": { en: "Address", fi: "Osoite" },
  "common.total": { en: "Total", fi: "Yhteensä" },
  "common.price": { en: "Price", fi: "Hinta" },
  "common.margin": { en: "Margin", fi: "Kate" },
  "common.customer": { en: "Customer", fi: "Asiakas" },
  "common.product": { en: "Product", fi: "Tuote" },
  "common.quantity": { en: "Quantity", fi: "Määrä" },
  "common.qty": { en: "Qty", fi: "Määrä" },
  "common.item": { en: "Item", fi: "Tuote" },
  "common.discount": { en: "Discount", fi: "Alennus" },
  "common.preview": { en: "Preview", fi: "Esikatselu" },
  "common.view": { en: "View", fi: "Näytä" },
  "common.send": { en: "Send", fi: "Lähetä" },
  "common.duplicate": { en: "Duplicate", fi: "Kopioi" },
  "common.amount": { en: "Amount", fi: "Summa" },
  "common.items": { en: "items", fi: "tuotetta" },
  "common.or": { en: "or", fi: "tai" },
  "common.days": { en: "Calendar days", fi: "Kalenteripäivää" },
  "common.allStatuses": { en: "All Statuses", fi: "Kaikki tilat" },
  "common.loading": { en: "Loading...", fi: "Ladataan..." },
  "common.error": { en: "Error", fi: "Virhe" },
  "common.success": { en: "Success", fi: "Onnistui" },
  "common.saving": { en: "Saving...", fi: "Tallennetaan..." },
  "common.optional": { en: "Optional", fi: "Valinnainen" },

  // Navigation
  "nav.dashboard": { en: "Dashboard", fi: "Kojelauta" },
  "nav.customers": { en: "Customers", fi: "Asiakkaat" },
  "nav.products": { en: "Products", fi: "Tuotteet" },
  "nav.offers": { en: "Offers", fi: "Tarjoukset" },
  "nav.orders": { en: "Orders", fi: "Tilaukset" },
  "nav.salesReports": { en: "Sales Reports", fi: "Myyntiraportit" },
  "nav.users": { en: "Users", fi: "Käyttäjät" },
  "nav.signout": { en: "Sign out", fi: "Kirjaudu ulos" },

  // Sales Reports
  "salesReports.title": { en: "Sales Reports", fi: "Myyntiraportit" },
  "salesReports.totalSales": { en: "Total Sales", fi: "Kokonaismyynti" },
  "salesReports.totalMargin": { en: "Total Margin", fi: "Kokonaiskate" },
  "salesReports.marginPercent": { en: "Margin %", fi: "Kate %" },
  "salesReports.totalOrders": { en: "Total Orders", fi: "Tilauksia yhteensä" },
  "salesReports.byCustomer": {
    en: "Sales by Customer",
    fi: "Myynti asiakkaittain",
  },
  "salesReports.customers": {
    en: "Customers",
    fi: "Asiakkaat",
  },
  "salesReports.bySalesperson": {
    en: "Sales by Salesperson",
    fi: "Myynti myyjittäin",
  },
  "salesReports.customer": { en: "Customer", fi: "Asiakas" },
  "salesReports.salesperson": { en: "Salesperson", fi: "Myyjä" },
  "salesReports.sales": { en: "Sales", fi: "Myynti" },
  "salesReports.margin": { en: "Margin", fi: "Kate" },
  "salesReports.orders": { en: "Orders", fi: "Tilaukset" },
  "salesReports.filterByDate": { en: "Date range", fi: "Aikaväli" },
  "salesReports.filterByCustomer": { en: "Customer", fi: "Asiakas" },
  "salesReports.filterBySalesperson": { en: "Salesperson", fi: "Myyjä" },
  "salesReports.allCustomers": { en: "All customers", fi: "Kaikki asiakkaat" },
  "salesReports.allSalespersons": {
    en: "All salespersons",
    fi: "Kaikki myyjät",
  },
  "salesReports.allTime": { en: "All time", fi: "Kaikki ajat" },
  "salesReports.today": { en: "Today", fi: "Tänään" },
  "salesReports.last7Days": { en: "Last 7 days", fi: "Viimeiset 7 päivää" },
  "salesReports.last30Days": { en: "Last 30 days", fi: "Viimeiset 30 päivää" },
  "salesReports.last90Days": { en: "Last 90 days", fi: "Viimeiset 90 päivää" },
  "salesReports.thisYear": { en: "This year", fi: "Tämä vuosi" },
  "salesReports.customRange": { en: "Custom range", fi: "Mukautettu aikaväli" },
  "salesReports.from": { en: "From", fi: "Alkaen" },
  "salesReports.to": { en: "To", fi: "Asti" },
  "salesReports.apply": { en: "Apply", fi: "Käytä" },
  "salesReports.clear": { en: "Clear filters", fi: "Tyhjennä suodattimet" },
  "salesReports.noData": {
    en: "No sales data found for the selected filters.",
    fi: "Valituilla suodattimilla ei löytynyt myyntitietoja.",
  },
  "salesReports.pickDate": { en: "Pick a date", fi: "Valitse päivämäärä" },
  "salesReports.loading": {
    en: "Loading report...",
    fi: "Ladataan raporttia...",
  },
  "salesReports.avgOrderValue": {
    en: "Avg Order Value",
    fi: "Keskim. tilausarvo",
  },
  "salesReports.topCustomer": { en: "Top Customer", fi: "Paras asiakas" },
  "salesReports.topSalesperson": { en: "Top Salesperson", fi: "Paras myyjä" },
  "salesReports.shareOfTotal": { en: "% of Total", fi: "% kokonais." },
  "salesReports.searchCustomerTable": {
    en: "Search customers...",
    fi: "Hae asiakkaita...",
  },
  "salesReports.searchSalespersonTable": {
    en: "Search salespersons...",
    fi: "Hae myyjiä...",
  },
  "salesReports.total": { en: "Total", fi: "Yhteensä" },
  "salesReports.exportCsv": { en: "Export CSV", fi: "Vie CSV" },
  "salesReports.avgMargin": { en: "Avg Margin %", fi: "Keskim. kate %" },
  "salesReports.noResults": { en: "No results", fi: "Ei tuloksia" },

  // Login
  "login.title": { en: "Sign in to QuoteTool", fi: "Kirjaudu QuoteTooliin" },
  "login.email": { en: "Email", fi: "Sähköposti" },
  "login.password": { en: "Password", fi: "Salasana" },
  "login.submit": { en: "Sign In", fi: "Kirjaudu" },
  "login.forgot": { en: "Forgot password?", fi: "Unohditko salasanan?" },
  "login.error": {
    en: "Invalid email or password",
    fi: "Virheellinen sähköposti tai salasana",
  },
  "login.subtitle": { en: "Sign in to your account", fi: "Kirjaudu tilillesi" },
  "login.invalidCredentials": {
    en: "Invalid credentials",
    fi: "Virheelliset tunnukset",
  },
  "login.checkEmail": {
    en: "Check email and try again.",
    fi: "Tarkista sähköposti ja yritä uudelleen.",
  },
  "login.phase1": {
    en: "Phase 1 — Internal Use Only",
    fi: "Vaihe 1 — Vain sisäiseen käyttöön",
  },

  // Forgot password
  "forgot.title": { en: "Reset Password", fi: "Nollaa salasana" },
  "forgot.subtitle": {
    en: "Enter your email to receive a reset link",
    fi: "Syötä sähköpostisi saadaksesi nollauslinkin",
  },
  "forgot.emailLabel": { en: "Email address", fi: "Sähköpostiosoite" },
  "forgot.submit": { en: "Send Reset Link", fi: "Lähetä nollauslinkki" },
  "forgot.sent": {
    en: "Password reset link sent!",
    fi: "Salasanan nollauslinkki lähetetty!",
  },
  "forgot.checkInbox": {
    en: "Check your inbox at",
    fi: "Tarkista postilaatikkosi osoitteessa",
  },
  "forgot.backToLogin": { en: "Back to Login", fi: "Takaisin kirjautumiseen" },

  // Dashboard
  "dashboard.title": { en: "Dashboard", fi: "Kojelauta" },
  "dashboard.subtitle": {
    en: "Overview of offers and sales activity",
    fi: "Yleiskatsaus tarjouksiin ja myyntitoimintaan",
  },
  "dashboard.totalOffers": { en: "Total Offers", fi: "Tarjouksia yhteensä" },
  "dashboard.activeOrders": {
    en: "Completed Orders",
    fi: "Aktiiviset tilaukset",
  },
  "dashboard.totalSales": { en: "Total Sales", fi: "Kokonaismyynti" },
  "dashboard.pendingApproval": {
    en: "Pending Approval",
    fi: "Odottaa hyväksyntää",
  },
  "dashboard.sentOffers": { en: "Sent Offers", fi: "Lähetetyt tarjoukset" },
  "dashboard.approvedOffers": {
    en: "Approved Offers",
    fi: "Hyväksytyt tarjoukset",
  },
  "dashboard.rejectedOffers": {
    en: "Rejected Offers",
    fi: "Hylätyt tarjoukset",
  },
  "dashboard.inProgressOffers": {
    en: "In Progress Offers",
    fi: "Keskeneräiset tarjoukset",
  },
  "dashboard.completedOffers": {
    en: "Completed Offers",
    fi: "Valmiit tarjoukset",
  },
  "dashboard.noOffers": { en: "No offers", fi: "Ei tarjouksia" },
  "dashboard.totalRevenue": { en: "Total Revenue", fi: "Kokonaisliikevaihto" },
  "dashboard.totalMargin": { en: "Total Margin", fi: "Kokonaiskate" },
  "dashboard.profitMargin": { en: "Profit Margin", fi: "Kateprosentti" },
  "dashboard.avgOrderValue": {
    en: "Avg Order Value",
    fi: "Keskimääräinen tilauksen arvo",
  },
  "dashboard.offerStatistics": {
    en: "Offer Statistics",
    fi: "Tarjoustilastot",
  },
  "dashboard.orderStatistics": { en: "Order Statistics", fi: "Tilaustilastot" },
  "dashboard.totalValue": { en: "Total Value", fi: "Kokonaisarvo" },
  "dashboard.avgValue": { en: "Avg Value", fi: "Keskimääräinen arvo" },
  "dashboard.totalItems": { en: "Total Items", fi: "Yhteensä tuotteita" },
  "dashboard.conversionRate": {
    en: "Conversion Rate",
    fi: "Konversioprosentti",
  },
  "dashboard.responseRate": {
    en: "Response Rate",
    fi: "Vastausprosentti",
  },
  "dashboard.avgItemsPerOffer": {
    en: "Avg Items/Offer",
    fi: "Keskimääräiset tuotteet/tarjous",
  },
  "dashboard.avgResponseTime": {
    en: "Avg Response Time",
    fi: "Keskimääräinen vastausaika",
  },
  "dashboard.byStatus": { en: "By Status", fi: "Tilan mukaan" },
  "dashboard.totalOrders": { en: "Total Orders", fi: "Yhteensä tilauksia" },
  "dashboard.avgMargin": { en: "Avg Margin", fi: "Keskimääräinen kate" },
  "dashboard.marginPercent": { en: "Margin %", fi: "Kate %" },
  "dashboard.avgItemsPerOrder": {
    en: "Avg Items/Order",
    fi: "Keskimääräiset tuotteet/tilaus",
  },
  "dashboard.recentOrders": {
    en: "Recent Orders",
    fi: "Viimeisimmät tilaukset",
  },
  "dashboard.noRecentOrders": {
    en: "No recent orders",
    fi: "Ei viimeisimpiä tilauksia",
  },
  "dashboard.seeAll": { en: "See all", fi: "Näytä kaikki" },

  // Users
  "users.title": { en: "User Management", fi: "Käyttäjähallinta" },
  "users.addUser": { en: "Add User", fi: "Lisää käyttäjä" },
  "users.editUser": { en: "Edit User", fi: "Muokkaa käyttäjää" },
  "users.createUser": { en: "Create New User", fi: "Luo uusi käyttäjä" },
  "users.superAdmin": { en: "Super Admin", fi: "Pääkäyttäjä" },
  "users.admin": { en: "Admin", fi: "Ylläpitäjä" },
  "users.userCount": { en: "users", fi: "käyttäjää" },
  "users.accessDenied": {
    en: "Access denied. Super Admin only.",
    fi: "Pääsy evätty. Vain pääkäyttäjille.",
  },
  "users.userCreated": {
    en: "User created successfully",
    fi: "Käyttäjä luotu onnistuneesti",
  },
  "users.userUpdated": { en: "User updated", fi: "Käyttäjä päivitetty" },
  "users.userRemoved": { en: "User removed", fi: "Käyttäjä poistettu" },

  // Products
  "products.title": { en: "Products", fi: "Tuotteet" },
  "products.search": { en: "Search products...", fi: "Hae tuotteita..." },
  "products.importExcel": { en: "Import Excel", fi: "Tuo Excel" },
  "products.createOffer": { en: "Create Offer", fi: "Luo tarjous" },
  "products.allCategories": { en: "All Categories", fi: "Kaikki kategoriat" },
  "products.allBrands": { en: "All Brands", fi: "Kaikki brändit" },
  "products.noProducts": {
    en: "No products found",
    fi: "Tuotteita ei löytynyt",
  },
  "products.brand": { en: "Brand", fi: "Brändi" },
  "products.salesPrice": { en: "Sales Price", fi: "Myyntihinta" },
  "products.purchasePrice": { en: "Purchase Price", fi: "Ostohinta" },
  "products.variants": { en: "Variants", fi: "Variantit" },
  "products.viewDetails": { en: "View Details", fi: "Näytä tiedot" },
  "products.editProduct": { en: "Edit Product", fi: "Muokkaa tuotetta" },
  "products.addProduct": { en: "Add Product", fi: "Lisää tuote" },
  "products.basicInfo": { en: "Basic Information", fi: "Perustiedot" },
  "products.productNumber": { en: "Product Number", fi: "Tuotenumero" },
  "products.name": { en: "Product Name", fi: "Tuotteen nimi" },
  "products.description": { en: "Description", fi: "Kuvaus" },
  "products.category": { en: "Category", fi: "Kategoria" },
  "products.pricing": { en: "Pricing", fi: "Hinnoittelu" },
  "products.color": { en: "Color", fi: "Väri" },
  "products.size": { en: "Size", fi: "Koko" },
  "products.sku": { en: "SKU", fi: "SKU" },
  "products.noVariants": {
    en: "No variants added yet",
    fi: "Ei variantteja lisätty vielä",
  },
  "products.deleteProduct": { en: "Delete Product", fi: "Poista tuote" },
  "products.deleteProducts": { en: "Delete Products", fi: "Poista tuotteet" },
  "products.deleteConfirmTitle": {
    en: "Are you sure?",
    fi: "Oletko varma?",
  },
  "products.deleteConfirmDesc": {
    en: "This action cannot be undone. This will permanently delete the selected product(s) from the database.",
    fi: "Tätä toimintoa ei voi kumota. Tämä poistaa valitut tuotteet pysyvästi tietokannasta.",
  },
  "products.deleteSuccess": {
    en: "Product(s) deleted successfully",
    fi: "Tuote/tuotteet poistettu onnistuneesti",
  },
  "products.deleteFailed": {
    en: "Failed to delete product(s)",
    fi: "Tuotteen/tuotteiden poistaminen epäonnistui",
  },
  "common.active": { en: "Active", fi: "Aktiivinen" },
  "common.inactive": { en: "Inactive", fi: "Ei-aktiivinen" },

  // Offers (renamed from Quotes)
  "offers.title": { en: "Offers", fi: "Tarjoukset" },
  "offers.newOffer": { en: "New Offer", fi: "Uusi tarjous" },
  "offers.offerItems": { en: "Offer Items", fi: "Tarjoustuotteet" },
  "offers.addProduct": { en: "Add Product", fi: "Lisää tuote" },
  "offers.sendOffer": { en: "Send Offer Email", fi: "Lähetä tarjousSähköposti" },
  "offers.duplicate": { en: "Duplicate", fi: "Kopioi" },
  "offers.validUntil": { en: "Valid Until", fi: "Voimassa" },
  "offers.additionalTerms": { en: "Additional Terms", fi: "Lisäehdot" },
  "offers.totalAmount": { en: "Total Amount", fi: "Kokonaissumma" },
  "offers.createOffer": { en: "Create Offer", fi: "Luo tarjous" },
  "offers.saveAsDraft": { en: "Save as Draft", fi: "Tallenna luonnoksena" },
  "offers.createAndSendEmail": { en: "Create & Send Email", fi: "Luo ja lähetä sähköposti" },
  "offers.sendingOffer": { en: "Sending...", fi: "Lähetetään..." },
  "offers.previewOffer": { en: "Preview Offer", fi: "Esikatsele tarjous" },
  "offers.duplicateOffer": { en: "Duplicate Offer", fi: "Kopioi tarjous" },
  "offers.searchOffers": { en: "Search offers...", fi: "Hae tarjouksia..." },
  "offers.offerNumber": { en: "Offer #", fi: "Tarjous #" },
  "offers.salesperson": { en: "Salesperson", fi: "Myyjä" },
  "offers.selectCustomer": { en: "Select Customer", fi: "Valitse asiakas" },
  "offers.selectProducts": { en: "Select Products", fi: "Valitse tuotteet" },
  "offers.review": { en: "Review", fi: "Tarkista" },
  "offers.searchCustomers": {
    en: "Search customers...",
    fi: "Hae asiakkaita...",
  },
  "offers.searchProducts": { en: "Search products...", fi: "Hae tuotteita..." },
  "offers.productsSelected": {
    en: "product(s) selected",
    fi: "tuotetta valittu",
  },
  "offers.selectedProducts": {
    en: "Selected Products",
    fi: "Valitut tuotteet",
  },
  "offers.otherDetails": {
    en: "Other offer details",
    fi: "Tarjouksen muut tiedot",
  },
  "offers.validityDate": {
    en: "Offer validity date",
    fi: "Tarjouksen viimeinen voimassa olopäivä",
  },
  "offers.validityRequired": {
    en: "Please fill in the offer validity date or number of days.",
    fi: "Täytä tarjouksen voimassaolopäivä tai päivien määrä.",
  },
  "offers.discountRangeError": {
    en: "Discount must be between 0 and 100",
    fi: "Alennuksen tulee olla välillä 0–100",
  },
  "offers.showTotalPrice": {
    en: "Calculate total price of the items",
    fi: "Laske tuotteiden kokonaishinta tarjoukseen",
  },
  "offers.extraText": {
    en: "Extra text to the offer",
    fi: "Lisälause tarjoukseen",
  },
  "offers.extraTextPlaceholder": {
    en: "Terms of the offer are...",
    fi: "Tarjouksen ehdot ovat...",
  },
  "offers.unitPrice": { en: "New unit price (€)", fi: "Uusi kpl hinta (€)" },
  "offers.quantity": { en: "Quantity", fi: "Kappalemäärä" },
  "offers.discount": { en: "Discount %", fi: "Ale %" },
  "offers.markingCost": { en: "Marking cost (€)", fi: "Painokulut (€)" },
  "offers.internalMarkingCost": {
    en: "Internal marking cost (€)",
    fi: "Sisäinen merkkauskulu (€)",
  },
  "offers.specialCosts": {
    en: "Special costs",
    fi: "Erityiskulut",
  },
  "offers.specialCostName": {
    en: "Line name",
    fi: "Rivin nimi",
  },
  "offers.specialCostAmount": {
    en: "Cost amount (€)",
    fi: "Kulun summa (€)",
  },
  "offers.addSpecialCost": {
    en: "Add special cost",
    fi: "Lisää erityiskulu",
  },
  "offers.showUnitPrice": { en: "Unit price", fi: "a-hinta" },
  "offers.showTotal": { en: "Total price", fi: "Kokonaishinta" },
  "offers.hideMarkingCost": {
    en: "Hide marking cost",
    fi: "Piilota painokulut",
  },
  "offers.generateMockup": { en: "Generate mockup", fi: "Tee vedos kuva" },
  "offers.otherDetailsSection": { en: "Other Details", fi: "Muut tiedot" },
  "offers.showTotalInOffer": {
    en: "Show total price in offer",
    fi: "Näytä kokonaishinta tarjouksessa",
  },
  "offers.orderHistory": { en: "Order History", fi: "Tilaushistoria" },
  "offers.backToOffers": { en: "Back to Offers", fi: "Takaisin tarjouksiin" },
  "offers.offerNotFound": {
    en: "Offer not found",
    fi: "Tarjousta ei löytynyt",
  },
  "offers.viewOffer": { en: "View Offer", fi: "Näytä tarjous" },
  "offers.createSalesOrder": {
    en: "Create Sales Order",
    fi: "Luo myyntitilaus",
  },
  "offers.noOffers": { en: "No offers yet", fi: "Ei tarjouksia vielä" },
  "offers.newOfferFromCustomer": { en: "New Offer", fi: "Uusi tarjous" },
  "offers.searchOffersPlaceholder": {
    en: "Search by offer number or customer name...",
    fi: "Hae tarjousnumerolla tai asiakkaan nimellä...",
  },
  "offers.allStatuses": { en: "All Statuses", fi: "Kaikki tilat" },
  "offers.retry": { en: "Retry", fi: "Yritä uudelleen" },
  "offers.noOffersFound": {
    en: "No offers found",
    fi: "Tarjouksia ei löytynyt",
  },
  "offers.tryAdjustingSearch": {
    en: "Try adjusting your search or filters",
    fi: "Yritä muuttaa hakua tai suodattimia",
  },
  "offers.customerResponse": {
    en: "Customer Response",
    fi: "Asiakkaan vastaus",
  },
  "offers.created": { en: "Created", fi: "Luotu" },
  "offers.updated": { en: "Updated", fi: "Päivitetty" },
  "offers.moreItems": { en: "more", fi: "lisää" },
  "offers.days": { en: "days", fi: "päivää" },
  "offers.accepted": { en: "✓ Accepted", fi: "✓ Hyväksytty" },
  "offers.rejected": { en: "✗ Rejected", fi: "✗ Hylätty" },
  "offers.pending": { en: "⏳ Pending", fi: "⏳ Odottaa" },
  "offers.status.draft": { en: "Draft", fi: "Luonnos" },
  "offers.status.sent": { en: "Sent", fi: "Lähetetty" },
  "offers.status.accepted": { en: "Accepted", fi: "Hyväksytty" },
  "offers.status.rejected": { en: "Rejected", fi: "Hylätty" },
  "offers.status.expired": { en: "Expired", fi: "Vanhentunut" },
  "offers.status.completed": { en: "Completed", fi: "Valmis" },

  // Orders
  "orders.title": { en: "Orders", fi: "Tilaukset" },
  "orders.salesOrders": { en: "Sales Orders", fi: "Myyntitilaukset" },
  "orders.createOrder": { en: "Create Order", fi: "Luo tilaus" },
  "orders.orderNumber": { en: "Order #", fi: "Tilaus #" },
  "orders.offerRef": { en: "Offer Ref", fi: "Tarjousviite" },
  "orders.viewOffer": { en: "View Offer", fi: "Näytä tarjous" },
  "orders.viewOrder": { en: "View Order", fi: "Näytä tilaus" },
  "orders.viewOrders": { en: "View Orders", fi: "Näytä tilaukset" },
  "orders.orderDetails": { en: "Order Details", fi: "Tilaustiedot" },
  "orders.offerDetails": { en: "Offer Details", fi: "Tarjouksen tiedot" },
  "orders.exportPdf": { en: "Export PDF", fi: "Vie PDF" },
  "orders.from": { en: "From", fi: "Lähteestä" },
  "orders.downloadPrintSheet": {
    en: "Download print sheet",
    fi: "Lataa painoarkki",
  },
  "orders.item": { en: "Item", fi: "Tuote" },
  "orders.quantityLabel": {
    en: "Quantity (how many will be ordered)",
    fi: "Kappalemäärä (kuinka monta tilataan)",
  },
  "orders.color": { en: "Color", fi: "Väri" },
  "orders.size": { en: "Size", fi: "Koko" },
  "orders.printingMethod": { en: "Printing method", fi: "Merkkausmenetelmä" },
  "orders.markingCost": { en: "Marking Cost", fi: "Painokulut" },
  "orders.createPrintSheet": {
    en: "Create printing info sheet",
    fi: "Tee työkortti",
  },
  "orders.createPrintSheetDesc": {
    en: "Create printing info sheet for printing company",
    fi: "Luo painokortti painoyritykselle",
  },
  "orders.editOffer": { en: "Edit offer", fi: "Muokkaa tarjousta" },
  "orders.sendConfirmation": {
    en: "Send the order confirmation",
    fi: "Lähetä tilausvahvistus",
  },
  "orders.printSheets": { en: "Print Sheets", fi: "Työkortit" },
  "orders.noPrintSheets": {
    en: "No printing sheets created",
    fi: "Ei luotuja työkortteja",
  },
  "orders.sendToPress": {
    en: "Send print sheets to press",
    fi: "Lähetä työkortit painoon",
  },
  "orders.sendDesc": {
    en: "Send info sheets or create file manually",
    fi: "Lähetä työkortit tai luo tiedosto manuaalisesti",
  },
  "orders.orderSummary": { en: "Order", fi: "Tilaus" },
  "orders.viewFinalOrder": {
    en: "View the final order",
    fi: "Näytä lopullinen tilaus",
  },
  "orders.sendOrderConfirmation": {
    en: "Send order confirmation",
    fi: "Lähetä tilausvahvistus",
  },
  "orders.searchOrderId": {
    en: "Search by order or offer number...",
    fi: "Hae tilaus- tai tarjousnumerolla...",
  },
  "orders.searchCustomerName": {
    en: "Search by customer name...",
    fi: "Hae asiakasnimellä...",
  },
  "orders.filterByStatus": {
    en: "Filter by status",
    fi: "Suodata tilan mukaan",
  },
  "orders.clearFilters": {
    en: "Clear Filters",
    fi: "Tyhjennä suodattimet",
  },
  "orders.loadingOrders": {
    en: "Loading orders...",
    fi: "Ladataan tilauksia...",
  },
  "orders.status.pending": {
    en: "Pending",
    fi: "Odottaa",
  },
  "orders.status.processing": {
    en: "Processing",
    fi: "Käsittelyssä",
  },
  "orders.status.completed": {
    en: "Completed",
    fi: "Valmis",
  },
  "orders.status.cancelled": {
    en: "Cancelled",
    fi: "Peruutettu",
  },
  "orders.cancelOrder": {
    en: "Cancel",
    fi: "Peruuta",
  },
  "orders.completeOrder": {
    en: "Complete",
    fi: "Merkitse valmiiksi",
  },
  "orders.exportPdfError": {
    en: "Failed to export order PDF.",
    fi: "Tilauksen PDF:n vienti epäonnistui.",
  },
  "orders.fetchError": {
    en: "Failed to fetch orders",
    fi: "Tilausten nouto epäonnistui",
  },
  "orders.fetchErrorRetry": {
    en: "Failed to fetch orders. Please try again later.",
    fi: "Tilausten nouto epäonnistui. Yritä uudelleen myöhemmin.",
  },
  "orders.confirmDelete": {
    en: "Are you sure you want to delete this order?",
    fi: "Haluatko varmasti poistaa tämän tilauksen?",
  },
  "orders.deleteSuccess": {
    en: "Order deleted successfully",
    fi: "Tilaus poistettu onnistuneesti",
  },
  "orders.deleteError": {
    en: "Failed to delete order",
    fi: "Tilauksen poistaminen epäonnistui",
  },
  "orders.statusChangeConfirmTitle": {
    en: "Confirm Status Change",
    fi: "Vahvista tilan muutos",
  },
  "orders.statusChangeConfirmDescription": {
    en: 'Are you sure you want to change the order status to "{{status}}"? This action will notify the customer.',
    fi: 'Haluatko varmasti muuttaa tilauksen tilaksi "{{status}}"? Tämä ilmoittaa asiakkaalle.',
  },
  "orders.statusUpdateSuccess": {
    en: "Order status updated successfully",
    fi: "Tilauksen tila päivitetty onnistuneesti",
  },
  "orders.statusUpdateError": {
    en: "Failed to update order status",
    fi: "Tilauksen tilan päivitys epäonnistui",
  },
  "orders.statusUpdateErrorRetry": {
    en: "Failed to update order status. Please try again.",
    fi: "Tilauksen tilan päivitys epäonnistui. Yritä uudelleen.",
  },

  // Customers
  "customers.title": { en: "Customers", fi: "Asiakkaat" },
  "customers.search": { en: "Search customers...", fi: "Hae asiakkaita..." },
  "customers.searchByName": {
    en: "Search by name, contact or business ID...",
    fi: "Hae nimellä, yhteyshenkilöllä tai Y-tunnuksella...",
  },
  "customers.addCustomer": { en: "Add Customer", fi: "Lisää asiakas" },
  "customers.newCustomer": { en: "New Customer", fi: "Uusi asiakas" },
  "customers.createCustomer": { en: "Create Customer", fi: "Luo asiakas" },
  "customers.companyName": { en: "Company Name", fi: "Yrityksen nimi" },
  "customers.contactPerson": { en: "Contact Person", fi: "Yhteyshenkilö" },
  "customers.type": { en: "Type", fi: "Tyyppi" },
  "customers.company": { en: "Company", fi: "Yritys" },
  "customers.contact": { en: "Contact", fi: "Yhteyshenkilö" },
  "customers.businessId": { en: "Business ID", fi: "Y-tunnus" },
  "customers.businessIdHint": {
    en: "Requires a valid Finnish Business ID (e.g. 1234567-8). If you don't have one, leave this field empty.",
    fi: "Vaatii voimassa olevan suomalaisen Y-tunnuksen (esim. 1234567-8). Jos sinulla ei ole sellaista, jätä tämä kenttä tyhjäksi.",
  },
  "customers.city": { en: "City", fi: "Kaupunki" },
  "customers.postcode": { en: "Postcode", fi: "Postinumero" },
  "customers.country": { en: "Country", fi: "Maa" },
  "customers.phone": { en: "Phone", fi: "Puhelin" },
  "customers.email": { en: "Email", fi: "Sähköposti" },
  "customers.address": { en: "Address", fi: "Osoite" },
  "customers.sales": { en: "Sales", fi: "Myynti" },
  "customers.notFound": {
    en: "Customer not found",
    fi: "Asiakasta ei löytynyt",
  },
  "customers.backToCustomers": {
    en: "Back to Customers",
    fi: "Takaisin asiakkaisiin",
  },
  "customers.totalSales": { en: "Total Sales", fi: "Kokonaismyynti" },
  "customers.totalMargin": { en: "Total Margin", fi: "Kokonaiskate" },
  "customers.discountPercent": { en: "Discount", fi: "Alennus" },
  "customers.approvalRate": { en: "Approval Rate", fi: "Hyväksymisprosentti" },
  "customers.totalOffers": { en: "Total Offers", fi: "Tarjouksia yhteensä" },
  "customers.viewDetails": { en: "View Details", fi: "Näytä tiedot" },
  "customers.salesOrders": { en: "Sales Orders", fi: "Myyntitilaukset" },
  "customers.noOffersYet": { en: "No offers yet", fi: "Ei tarjouksia vielä" },
  "customers.noOrdersYet": { en: "No orders yet", fi: "Ei tilauksia vielä" },
  "customers.joinDate": { en: "Join Date", fi: "Liittymispäivä" },
  "customers.loadingCustomer": {
    en: "Loading customer...",
    fi: "Ladataan asiakasta...",
  },
  "customers.failedToFetchCustomer": {
    en: "Failed to fetch customer",
    fi: "Asiakkaan nouto epäonnistui",
  },
  "customers.customerUpdatedSuccessfully": {
    en: "Customer updated successfully",
    fi: "Asiakas päivitetty onnistuneesti",
  },
  "customers.failedToUpdateCustomer": {
    en: "Failed to update customer",
    fi: "Asiakkaan päivitys epäonnistui",
  },
  "customers.customerInfo": {
    en: "Customer Information",
    fi: "Asiakastiedot",
  },
  "customers.editCustomerInfo": {
    en: "Edit customer details and save them to the database.",
    fi: "Muokkaa asiakastietoja ja tallenna ne tietokantaan.",
  },
  "customers.contactDetails": {
    en: "Overview",
    fi: "Yhteenveto",
  },
  "customers.saveChanges": {
    en: "Save Changes",
    fi: "Tallenna muutokset",
  },
  "customers.notes": {
    en: "Customer notes",
    fi: "Asiakasmuistiinpanot",
  },
  "customers.notesPlaceholder": {
    en: "Write internal notes about this customer...",
    fi: "Kirjoita sisäisiä muistiinpanoja tästä asiakkaasta...",
  },
  "customers.notesHelp": {
    en: "These notes are internal and stay on the customer record.",
    fi: "Nämä muistiinpanot ovat sisäisiä ja pysyvät asiakaskortilla.",
  },
  "customers.typeProspect": { en: "Prospect", fi: "Prospekti" },
  "customers.typeActive": { en: "Active", fi: "Aktiivinen" },
  "customers.typeVip": { en: "VIP", fi: "VIP" },
  "customers.filterByDate": {
    en: "Filter by date",
    fi: "Suodata päivämäärän mukaan",
  },
  "customers.allTime": { en: "All time", fi: "Kaikki ajat" },
  "customers.last1Month": { en: "Last 1 month", fi: "Viimeinen 1 kuukausi" },
  "customers.last2Months": { en: "Last 2 months", fi: "Viimeiset 2 kuukautta" },
  "customers.last3Months": { en: "Last 3 months", fi: "Viimeiset 3 kuukautta" },
  "customers.last4Months": { en: "Last 4 months", fi: "Viimeiset 4 kuukautta" },
  "customers.last5Months": { en: "Last 5 months", fi: "Viimeiset 5 kuukautta" },
  "customers.last6Months": { en: "Last 6 months", fi: "Viimeiset 6 kuukautta" },
  "customers.last9Months": { en: "Last 9 months", fi: "Viimeiset 9 kuukautta" },
  "customers.last12Months": {
    en: "Last 12 months",
    fi: "Viimeiset 12 kuukautta",
  },
  "customers.last1Year": { en: "Last 1 year", fi: "Viimeinen 1 vuosi" },
  "customers.last2Years": { en: "Last 2 years", fi: "Viimeiset 2 vuotta" },
  "customers.last3Years": { en: "Last 3 years", fi: "Viimeiset 3 vuotta" },
  "customers.customRange": { en: "Custom range", fi: "Mukautettu aikaväli" },
  "customers.from": { en: "From", fi: "Alkaen" },
  "customers.to": { en: "To", fi: "Asti" },
  "customers.applyFilter": { en: "Apply", fi: "Käytä" },
  "customers.clearFilter": { en: "Clear", fi: "Tyhjennä" },
  "customers.pickDate": { en: "Pick a date", fi: "Valitse päivämäärä" },
  "customers.companyLogo": { en: "Company Logo", fi: "Yrityksen logo" },
  "customers.uploadLogo": { en: "Upload Logo", fi: "Lataa logo" },
  "customers.changeLogo": { en: "Change", fi: "Vaihda" },

  // Offer view (public)
  "offer.title": { en: "Offer", fi: "Tarjous" },
  "offer.accept": { en: "Accept offer", fi: "Hyväksy tarjous" },
  "offer.reject": { en: "Reject offer", fi: "Hylkää tarjous" },
  "offer.comment": { en: "Comment (optional)", fi: "Kommentti (valinnainen)" },
  "offer.commentPlaceholder": {
    en: "Add a comment or request changes...",
    fi: "Lisää kommentti tai pyydä muutoksia...",
  },
  "offer.accepted": { en: "Offer accepted!", fi: "Tarjous hyväksytty!" },
  "offer.rejected": { en: "Offer rejected", fi: "Tarjous hylätty" },
  "offer.acceptedMessage": {
    en: "Thank you! We will process your order and get back to you shortly.",
    fi: "Kiitos! Käsittelemme tilauksesi ja otamme sinuun yhteyttä pian.",
  },
  "offer.rejectedMessage": {
    en: "Thank you for your response. We will follow up with you.",
    fi: "Kiitos vastauksestasi. Otamme sinuun yhteyttä.",
  },
  "offer.validUntil": { en: "Offer valid until", fi: "Tarjous voimassa" },
  "offer.totalPrice": { en: "Total", fi: "Yhteensä" },
  "offer.expired": { en: "Offer expired", fi: "Tarjous on vanhentunut" },
  "offer.expiredMessage": {
    en: "This offer is no longer valid because its validity date has passed.",
    fi: "Tämä tarjous ei ole enää voimassa, koska sen voimassaoloaika on päättynyt.",
  },
  "offer.expiredHelp": {
    en: "Please contact us if you would like an updated offer.",
    fi: "Ota meihin yhteyttä, jos haluat päivitetyn tarjouksen.",
  },
  "offer.notFound": { en: "Offer not found", fi: "Tarjousta ei löytynyt" },
  "offer.notFoundDesc": {
    en: "This offer link may be invalid or expired.",
    fi: "Tämä tarjouslinkki voi olla virheellinen tai vanhentunut.",
  },
  "offer.yourComment": { en: "Your comment:", fi: "Kommenttisi:" },
  "offer.pcs": { en: "pcs", fi: "kpl" },
  "offer.draftNotice": {
    en: "This offer has not been saved yet.",
    fi: "Tätä tarjousta ei ole vielä tallennettu.",
  },
  "offer.draftNoticeDesc": {
    en: "Save the offer to send it to the customer.",
    fi: "Tallenna tarjous lähettääksesi sen asiakkaalle.",
  },

  // Printing Sheet
  "printingSheet.title": { en: "Printing Sheet", fi: "Työkortti" },
  "printingSheet.singleTitle": {
    en: "Info sheet for printing company",
    fi: "Painoyrityksen työkortti",
  },
  "printingSheet.multiTitle": {
    en: "Create new printing sheets",
    fi: "Luo uusia työkortteja",
  },
  "printingSheet.viewingSheetFor": {
    en: "Viewing sheet for",
    fi: "Näytetään työkortti tuotteelle",
  },
  "printingSheet.newSheetsHeadingSingle": {
    en: "Create new printing sheet",
    fi: "Luo uusi työkortti",
  },
  "printingSheet.newSheetsHeadingPlural": {
    en: "Create new printing sheets",
    fi: "Luo uudet työkortit",
  },
  "printingSheet.savedSheetsHeadingSingle": {
    en: "Previously saved sheet",
    fi: "Aiemmin tallennettu työkortti",
  },
  "printingSheet.savedSheetsHeadingPlural": {
    en: "Previously saved sheets",
    fi: "Aiemmin tallennetut työkortit",
  },
  "printingSheet.noProductsSelected": {
    en: "No products selected",
    fi: "Tuotteita ei ole valittu",
  },
  "printingSheet.workSheetLabel": { en: "Work sheet", fi: "Työkortti" },
  "printingSheet.orderDate": { en: "Order date", fi: "Tilauspäivä" },
  "printingSheet.seller": { en: "Seller", fi: "Myyjä" },
  "printingSheet.sellerPlaceholder": {
    en: "Enter seller name",
    fi: "Kirjoita myyjän nimi",
  },
  "printingSheet.reference": { en: "Reference", fi: "Viite" },
  "printingSheet.deliveryDate": { en: "Delivery Date", fi: "Toimituspäivä" },
  "printingSheet.deliveryTime": { en: "Delivery Time", fi: "Toimitusaika" },
  "printingSheet.printMethod": { en: "Printing Method", fi: "Painomenetelmä" },
  "printingSheet.printMethodOther": {
    en: "Other printing method",
    fi: "Muu merkkaustapa",
  },
  "printingSheet.sizeQuantities": { en: "Size Quantities", fi: "Kokomäärät" },
  "printingSheet.workInstructions": {
    en: "Work Instructions",
    fi: "Työohjeet",
  },
  "printingSheet.workInstructionsPlaceholder": {
    en: "Enter work instructions...",
    fi: "Kirjoita työohjeet...",
  },
  "printingSheet.productImageLabel": {
    en: "Product image with logo",
    fi: "Tuotekuva logolla",
  },
  "printingSheet.productImageDescription": {
    en: "(print product pic. here with AI logo)",
    fi: "(tulosta tuotekuva tähän AI-logolla)",
  },
  "printingSheet.productMockupArea": {
    en: "Product mockup area",
    fi: "Tuotteen luonnosalue",
  },
  "printingSheet.selectDeliveryTimePlaceholder": {
    en: "Choose delivery time",
    fi: "Valitse toimitusaika",
  },
  "printingSheet.selectPrintMethodPlaceholder": {
    en: "Choose printing method",
    fi: "Valitse merkkaustapa",
  },
  "printingSheet.missingFieldsTitle": {
    en: "Missing required fields",
    fi: "Pakollisia tietoja puuttuu",
  },
  "printingSheet.validationErrorSeller": {
    en: "Seller is required",
    fi: "Myyjä on pakollinen",
  },
  "printingSheet.validationErrorDeliveryTime": {
    en: "Delivery time is required",
    fi: "Toimitusaika on pakollinen",
  },
  "printingSheet.validationErrorPrintMethod": {
    en: "Printing method is required",
    fi: "Merkkaustapa on pakollinen",
  },
  "printingSheet.validationErrorToastTitle": {
    en: "Validation Error",
    fi: "Validointivirhe",
  },
  "printingSheet.validationErrorToastDescription": {
    en: "Please fill in all required fields marked in red",
    fi: "Täytä kaikki punaisella merkityt pakolliset kentät",
  },
  "printingSheet.validationBackendDescription": {
    en: "Please check all required fields and try again",
    fi: "Tarkista kaikki pakolliset kentät ja yritä uudelleen",
  },
  "printingSheet.errorLoadDescription": {
    en: "Failed to load data. Please try again.",
    fi: "Tietojen lataus epäonnistui. Yritä uudelleen.",
  },
  "printingSheet.sheetsSavedDescription": {
    en: "printing sheet(s) saved successfully!",
    fi: "työkortti(t) tallennettu onnistuneesti!",
  },
  "printingSheet.errorSaveDescription": {
    en: "Failed to save printing sheets. Please try again.",
    fi: "Työkorttien tallennus epäonnistui. Yritä uudelleen.",
  },
  "printingSheet.errorPdfDescription": {
    en: "Failed to generate PDF.",
    fi: "PDF:n luonti epäonnistui.",
  },
  "printingSheet.deleteSuccess": {
    en: "Printing sheet deleted",
    fi: "Työkortti poistettu",
  },
  "printingSheet.deleteError": {
    en: "Failed to delete printing sheet(s)",
    fi: "Työkorttien poisto epäonnistui",
  },
  "printingSheet.createButton": {
    en: "Create Printing Sheet",
    fi: "Luo työkortti",
  },
  "printingSheet.cancelButton": { en: "Cancel", fi: "Peruuta" },

  // Language
  "lang.en": { en: "English", fi: "Englanti" },
  "lang.fi": { en: "Finnish", fi: "Suomi" },

  // Users page
  "users.fetchError": {
    en: "Failed to fetch users",
    fi: "Käyttäjien nouto epäonnistui",
  },
  "users.unexpectedError": {
    en: "An unexpected error occurred",
    fi: "Tapahtui odottamaton virhe",
  },
  "users.userUpdatedToast": { en: "User updated", fi: "Käyttäjä päivitetty" },
  "users.userRemovedToast": { en: "User removed", fi: "Käyttäjä poistettu" },
  "users.deleteFailed": {
    en: "Failed to delete user",
    fi: "Käyttäjän poistaminen epäonnistui",
  },
  "users.resetPassword": { en: "Reset Password", fi: "Nollaa salasana" },
  "users.sending": { en: "Sending...", fi: "Lähetetään..." },
  "users.sendResetLink": { en: "Send Reset Link", fi: "Lähetä nollauslinkki" },
  "users.passwordResetLinkSent": {
    en: "Password reset link sent",
    fi: "Salasanan nollauslinkki lähetetty",
  },
  "users.passwordResetLinkSentDesc": {
    en: "A password reset link has been sent to",
    fi: "Salasanan nollauslinkki on lähetetty osoitteeseen",
  },
  "users.failedToSendResetLink": {
    en: "Failed to send reset link",
    fi: "Nollauslinkin lähetys epäonnistui",
  },
  "users.errorOccurred": { en: "An error occurred", fi: "Tapahtui virhe" },

  // Quote Detail page
  "quoteDetail.failedToUpdateOffer": {
    en: "Failed to update offer",
    fi: "Tarjouksen päivitys epäonnistui",
  },
  "quoteDetail.failedToResendOffer": {
    en: "Failed to resend offer",
    fi: "Tarjouksen uudelleenlähetys epäonnistui",
  },
  "quoteDetail.offerSent": {
    en: "Offer sent successfully! Email sent to customer.",
    fi: "Tarjous lähetettiin onnistuneesti! Sähköposti lähetettiin asiakkaalle.",
  },
  "quoteDetail.failedToSendOffer": {
    en: "Failed to send offer",
    fi: "Tarjouksen lähetys epäonnistui",
  },
  "quoteDetail.failedToSendOfferRetry": {
    en: "Failed to send offer. Please try again.",
    fi: "Tarjouksen lähetys epäonnistui. Yritä uudelleen.",
  },
  "quoteDetail.pending": { en: "⏳ Pending", fi: "⏳ Odottaa" },
  "quoteDetail.awaitingResponse": {
    en: "Awaiting Response",
    fi: "Odottaa vastausta",
  },
  "quoteDetail.noCommentProvided": {
    en: "No comment provided",
    fi: "Kommenttia ei annettu",
  },

  // Order Confirmation page
  "orderConfirmation.failedToFetchOrder": {
    en: "Failed to fetch order",
    fi: "Tilauksen nouto epäonnistui",
  },
  "orderConfirmation.orderSentToPress": {
    en: "Order has been sent to press",
    fi: "Tilaus on lähetetty painoon",
  },
  "orderConfirmation.failedToSendOrderToPress": {
    en: "Failed to send order to press",
    fi: "Tilauksen lähettäminen painoon epäonnistui",
  },
  "orderConfirmation.failedToSendOrderConfirmation": {
    en: "Failed to send order confirmation",
    fi: "Tilausvahvistuksen lähetys epäonnistui",
  },
  "orderConfirmation.orderNotFound": {
    en: "Order not found",
    fi: "Tilausta ei löytynyt",
  },

  // Quote Duplicate page
  "quoteDuplicate.atLeastOneItemRequired": {
    en: "At least one item is required",
    fi: "Vähintään yksi tuote vaaditaan",
  },
  "quoteDuplicate.failedToDuplicateOffer": {
    en: "Failed to duplicate offer",
    fi: "Tarjouksen kopioiminen epäonnistui",
  },

  // Quotes page
  "quotes.failedToFetchOffers": {
    en: "Failed to fetch offers",
    fi: "Tarjousten nouto epäonnistui",
  },
  "quotes.failedToDeleteOffer": {
    en: "Failed to delete offer",
    fi: "Tarjouksen poisto epäonnistui",
  },

  // Orders page
  "orders.failedToRetrieveOrder": {
    en: "Failed to retrieve order",
    fi: "Tilauksen nouto epäonnistui",
  },
  "orders.directPdfExportError": {
    en: "Direct PDF export error",
    fi: "Suoran PDF-virhe",
  },

  // Forgot Password page
  "forgotPassword.failedToSendResetEmail": {
    en: "Failed to send reset email",
    fi: "Nollausviestin lähetys epäonnistui",
  },

  // Dashboard page
  "dashboard.failedToLoadData": {
    en: "Failed to load dashboard data",
    fi: "Kojetiedon lataus epäonnistui",
  },
  "dashboard.refreshDashboard": {
    en: "Refresh dashboard",
    fi: "Päivitä kojelauta",
  },

  // Offer View page
  "offerView.failedToSubmitResponse": {
    en: "Failed to submit response",
    fi: "Vastauksen lähetys epäonnistui",
  },

  // User Create page
  "userCreate.validationError": {
    en: "Validation Error",
    fi: "Validointivirhe",
  },
  "userCreate.pleaseCheckInput": {
    en: "Please check your input",
    fi: "Tarkista syöteesi",
  },
  "userCreate.emailAlreadyExists": {
    en: "Email Already Exists",
    fi: "Sähköposti on jo käytössä",
  },
  "userCreate.userWithEmailExists": {
    en: "A user with this email already exists",
    fi: "Tällä sähköpostilla on jo käyttäjä",
  },
  "userCreate.failedToCreateUser": {
    en: "Failed to create user",
    fi: "Käyttäjän luonti epäonnistui",
  },
  "userCreate.networkError": { en: "Network Error", fi: "Verkkovirhe" },
  "userCreate.unableToConnect": {
    en: "Unable to connect to server. Please try again.",
    fi: "Yhteys palvelimeen epäonnistui. Yritä uudelleen.",
  },

  // Customers page
  "customers.demoCustomersCreated": {
    en: "Demo customers have been created",
    fi: "Demoasiakkaat on luotu",
  },
  "customers.failedToFetchCustomers": {
    en: "Failed to fetch customers",
    fi: "Asiakkaiden nouto epäonnistui",
  },
  "customers.customerCreatedSuccessfully": {
    en: "Customer created successfully",
    fi: "Asiakas luotu onnistuneesti",
  },
  "customers.failedToCreateCustomer": {
    en: "Failed to create customer",
    fi: "Asiakkaan luonti epäonnistui",
  },
  "customers.customerDeletedSuccessfully": {
    en: "Customer deleted successfully",
    fi: "Asiakas poistettu onnistuneesti",
  },
  "customers.failedToDeleteCustomer": {
    en: "Failed to delete customer",
    fi: "Asiakkaan poisto epäonnistui",
  },

  // Reset Password page
  "resetPassword.passwordsDoNotMatch": {
    en: "Passwords do not match",
    fi: "Salasanat eivät täsmää",
  },
  "resetPassword.failedToResetPassword": {
    en: "Failed to reset password",
    fi: "Salasanan nollaus epäonnistui",
  },
  "resetPassword.enterNewPassword": {
    en: "Enter new password",
    fi: "Syötä uusi salasana",
  },
  "resetPassword.confirmNewPassword": {
    en: "Confirm new password",
    fi: "Vahvista uusi salasana",
  },

  // Order Create page
  "orderCreate.failedToFetchOffer": {
    en: "Failed to fetch offer",
    fi: "Tarjouksen nouto epäonnistui",
  },
  "orderCreate.failedToCreateOrder": {
    en: "Failed to create order",
    fi: "Tilauksen luonti epäonnistui",
  },
  "orderCreate.printingMethod": { en: "Printing method", fi: "Painomenetelmä" },
  "orderCreate.screenPrinting": { en: "Screen Printing", fi: "Silkkipaino" },
  "orderCreate.dtg": { en: "DTG", fi: "DTG" },
  "orderCreate.heatTransfer": { en: "Heat Transfer", fi: "Lämpösiirto" },
  "orderCreate.embroidery": { en: "Embroidery", fi: "Kirjonta" },

  // New Quote page
  "newQuote.failedToFetchCustomers": {
    en: "Failed to fetch customers",
    fi: "Asiakkaiden nouto epäonnistui",
  },
  "newQuote.failedToFetchProducts": {
    en: "Failed to fetch products",
    fi: "Tuotteiden nouto epäonnistui",
  },
  "newQuote.failedToCreateOffer": {
    en: "Failed to create offer",
    fi: "Tarjouksen luonti epäonnistui",
  },

  // Product Import Dialog
  "productImport.invalidFileType": {
    en: "Invalid file type",
    fi: "Virheellinen tiedostotyyppi",
  },
  "productImport.uploadExcelFile": {
    en: "Please upload an Excel file (.xlsx or .xls)",
    fi: "Lataa Excel-tiedosto (.xlsx tai .xls)",
  },
  "productImport.fileTooLarge": {
    en: "File too large",
    fi: "Tiedosto on liian suuri",
  },
  "productImport.uploadSmallerFile": {
    en: "Please upload a file smaller than 5MB",
    fi: "Lataa alle 5MB:n tiedosto",
  },
  "productImport.importSuccessful": {
    en: "Import successful",
    fi: "Tuonti onnistui",
  },
  "productImport.importFailed": {
    en: "Import failed",
    fi: "Tuonti epäonnistui",
  },
  "productImport.importError": { en: "Import error", fi: "Tuontivirhe" },
  "productImport.failedToImportProducts": {
    en: "Failed to import products. Please try again.",
    fi: "Tuotteiden tuonti epäonnistui. Yritä uudelleen.",
  },

  // Product Picker Dialog
  "productPicker.failedToFetchProducts": {
    en: "Failed to fetch products",
    fi: "Tuotteiden nouto epäonnistui",
  },

  // Pagination
  "pagination.goToPreviousPage": {
    en: "Go to previous page",
    fi: "Siirry edelliselle sivulle",
  },
  "pagination.next": { en: "Next", fi: "Seuraava" },

  // Sidebar
  "sidebar.toggleSidebar": {
    en: "Toggle Sidebar",
    fi: "Avaa/Sulje sivupalkki",
  },

  // API failure
  "api.failure": { en: "API failure", fi: "API-virhe" },
  "api.unknownError": { en: "Unknown error", fi: "Tuntematon virhe" },

  // Users page additional
  "users.searchPlaceholder": {
    en: "Search by name or email...",
    fi: "Hae nimellä tai sähköpostilla...",
  },
  "users.allRoles": { en: "All Roles", fi: "Kaikki roolit" },
  "users.loadingUsers": { en: "Loading users...", fi: "Ladataan käyttäjiä..." },
  "users.retry": { en: "Retry", fi: "Yritä uudelleen" },
  "users.noUsersFound": { en: "No users found", fi: "Käyttäjiä ei löytynyt" },
  "users.sendPasswordResetLink": {
    en: "Send Password Reset Link",
    fi: "Lähetä salasanan nollauslinkki",
  },
  "users.userLabel": { en: "User:", fi: "Käyttäjä:" },
  "users.whatHappensNext": {
    en: "What happens next?",
    fi: "Mitä tapahtuu seuraavaksi?",
  },
  "users.userWillReceiveEmail": {
    en: "User will receive an email with a reset link",
    fi: "Käyttäjä saa sähköpostin, jossa on nollauslinkki",
  },
  "users.canClickLinkToReset": {
    en: "They can click link to reset their password",
    fi: "He voivat klikata linkkiä nollatakseen salasanansa",
  },
  "users.willBeRedirectedToResetPage": {
    en: "They will be redirected to reset page",
    fi: "Heidät ohjataan nollaussivulle",
  },
  "users.canSetNewPassword": {
    en: "They can set a new password",
    fi: "He voivat asettaa uuden salasanan",
  },
  "users.passwordResetLinkWillBeSent": {
    en: "A password reset link will be sent to this email address.",
    fi: "Salasanan nollauslinkki lähetetään tähän sähköpostiosoitteeseen.",
  },

  // Common loading messages
  "common.loadingProducts": {
    en: "Loading products...",
    fi: "Ladataan tuotteita...",
  },
  "common.loadingCustomers": {
    en: "Loading customers...",
    fi: "Ladataan asiakkaita...",
  },
  "common.loadingOffers": {
    en: "Loading offers...",
    fi: "Ladataan tarjouksia...",
  },
  "common.loadingOrders": {
    en: "Loading orders...",
    fi: "Ladataan tilauksia...",
  },
  "common.loadingUsers": {
    en: "Loading users...",
    fi: "Ladataan käyttäjiä...",
  },
  "common.loadingData": { en: "Loading data...", fi: "Ladataan tietoja..." },
  "common.loadingPrintingSheets": {
    en: "Loading printing sheets...",
    fi: "Ladataan työkortteja...",
  },
  "common.noProductsFound": {
    en: "No products found",
    fi: "Tuotteita ei löytynyt",
  },
  "common.noCustomersFound": {
    en: "No customers found",
    fi: "Asiakkaita ei löytynyt",
  },
  "common.noOffersFound": {
    en: "No offers found",
    fi: "Tarjouksia ei löytynyt",
  },
  "common.noOrdersFound": {
    en: "No orders found",
    fi: "Tilauksia ei löytynyt",
  },
  "common.noUsersFound": { en: "No users found", fi: "Käyttäjiä ei löytynyt" },

  // Order Confirmation page additional
  "orderConfirmation.customerDetails": {
    en: "Customer Details",
    fi: "Asiakastiedot",
  },
  "orderConfirmation.customerName": {
    en: "Customer Name",
    fi: "Asiakkaan nimi",
  },
  "orderConfirmation.productsInGroup": {
    en: "products in group",
    fi: "tuotetta ryhmässä",
  },
  "orderConfirmation.downloadPdf": {
    en: "Download PDF",
    fi: "Lataa PDF",
  },
  "orderConfirmation.pages": {
    en: "pages",
    fi: "sivua",
  },
  "orderConfirmation.viewDetails": {
    en: "View Details",
    fi: "Näytä tiedot",
  },
  "orderConfirmation.brandiVaate": {
    en: "Brändi vaate",
    fi: "Brändi vaate",
  },
  "orderConfirmation.workCard": {
    en: "work card",
    fi: "työkortti",
  },
  "orderConfirmation.address": {
    en: "Vaunukatu 11, 20100 Turku",
    fi: "Vaunukatu 11, 20100 Turku",
  },
  "orderConfirmation.email": {
    en: "email: patricia@brandivaate.fi",
    fi: "sähköposti: patricia@brandivaate.fi",
  },
  "orderConfirmation.businessId": {
    en: "Business ID: 2912646-7",
    fi: "Y-tunnus: 2912646-7",
  },
  "orderConfirmation.orderDate": {
    en: "Order date:",
    fi: "Tilaus pvm:",
  },
  "orderConfirmation.reference": {
    en: "Reference:",
    fi: "Viite:",
  },
  "orderConfirmation.seller": {
    en: "Seller:",
    fi: "Myyjä:",
  },
  "orderConfirmation.deliveryDate": {
    en: "Delivery date:",
    fi: "Toimitus aika:",
  },
  "orderConfirmation.deliveryTime": {
    en: "Delivery time:",
    fi: "Toimitusaika:",
  },
  "orderConfirmation.customer": {
    en: "Customer:",
    fi: "Asiakas:",
  },
  "orderConfirmation.product": {
    en: "Product",
    fi: "Tuote",
  },
  "orderConfirmation.printingMethod": {
    en: "Printing method",
    fi: "Merkkaus tapa",
  },
  "orderConfirmation.printingMethodOther": {
    en: "Other printing method",
    fi: "Merkkaus tapa muu",
  },
  "orderConfirmation.sizeQty": {
    en: "Size / QTY",
    fi: "Koko / KPL",
  },
  "orderConfirmation.size": {
    en: "Size",
    fi: "Koko",
  },
  "orderConfirmation.total": {
    en: "Total",
    fi: "Yhteensä",
  },
  "orderConfirmation.quantity": {
    en: "Quantity",
    fi: "Määrä",
  },
  "orderConfirmation.workInstructions": {
    en: "Work Instructions",
    fi: "Työohje",
  },
  "orderConfirmation.productImageWithLogo": {
    en: "Product image with logo",
    fi: "Tuotekuva logolla",
  },
  "orderConfirmation.printProductPic": {
    en: "(print product pic. here with AI logo)",
    fi: "(tulosta tuotekuva tähän AI-logolla)",
  },
  "orderConfirmation.totalAmount": {
    en: "Total Amount",
    fi: "Kokonaissumma",
  },
  "orderConfirmation.summary": {
    en: "Summary",
    fi: "Yhteenveto",
  },
  "orderConfirmation.price": {
    en: "Price",
    fi: "Hinta",
  },
  "orderConfirmation.totalMargin": {
    en: "Total Margin",
    fi: "Kokonaiskate",
  },
  "orderConfirmation.costConfigBreakdown": {
    en: "Margin adjustments applied",
    fi: "Sovelletut kateoikaisut",
  },
  "orderConfirmation.sending": {
    en: "Sending...",
    fi: "Lähetetään...",
  },
  "orderConfirmation.noCustomerEmail": {
    en: "No customer email address available for this order.",
    fi: "Tälle tilaukselle ei ole saatavilla asiakkaan sähköpostiosoitetta.",
  },
  "orderConfirmation.orderConfirmationEmailSent": {
    en: "Order confirmation email sent to",
    fi: "Tilausvahvistus lähetetty osoitteeseen",
  },
  "orderConfirmation.failedToFetchOrderRetry": {
    en: "Failed to fetch order. Please try again later.",
    fi: "Tilauksen nouto epäonnistui. Yritä uudelleen myöhemmin.",
  },
  "orderConfirmation.failedToSendOrderToPressRetry": {
    en: "Failed to send order to press. Please try again.",
    fi: "Tilauksen lähettäminen painoon epäonnistui. Yritä uudelleen.",
  },
  "orderConfirmation.failedToSendOrderConfirmationRetry": {
    en: "Failed to send order confirmation. Please try again.",
    fi: "Tilausvahvistuksen lähetys epäonnistui. Yritä uudelleen.",
  },
  "orderConfirmation.lineItems": {
    en: "Line Items",
    fi: "Rivituotteet",
  },
  "orderConfirmation.subtotal": {
    en: "Subtotal",
    fi: "Välisumma",
  },

  // Filter translations
  "filters.advancedFilters": { en: "Advanced Filters", fi: "Lisäsuodattimet" },
  "filters.amountRange": { en: "Amount Range", fi: "Summa-alue" },
  "filters.marginRange": { en: "Margin Range", fi: "Kate-alue" },
  "filters.dateRange": { en: "Created Date Range", fi: "Luontipäivämäärä" },
  "filters.min": { en: "Min", fi: "Min" },
  "filters.max": { en: "Max", fi: "Max" },
  "filters.clearAll": { en: "Clear All Filters", fi: "Tyhjennä suodattimet" },
  "filters.contactPerson": { en: "Contact Person", fi: "Yhteyshenkilö" },
  "filters.searchContactPerson": {
    en: "Search contact person...",
    fi: "Hae yhteyshenkilöä...",
  },
  "filters.searchSalesperson": {
    en: "Search salesperson...",
    fi: "Hae myyjää...",
  },
  "filters.allResponses": { en: "All Responses", fi: "Kaikki vastaukset" },
  "filters.noResponse": { en: "No Response", fi: "Ei vastausta" },

  // Navigation - Settings
  "nav.settings": { en: "Settings", fi: "Asetukset" },

  // Settings page
  "settings.title": { en: "Settings", fi: "Asetukset" },
  "settings.subtitle": {
    en: "Manage your application configuration and preferences",
    fi: "Hallinnoi sovelluksen asetuksia ja mieltymyksiä",
  },
  "settings.saved": {
    en: "Settings saved successfully",
    fi: "Asetukset tallennettu",
  },

  // Settings tabs
  "settings.tabCompany": { en: "Company", fi: "Yritys" },
  "settings.tabOffers": { en: "Offers", fi: "Tarjoukset" },
  "settings.tabCosts": { en: "Margin Settings", fi: "Kateasetukset" },
  "settings.tabEmail": { en: "Email", fi: "Sähköposti" },
  "settings.tabApiKeys": { en: "API Keys", fi: "API-avaimet" },

  // Company info
  "settings.companyInfo": { en: "Company Information", fi: "Yritystiedot" },
  "settings.companyInfoDesc": {
    en: "This information appears on offers, orders, and invoices",
    fi: "Nämä tiedot näkyvät tarjouksissa, tilauksissa ja laskuissa",
  },
  "settings.companyName": { en: "Company Name", fi: "Yrityksen nimi" },
  "settings.businessId": { en: "Business ID", fi: "Y-tunnus" },
  "settings.vatId": { en: "VAT ID", fi: "ALV-tunnus" },
  "settings.website": { en: "Website", fi: "Verkkosivusto" },
  "settings.streetAddress": { en: "Street Address", fi: "Katuosoite" },
  "settings.postalCode": { en: "Postal Code", fi: "Postinumero" },
  "settings.city": { en: "City", fi: "Kaupunki" },
  "settings.country": { en: "Country", fi: "Maa" },

  // Offer defaults
  "settings.offerDefaults": {
    en: "Offer Defaults",
    fi: "Tarjouksen oletukset",
  },
  "settings.offerDefaultsDesc": {
    en: "Default values applied when creating new offers",
    fi: "Oletusarvot, joita käytetään uusien tarjousten luomisessa",
  },
  "settings.validityDays": {
    en: "Validity Period (days)",
    fi: "Voimassaoloaika (päivää)",
  },
  "settings.paymentTerms": { en: "Payment Terms", fi: "Maksuehdot" },
  "settings.deliveryTerms": { en: "Delivery Terms", fi: "Toimitusehdot" },
  "settings.currency": { en: "Currency", fi: "Valuutta" },
  "settings.vatRate": { en: "VAT Rate", fi: "ALV-prosentti" },
  "settings.defaultLanguage": { en: "Default Language", fi: "Oletuskieli" },
  "settings.footerNote": {
    en: "Offer Footer Note",
    fi: "Tarjouksen alatunniste",
  },
  "settings.footerNotePlaceholder": {
    en: "e.g. Thank you for your business!",
    fi: "esim. Kiitos yhteistyöstä!",
  },

  // Cost calculation
  "settings.costCalculation": {
    en: "Cost & Profit Margin Calculation",
    fi: "Kulu- ja katelaskenta",
  },
  "settings.costCalculationDesc": {
    en: "Define cost items (printing, shipping, handling) and profit margins applied per order",
    fi: "Määrittele kuluerät (painatus, toimitus, käsittely) ja katemarginaalit tilauksittain",
  },
  "settings.addCostItem": { en: "Add Cost Item", fi: "Lisää kuluerä" },
  "settings.editCostItem": { en: "Edit Cost Item", fi: "Muokkaa kuluerää" },
  "settings.costType": { en: "Type", fi: "Tyyppi" },
  "settings.fixedAmount": { en: "Fixed Amount", fi: "Kiinteä summa" },
  "settings.percentage": { en: "Percentage", fi: "Prosentti" },
  "settings.defaultValue": { en: "Default Value", fi: "Oletusarvo" },
  "settings.enabled": { en: "Enabled", fi: "Käytössä" },
  "settings.disabled": { en: "Disabled", fi: "Pois käytöstä" },
  "settings.costSaved": { en: "Cost item saved", fi: "Kuluerä tallennettu" },
  "settings.costSaveError": {
    en: "Failed to save cost item",
    fi: "Kuluerän tallennus epäonnistui",
  },
  "settings.costDeleted": { en: "Cost item deleted", fi: "Kuluerä poistettu" },
  "settings.costDeleteError": {
    en: "Failed to delete cost item",
    fi: "Kuluerän poisto epäonnistui",
  },
  "settings.costLoadError": {
    en: "Failed to load cost configuration",
    fi: "Kulumäärityksen lataus epäonnistui",
  },
  "settings.noCostItems": {
    en: "No cost or margin items configured yet. Add your first item to get started.",
    fi: "Kulu- tai kate-eriä ei ole vielä määritetty. Lisää ensimmäinen erä aloittaaksesi.",
  },
  "settings.category": { en: "Category", fi: "Kategoria" },
  "settings.categoryCost": {
    en: "Overhead Cost",
    fi: "Yleiskustannus",
  },
  "settings.categoryMargin": {
    en: "Profit / Margin",
    fi: "Tuotto / Kate",
  },
  "settings.categoryCostHelp": {
    en: "Overhead costs (e.g. shipping, handling) reduce the profit margin when an order is created.",
    fi: "Yleiskustannukset (esim. toimitus, käsittely) vähentävät katetta tilauksen luonnin yhteydessä.",
  },
  "settings.categoryMarginHelp": {
    en: "Margin items (e.g. profit margin, surcharges) increase the calculated profit when an order is created.",
    fi: "Kate-erät (esim. tuottomarginaali, lisämaksut) kasvattavat laskettua tuottoa tilauksen luonnin yhteydessä.",
  },
  "settings.costConfigInfo": {
    en: "How it works",
    fi: "Näin se toimii",
  },
  "settings.costConfigInfoDesc": {
    en: "Enabled items are automatically applied when creating orders. Overhead costs reduce the profit margin, while margin items increase it. Fixed amounts apply per order; percentages are calculated on the order total.",
    fi: "Käytössä olevat erät sovelletaan automaattisesti tilauksia luotaessa. Yleiskustannukset vähentävät katetta, kate-erät kasvattavat sitä. Kiinteät summat ovat tilauskohtaisia; prosenttiosuudet lasketaan tilauksen kokonaissummasta.",
  },
  "settings.deleteCostTitle": {
    en: "Delete Cost Item?",
    fi: "Poista kuluerä?",
  },
  "settings.deleteCostWarning": {
    en: "This will permanently remove this cost/margin item from the configuration. It will no longer be applied to new orders. Existing orders are not affected.",
    fi: "Tämä poistaa kulu-/kate-erän pysyvästi määrityksestä. Sitä ei enää sovelleta uusiin tilauksiin. Olemassa oleviin tilauksiin tämä ei vaikuta.",
  },
  "settings.costNamePlaceholder": {
    en: "e.g. Embroidery fee",
    fi: "esim. Brodeerausmaksu",
  },
  "settings.costNameRequired": {
    en: "Please enter a name for the cost item",
    fi: "Anna kuluerälle nimi",
  },
  "settings.costValueInvalid": {
    en: "Value must be zero or a positive number",
    fi: "Arvon on oltava nolla tai positiivinen luku",
  },
  "settings.costPercentageMax": {
    en: "Percentage value cannot exceed 100%",
    fi: "Prosenttiarvo ei voi ylittää 100 %",
  },

  // Custom margin settings
  "settings.customMarginTitle": {
    en: "Custom Margin Percentage",
    fi: "Mukautettu kateprosentti",
  },
  "settings.customMarginDesc": {
    en: "Set a global custom margin percentage and choose how it applies to your products.",
    fi: "Aseta globaali mukautettu kateprosentti ja valitse, miten sitä käytetään tuotteissasi.",
  },
  "settings.customMarginPercentage": {
    en: "Custom Margin (%)",
    fi: "Mukautettu kate (%)",
  },
  "settings.customMarginSaved": {
    en: "Custom margin percentage saved",
    fi: "Mukautettu kateprosentti tallennettu",
  },
  "settings.customMarginSaveError": {
    en: "Failed to save custom margin percentage",
    fi: "Mukautetun kateprosentin tallennus epäonnistui",
  },
  "settings.customMarginLoadError": {
    en: "Failed to load custom margin settings",
    fi: "Mukautetun kateasetuksen lataus epäonnistui",
  },
  "settings.marginModeLabel": {
    en: "Margin Mode",
    fi: "Katetila",
  },
  "settings.marginModeFallback": {
    en: "Fallback",
    fi: "Varavaihtoehto",
  },
  "settings.marginModeFallbackDesc": {
    en: "Use the custom margin percentage only for products that don't have their own margin (margin is 0%).",
    fi: "Käytä mukautettua kateprosenttia vain tuotteille, joilla ei ole omaa katetta (kate on 0 %).",
  },
  "settings.marginModeOverride": {
    en: "Override",
    fi: "Ylikirjoita",
  },
  "settings.marginModeOverrideDesc": {
    en: "Use the custom margin percentage for all products, overriding their individual calculated margins.",
    fi: "Käytä mukautettua kateprosenttia kaikille tuotteille, ohittaen niiden omat lasketut katteet.",
  },
  "settings.marginModeDesc": {
    en: "Choose how the custom margin percentage is applied when calculating order margins.",
    fi: "Valitse, miten mukautettua kateprosenttia käytetään tilauksen katteen laskennassa.",
  },
  "settings.overrideActiveWarning": {
    en: "All product margins will be overridden with the custom percentage",
    fi: "Kaikkien tuotteiden katteet ylikirjoitetaan mukautetulla prosentilla",
  },
  "settings.overrideConfirmTitle": {
    en: "Enable Override Mode?",
    fi: "Ota ylikirjoitustila käyttöön?",
  },
  "settings.overrideConfirmDesc": {
    en: "Override mode will replace all individual product margin percentages with the custom margin value when creating orders. This affects every product. Are you sure you want to continue?",
    fi: "Ylikirjoitustila korvaa kaikkien tuotteiden omat kateprosentit mukautetulla katearvolla tilauksia luotaessa. Tämä vaikuttaa kaikkiin tuotteisiin. Haluatko varmasti jatkaa?",
  },
  "settings.overrideConfirmAction": {
    en: "Enable Override",
    fi: "Ota ylikirjoitus käyttöön",
  },
  "settings.unsavedChanges": {
    en: "You have unsaved changes",
    fi: "Sinulla on tallentamattomia muutoksia",
  },
  "settings.allChangesSaved": {
    en: "All changes saved",
    fi: "Kaikki muutokset tallennettu",
  },
  "products.useCustomMargin": {
    en: "Use custom margin from settings",
    fi: "Käytä asetuksien mukautettua katetta",
  },
  "products.useCustomMarginHelp": {
    en: "When enabled, this product will use the global custom margin percentage from Settings instead of its own calculated margin.",
    fi: "Kun käytössä, tämä tuote käyttää asetuksista löytyvää globaalia mukautettua kateprosenttia oman lasketun katteen sijaan.",
  },
  "products.productMargin": {
    en: "Product Margin",
    fi: "Tuotteen kate",
  },
  "products.marginAutoCalcHint": {
    en: "Leave at 0 to auto-calculate margin from purchase and sales price.",
    fi: "Jätä 0:ksi, niin kate lasketaan automaattisesti osto- ja myyntihinnan perusteella.",
  },
  "products.customMarginFromSettings": {
    en: "Custom Margin (from Settings)",
    fi: "Mukautettu kate (asetuksista)",
  },

  // Email settings
  "settings.smtpSettings": { en: "SMTP Configuration", fi: "SMTP-asetukset" },
  "settings.smtpSettingsDesc": {
    en: "Configure the email server used for sending notifications",
    fi: "Määrittele sähköpostipalvelin ilmoitusten lähettämistä varten",
  },
  "settings.smtpHost": { en: "SMTP Host", fi: "SMTP-palvelin" },
  "settings.smtpPort": { en: "SMTP Port", fi: "SMTP-portti" },
  "settings.fromEmail": { en: "From Email", fi: "Lähettäjän sähköposti" },
  "settings.emailNotifications": {
    en: "Email Notifications",
    fi: "Sähköposti-ilmoitukset",
  },
  "settings.emailNotificationsDesc": {
    en: "Choose which events trigger automatic email notifications to customers",
    fi: "Valitse, mitkä tapahtumat lähettävät automaattiset sähköposti-ilmoitukset asiakkaille",
  },
  "settings.trigger": { en: "Trigger Event", fi: "Laukaiseva tapahtuma" },
  "settings.emailSubject": { en: "Subject", fi: "Aihe" },
  "settings.triggerOfferSent": { en: "Offer Sent", fi: "Tarjous lähetetty" },
  "settings.triggerOfferAccepted": {
    en: "Offer Accepted",
    fi: "Tarjous hyväksytty",
  },
  "settings.triggerOfferRejected": {
    en: "Offer Rejected",
    fi: "Tarjous hylätty",
  },
  "settings.triggerOfferExpired": {
    en: "Offer Expired",
    fi: "Tarjous vanhentunut",
  },
  "settings.triggerOrderConfirmed": {
    en: "Order Confirmed",
    fi: "Tilaus vahvistettu",
  },
  "settings.triggerOrderShipped": {
    en: "Order Shipped",
    fi: "Tilaus lähetetty",
  },

  // API Keys
  "settings.apiKeysTitle": { en: "API Keys", fi: "API-avaimet" },
  "settings.apiKeysDesc": {
    en: "Manage API keys for external service integrations (printing, shipping, payment)",
    fi: "Hallinnoi API-avaimia ulkoisten palvelujen integrointiin (painatus, toimitus, maksu)",
  },
  "settings.addApiKey": { en: "Add API Key", fi: "Lisää API-avain" },
  "settings.apiKey": { en: "API Key", fi: "API-avain" },
  "settings.apiKeyAdded": { en: "API key added", fi: "API-avain lisätty" },
  "settings.apiKeyDeleted": {
    en: "API key deleted",
    fi: "API-avain poistettu",
  },
  "settings.service": { en: "Service", fi: "Palvelu" },
  "settings.noApiKeys": { en: "No API keys configured", fi: "Ei API-avaimia" },
  "settings.apiKeyNamePlaceholder": {
    en: "e.g. Production API key",
    fi: "esim. Tuotannon API-avain",
  },
  "settings.apiKeyPlaceholder": {
    en: "Paste your API key here",
    fi: "Liitä API-avain tähän",
  },
  "settings.servicePrinting": { en: "Printing", fi: "Painatus" },
  "settings.serviceShipping": { en: "Shipping", fi: "Toimitus" },
  "settings.serviceEmail": { en: "Email", fi: "Sähköposti" },
  "settings.servicePayment": { en: "Payment", fi: "Maksu" },
  "settings.serviceOther": { en: "Other", fi: "Muu" },

  // Email template editor
  "settings.emailTemplates": { en: "Email Templates", fi: "Sähköpostimallit" },
  "settings.emailTemplatesDesc": {
    en: "Customize the email templates sent by the system. Use {{variable}} placeholders for dynamic content.",
    fi: "Muokkaa järjestelmän lähettämiä sähköpostimalleja. Käytä {{muuttuja}}-paikkamerkkejä dynaamiselle sisällölle.",
  },
  "settings.templateName": { en: "Template", fi: "Malli" },
  "settings.templatePasswordReset": {
    en: "Password Reset",
    fi: "Salasanan palautus",
  },
  "settings.templateOfferSent": { en: "Offer Sent", fi: "Tarjous lähetetty" },
  "settings.templateOrderConfirmation": {
    en: "Order Confirmation",
    fi: "Tilausvahvistus",
  },
  "settings.templateOrderStatusUpdate": {
    en: "Order Status Update",
    fi: "Tilauksen tilan päivitys",
  },
  "settings.templateOfferAcceptedAdmin": {
    en: "Offer Accepted (Admin)",
    fi: "Tarjous hyväksytty (Ylläpito)",
  },
  "settings.templateOfferRejectedAdmin": {
    en: "Offer Rejected (Admin)",
    fi: "Tarjous hylätty (Ylläpito)",
  },
  "settings.templateOfferAcceptedCustomer": {
    en: "Offer Accepted (Customer)",
    fi: "Tarjous hyväksytty (Asiakas)",
  },
  "settings.templateOfferRejectedCustomer": {
    en: "Offer Rejected (Customer)",
    fi: "Tarjous hylätty (Asiakas)",
  },
  "settings.editTemplate": { en: "Edit Template", fi: "Muokkaa mallia" },
  "settings.templateBody": { en: "HTML Body", fi: "HTML-sisältö" },
  "settings.htmlEditor": { en: "HTML Editor", fi: "HTML-editori" },
  "settings.preview": { en: "Preview", fi: "Esikatselu" },
  "settings.availableVariables": {
    en: "Available variables",
    fi: "Käytettävissä olevat muuttujat",
  },
  "settings.subjectPlaceholder": {
    en: "Email subject line…",
    fi: "Sähköpostin aihe…",
  },
  "settings.recipientEmail": {
    en: "From Email",
    fi: "Lähettäjän sähköposti",
  },
  "settings.recipientEmailPlaceholder": {
    en: "e.g. admin@company.com",
    fi: "esim. admin@yritys.fi",
  },
  "settings.recipientEmailHelp": {
    en: "The email address used as the sender for this notification. Required when the template is enabled.",
    fi: "Sähköpostiosoite, jota käytetään tämän ilmoituksen lähettäjänä. Pakollinen, kun malli on käytössä.",
  },
  "settings.recipientEmailRequired": {
    en: "Please enter a from email address before enabling this admin template.",
    fi: "Anna lähettäjän sähköpostiosoite ennen tämän ylläpitomallin käyttöönottoa.",
  },
  "settings.recipientEmailCannotClear": {
    en: "Cannot remove from email while the template is enabled. Disable the template first.",
    fi: "Lähettäjän sähköpostia ei voi poistaa, kun malli on käytössä. Poista malli ensin käytöstä.",
  },
  "settings.resetToDefault": {
    en: "Reset to Default",
    fi: "Palauta oletukseksi",
  },
  "settings.templateSaved": {
    en: "Template saved successfully",
    fi: "Malli tallennettu onnistuneesti",
  },
  "settings.templateSaveError": {
    en: "Failed to save template",
    fi: "Mallin tallennus epäonnistui",
  },
  "settings.templateReset": {
    en: "Template reset to default",
    fi: "Malli palautettu oletusarvoon",
  },
  "settings.templateResetError": {
    en: "Failed to reset template",
    fi: "Mallin palautus epäonnistui",
  },
  "settings.emailLoadError": {
    en: "Failed to load email templates",
    fi: "Sähköpostimallien lataus epäonnistui",
  },
  "settings.noTemplates": {
    en: "No email templates found",
    fi: "Sähköpostimalleja ei löytynyt",
  },
  "settings.disableTemplateTitle": {
    en: "Disable Email Template?",
    fi: "Poista sähköpostimalli käytöstä?",
  },
  "settings.disableTemplateWarning": {
    en: "Disabling this template will completely stop this type of email from being sent to customers. No email will be delivered until the template is re-enabled. Are you sure you want to continue?",
    fi: "Tämän mallin poistaminen käytöstä estää kokonaan tämäntyyppisten sähköpostien lähettämisen asiakkaille. Sähköposteja ei lähetetä ennen kuin malli otetaan uudelleen käyttöön. Haluatko varmasti jatkaa?",
  },
  "settings.disableTemplateConfirm": {
    en: "Yes, Disable",
    fi: "Kyllä, poista käytöstä",
  },

  // Global Admin Email
  "settings.globalAdminEmailTitle": {
    en: "Global Admin Email",
    fi: "Yleinen ylläpidon sähköposti",
  },
  "settings.globalAdminEmailDesc": {
    en: "Set a global admin email address to receive CC copies of all administration notification emails.",
    fi: "Aseta yleinen ylläpidon sähköpostiosoite vastaanottamaan kopiot kaikista hallinnon ilmoitussähköposteista.",
  },
  "settings.globalAdminEmailLabel": {
    en: "Admin Email Address",
    fi: "Ylläpidon sähköpostiosoite",
  },
  "settings.globalAdminEmailPlaceholder": {
    en: "e.g. admin@company.com",
    fi: "esim. admin@yritys.fi",
  },
  "settings.globalAdminEmailSuperadminOnly": {
    en: "Only a superadmin can modify this setting.",
    fi: "Vain pääkäyttäjä voi muokata tätä asetusta.",
  },
  "settings.ccGlobalAdminLabel": {
    en: "CC All Admin Notifications",
    fi: "Kopioi kaikki ylläpitoilmoitukset",
  },
  "settings.ccGlobalAdminDesc": {
    en: "When enabled, a copy (CC) of every administration notification email will be sent to the global admin email address.",
    fi: "Kun käytössä, kopio (CC) jokaisesta hallinnon ilmoitussähköpostista lähetetään yleiseen ylläpidon sähköpostiosoitteeseen.",
  },
  "settings.globalAdminSaved": {
    en: "Global admin email settings saved",
    fi: "Yleisen ylläpidon sähköpostiasetukset tallennettu",
  },
  "settings.globalAdminSaveError": {
    en: "Failed to save global admin email settings",
    fi: "Yleisen ylläpidon sähköpostiasetusten tallennus epäonnistui",
  },

  // Mockup generation
  "mockup.title": {
    en: "Generate Product Mockup",
    fi: "Luo tuotevedos",
  },
  "mockup.productImage": {
    en: "Product Image",
    fi: "Tuotekuva",
  },
  "mockup.selectLogo": {
    en: "Select Logo / Design Image",
    fi: "Valitse logo / suunnittelukuva",
  },
  "mockup.useCompanyLogo": {
    en: "Use company logo",
    fi: "Käytä yrityksen logoa",
  },
  "mockup.companyLogoAvailable": {
    en: "Company logo available",
    fi: "Yrityksen logo saatavilla",
  },
  "mockup.noCompanyLogo": {
    en: "No company logo uploaded for this customer",
    fi: "Tälle asiakkaalle ei ole ladattu yrityksen logoa",
  },
  "mockup.uploadCustomLogo": {
    en: "Upload custom image",
    fi: "Lataa oma kuva",
  },
  "mockup.uploadCustomLogoDesc": {
    en: "Upload a custom logo or design to place on the product",
    fi: "Lataa oma logo tai suunnittelukuva tuotteelle",
  },
  "mockup.chooseLogo": {
    en: "Choose file",
    fi: "Valitse tiedosto",
  },
  "mockup.changeLogo": {
    en: "Change",
    fi: "Vaihda",
  },
  "mockup.generate": {
    en: "Generate Mockup",
    fi: "Luo vedos",
  },
  "mockup.regenerate": {
    en: "Regenerate Mockup",
    fi: "Luo vedos uudelleen",
  },
  "mockup.generating": {
    en: "Generating...",
    fi: "Luodaan...",
  },
  "mockup.result": {
    en: "Generated Mockup",
    fi: "Luotu vedos",
  },
  "mockup.removeMockup": {
    en: "Remove",
    fi: "Poista",
  },
  "mockup.viewMockup": {
    en: "View Mockup",
    fi: "Näytä vedos",
  },
  "mockup.noLogoSelected": {
    en: "Please select or upload a logo image",
    fi: "Valitse tai lataa logo-kuva",
  },
  "mockup.noProductImage": {
    en: "No product image available",
    fi: "Tuotekuvaa ei ole saatavilla",
  },
  "mockup.generationFailed": {
    en: "Failed to generate mockup. Please try again.",
    fi: "Vedoksen luonti epäonnistui. Yritä uudelleen.",
  },
  "mockup.invalidFileType": {
    en: "Please select an image file (PNG, JPG, SVG, WebP)",
    fi: "Valitse kuvatiedosto (PNG, JPG, SVG, WebP)",
  },
  "mockup.fileTooLarge": {
    en: "Image must be under 5MB",
    fi: "Kuvan on oltava alle 5 Mt",
  },
  "mockup.batchTitle": {
    en: "Mockup Generation",
    fi: "Vedosten luonti",
  },
  "mockup.generateAll": {
    en: "Generate All Mockups",
    fi: "Luo kaikki vedokset",
  },
  "mockup.generatedImage": {
    en: "Generated mockup image",
    fi: "Luotu vedoskuva",
  },
  "mockup.pendingWarning": {
    en: "Please generate the mockup image or turn off mockup generation",
    fi: "Luo vedoskuva tai poista vedosgenerointi käytöstä",
  },
  "mockup.pendingOfferWarning": {
    en: "Some products have mockup generation enabled but no mockup image. Please generate mockups or disable the option.",
    fi: "Joidenkin tuotteiden vedosgenerointi on käytössä, mutta vedoskuvaa ei ole. Luo vedokset tai poista asetus käytöstä.",
  },

  // Validation messages
  "validation.required": {
    en: "This field is required",
    fi: "Tämä kenttä on pakollinen",
  },
  "validation.emailRequired": {
    en: "Email is required",
    fi: "Sähköposti on pakollinen",
  },
  "validation.emailInvalid": {
    en: "Please enter a valid email address",
    fi: "Syötä kelvollinen sähköpostiosoite",
  },
  "validation.passwordRequired": {
    en: "Password is required",
    fi: "Salasana on pakollinen",
  },
  "validation.nameRequired": {
    en: "Name is required",
    fi: "Nimi on pakollinen",
  },
  "validation.companyNameRequired": {
    en: "Company name is required",
    fi: "Yrityksen nimi on pakollinen",
  },
  "validation.contactPersonRequired": {
    en: "Contact person is required",
    fi: "Yhteyshenkilö on pakollinen",
  },
  "validation.phoneRequired": {
    en: "Phone number is required",
    fi: "Puhelinnumero on pakollinen",
  },
  "validation.addressRequired": {
    en: "Address is required",
    fi: "Osoite on pakollinen",
  },
  "validation.cityRequired": {
    en: "City is required",
    fi: "Kaupunki on pakollinen",
  },
  "validation.postcodeRequired": {
    en: "Postcode is required",
    fi: "Postinumero on pakollinen",
  },
  "validation.productNumberRequired": {
    en: "Product number is required",
    fi: "Tuotenumero on pakollinen",
  },
  "validation.productNameRequired": {
    en: "Product name is required",
    fi: "Tuotteen nimi on pakollinen",
  },
} as const;

export type TranslationKey = keyof typeof translations;
