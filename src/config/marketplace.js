export const MARKET_CONFIG = {
  defaultCountry: { code: 'TN', name: 'Tunisia', currency: 'TND', locale: 'fr-TN', unitSystem: 'metric' },
  countries: [
    { code: 'TN', name: 'Tunisia', currency: 'TND', locale: 'fr-TN', unitSystem: 'metric' },
    { code: 'FR', name: 'France', currency: 'EUR', locale: 'fr-FR', unitSystem: 'metric' },
    { code: 'DE', name: 'Germany', currency: 'EUR', locale: 'de-DE', unitSystem: 'metric' },
    { code: 'US', name: 'United States', currency: 'USD', locale: 'en-US', unitSystem: 'imperial' },
    { code: 'CA', name: 'Canada', currency: 'CAD', locale: 'en-CA', unitSystem: 'metric' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', locale: 'en-GB', unitSystem: 'imperial' },
  ],
  categories: [
    { slug: 'home-maintenance', name: 'Home & maintenance', description: 'Repairs, cleaning, and upkeep' },
    { slug: 'automotive', name: 'Automotive', description: 'Mechanics, detailing, and roadside help' },
    { slug: 'technology', name: 'Technology', description: 'IT support, repair, and development' },
    { slug: 'professional', name: 'Professional services', description: 'Legal, business, and creative experts' },
    { slug: 'health-wellness', name: 'Health & wellness', description: 'Care, fitness, and wellbeing' },
    { slug: 'education', name: 'Education', description: 'Tutors, coaches, and instructors' },
  ],
  popularLocations: [
    { label: 'Tunis, Tunisia', city: 'Tunis', country: 'TN', lat: 36.8065, lng: 10.1815 },
    { label: 'Paris, France', city: 'Paris', country: 'FR', lat: 48.8566, lng: 2.3522 },
    { label: 'Berlin, Germany', city: 'Berlin', country: 'DE', lat: 52.52, lng: 13.405 },
    { label: 'New York, United States', city: 'New York', country: 'US', lat: 40.7128, lng: -74.006 },
    { label: 'Montreal, Canada', city: 'Montreal', country: 'CA', lat: 45.5017, lng: -73.5673 },
  ],
};

export function formatPrice(value, currency = MARKET_CONFIG.defaultCountry.currency, locale = navigator.language) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value) || 0);
}
