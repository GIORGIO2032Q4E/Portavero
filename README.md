# Portavero

Portavero is a student-built web application for checking vehicle details and estimating the cost of importing a car into Georgia.

**Live website:** https://portavero.vercel.app  
**Source code:** https://github.com/GIORGIO2032Q4E/Portavero

## What it does

### Vehicle identification

Portavero supports two types of vehicle lookup:

- **Standard VIN:** Uses the NHTSA vPIC database and can use CarsXE as an optional international VIN decoder.
- **Japanese frame/chassis number:** Uses a separate Cardog lookup based on Japan MLIT records.

Results can be incomplete or ambiguous. Vehicle details should always be checked against the car and its documents.

### Auction history

After a standard VIN lookup, users can request a separate search for retained Copart, IAAI and Emirates Auction records.

When available, results may include auction details, recorded prices, dates, reported mileage, damage information and original listing photos.

This feature depends on the third-party API Auctions service and an active request allowance. Its records are not a complete vehicle-history report, and no result does not mean that a vehicle has never been auctioned.

### Vehicle import cost estimator

The vehicle-import planner combines vehicle information, tax estimates and user-entered costs.

It covers:
- Vehicle purchase price and auction fees
- Origin inland transport and international shipping
- Insurance, port and broker costs
- Local delivery
- Selected Georgian passenger-car tax calculations
- USD to GEL conversion using the National Bank of Georgia reference rate

The planner also provides assisted USA-to-Poti cost estimates and selected Copart fee calculations when the required information is available.

Unknown costs are not treated as zero. The displayed total only includes the costs and calculations currently available.

### Other features

- A searchable catalogue of common vehicle models and engine options.
- A shipping guide for reviewing carrier quotations and additional charges.
- A printable vehicle import estimate.
- The ability to save one vehicle-import draft locally in the current browser.

## Technology

- Next.js
- React
- TypeScript
- JavaScript
- CSS
- Supabase Auth for the legacy account area
- GitHub Actions
- Vercel

## Run locally

**Requirements:** Node.js 24, npm and Git.

Clone the repository:

```bash
git clone https://github.com/GIORGIO2032Q4E/Portavero.git
cd Portavero
npm ci
```

Create a `.env.local` file in the project root and add the provider settings required for the features you want to use.

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Website URL used for metadata |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase public key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alternative Supabase public key |
| `SUPABASE_SECRET_KEY` | Private key for server-side rate limiting |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy alternative for server-side rate limiting |
| `CARSXE_API_KEY` | Optional international VIN lookup |
| `CARDOG_API_KEY` | Optional Japanese chassis lookup |
| `API_AUCTIONS_TOKEN` | Optional auction-history lookup |

Private API keys must remain on the server. Never commit `.env.local` or expose private keys through `NEXT_PUBLIC_` variables.

The protected lookup routes also depend on the configured Supabase rate-limit service and its database migration.

## Checks

The project includes automated checks for calculation logic, input validation, vehicle identification, auction-history responses and other application behaviour.

Run the checks with:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:smoke
```

GitHub Actions also runs a dependency audit with `npm audit --audit-level=moderate`.

## Important limitations

Portavero is an import-planning tool, not a certified vehicle-history report, shipping quotation, customs-broker service or official tax assessment.

- VIN and chassis data depend on external providers and may be incomplete.
- Auction history depends on third-party coverage, availability and request allowance.
- The vehicle catalogue is a reference list, not a complete database.
- Shipping figures are estimates, not live carrier quotations.
- Tax calculations cover selected passenger-car cases and do not determine legal classification or eligibility for every exception.
- The GEL 480 standard-fee amount is a stored snapshot, not a live fee lookup.
- The current vehicle-import draft is stored locally in the browser and is not synced to an account or another device.

Before buying or shipping a vehicle, verify its details, current taxes and charges with the Georgian Revenue Service and obtain confirmed quotations from the relevant providers.

## License

This repository does not currently include a license. Public visibility does not automatically grant permission to reuse or redistribute the source code.
