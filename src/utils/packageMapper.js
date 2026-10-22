// Adapter between the backend Package entity/DTO shape and the PackageForm's
// internal field names, which differ (e.g. title/type/capacity vs name/packageType/maxPilgrims).

const INCLUSION_KEYS = ["visa", "flight", "meals", "ziyarah", "hotel", "transfers"]

const toDateInputValue = (value) => {
  if (!value) return ""
  const str = typeof value === "string" ? value : new Date(value).toISOString()
  return str.slice(0, 10)
}

export const mapApiPackageToFormInitialData = (pkg) => {
  if (!pkg) return null

  const inclusionsArray = Array.isArray(pkg.inclusions) ? pkg.inclusions : []
  const inclusions = INCLUSION_KEYS.reduce((acc, key) => {
    acc[key] = inclusionsArray.includes(key)
    return acc
  }, {})

  return {
    name: pkg.title || "",
    description: pkg.description || "",
    itinerary: pkg.itinerary || "",

    packageType: pkg.type || "",
    season: pkg.season ?? null,
    seasonYear: pkg.seasonYear ?? "",
    serviceLevel: pkg.serviceLevel || "",

    prices: {
      adult: pkg.price ?? "",
      child: "",
      individual: pkg.price ?? "",
    },

    departureDate: toDateInputValue(pkg.departureDate),
    returnDate: toDateInputValue(pkg.returnDate),
    duration: pkg.duration || "",

    maxPilgrims: pkg.capacity ?? "",

    installmentsEnabled: !!pkg.installmentEligible,
    installments: {
      registrationFee: pkg.registrationFeeAmount ?? "",
      firstDeposit: pkg.initialDeposit ?? "",
      balance: pkg.finalBalance ?? "",
    },

    inclusions,

    groupDiscountEnabled: !!pkg.groupDiscountEnabled,
    groupDiscountThreshold: pkg.groupDiscountThreshold ?? "",
    groupDiscountPercentage: pkg.groupDiscountPercentage ?? "",

    extensionIds: (pkg.extensions || []).map((ext) => ext.id),
  }
}

export const requiresSeasonYear = (data) =>
  data.packageType === "hajj" || data.season === "ramadan"

export const classificationChanged = (data, initialData) =>
  !initialData ||
  data.packageType !== initialData.packageType ||
  (data.season || null) !== (initialData.season || null) ||
  String(data.seasonYear || "") !== String(initialData.seasonYear || "")

export const getClassificationError = (data, initialData, reviewRequired = false) => {
  if (!data.packageType) return "Select a package type."
  if (data.season && (data.season !== "ramadan" || data.packageType !== "umrah")) {
    return "Ramadan season is only valid for Umrah packages."
  }
  const hasYear = data.seasonYear !== "" && data.seasonYear != null
  if (hasYear && (!Number.isInteger(Number(data.seasonYear)) || Number(data.seasonYear) < 2000 || Number(data.seasonYear) > 2200)) {
    return "Season year must be a whole number from 2000 to 2200."
  }
  if (requiresSeasonYear(data) && !hasYear && (reviewRequired || classificationChanged(data, initialData))) {
    return "Select the selling season year after reviewing the package. Do not guess from its title."
  }
  return ""
}

export const mapFormPayloadToApiPayload = (payload, initialData) => {
  const inclusions = Object.entries(payload.inclusions || {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)

  const hasRegistrationFee = Number(payload.installments?.registrationFee) > 0

  return {
    title: payload.name,
    description: payload.description,
    ...(classificationChanged(payload, initialData) ? {
      type: payload.packageType,
      season: payload.packageType === "umrah" ? payload.season || null : null,
      seasonYear: requiresSeasonYear(payload) && payload.seasonYear !== "" && payload.seasonYear != null
        ? Number(payload.seasonYear)
        : null,
    } : {}),
    serviceLevel: payload.serviceLevel,
    price: payload.price,
    duration: payload.duration,
    capacity: payload.maxPilgrims,
    departureDate: payload.departureDate || null,
    returnDate: payload.returnDate || null,
    inclusions,

    installmentEligible: payload.installmentsEnabled,
    initialDeposit: payload.installments?.firstDeposit ?? null,
    finalBalance: payload.installments?.balance ?? null,

    registrationFeeEnabled: hasRegistrationFee,
    registrationFeeAmount: hasRegistrationFee ? payload.installments.registrationFee : null,

    groupDiscountEnabled: payload.groupDiscountEnabled,
    groupDiscountThreshold: payload.groupDiscountThreshold,
    groupDiscountPercentage: payload.groupDiscountPercentage,

    extensionIds: payload.extensionIds,
  }
}
