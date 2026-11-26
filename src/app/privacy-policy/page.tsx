import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "A plain-language guide to what Portavero saves, what leaves your browser and which outside services are involved."
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Project information</span>
          <h1>Privacy policy</h1>
          <p>Here is what happens to the information you enter in Portavero, what stays in your browser and what is sent to another service.</p>
        </div>
      </section>
      <section className="section">
        <div className="container content-narrow prose">
          <p><strong>Last updated: November 25, 2026</strong></p>

          <h2>Vehicle details and cost estimates</h2>
          <p>The current vehicle-import planner performs its calculations in your browser. The costs and vehicle details you enter into that planner are not sent to an external service just to calculate the displayed estimate. Do not enter sensitive personal or financial information.</p>

          <h2>When you check a VIN</h2>
          <p>When you submit a standard VIN, the browser sends it to the Portavero lookup route. The route validates its format and sends it to the U.S. National Highway Traffic Safety Administration (NHTSA) vehicle information service. If NHTSA leaves important fields blank or is unavailable and the optional `CARSXE_API_KEY` server setting is configured, the same VIN may also be sent to the CarsXE International VIN Decoder. When you choose the Japanese domestic frame/chassis option, that identifier is sent to Cardog's Japanese chassis lookup only if the optional `CARDOG_API_KEY` server setting is configured. The provider keys stay on the server and are not sent to the browser.</p>
          <p>The technical VIN lookups provide available technical specifications and model-reference data only. The Japanese chassis source may return possible models or engine variants rather than an exact configuration. Separately, when you choose **Search auction history**, the VIN is sent to API Auctions, an independent provider that indexes retained Copart, IAAI and Emirates Auction lots. Its retained records may include provider-reported vehicle identity, auction, lot number, sale date/status, recorded final bid or sale price and currency, reported odometer, damage/title fields and links to original listing photos when present. The current exact-VIN integration uses the provider's documented production `POST /api/v1/get-car-vin` endpoint with a private server-side Bearer token. The provider's main documentation currently describes v1 as supported in production, while its separate v3 development-host documentation labels v3 as preview. This endpoint choice is based on the provider's current main documentation and must be revisited if that documentation or service changes. This request is not made automatically when you decode a VIN. API Auctions may have no indexed record for a vehicle, and its retained data can be incomplete, mismatched or outdated. Portavero compares the provider's vehicle identity with the technical VIN result and blocks bid-reference transfer when a detected make, model or year conflict exists or either source lacks make, model or year. Only USD amounts can be transferred into the planner's USD bid field. The application applies shared hourly request limits per client address: 40 standard VIN checks, 20 Japanese chassis checks, 8 auction-history searches, 20 sign-in attempts, 5 sign-up attempts and 5 password-reset requests. The auction-history path also has an outer Vercel firewall limit of eight searches per IP address per hour. For the shared limits, Portavero derives a route-specific HMAC-SHA256 identifier from the client address supplied by the hosting platform and stores that one-way identifier in Supabase; it does not store the raw address in the rate-limit table. Vercel and external providers may still process IP addresses and request metadata as part of ordinary hosting, delivery and security operations. If the shared counter cannot be reached, protected requests are rejected rather than sent to paid providers. A recorded final bid is not necessarily proof of an accepted sale. The auction lookup is not a complete accident, ownership, government-title or vehicle-history report.</p>
          <p>Read the <a href="https://vpic.nhtsa.dot.gov/" target="_blank" rel="noreferrer">NHTSA vehicle information service details</a>, <a href="https://docs.carsxe.com/docs/products/international-vin-decoder" target="_blank" rel="noreferrer">CarsXE international decoder documentation</a>, <a href="https://cardog.app/docs/reference/chassis" target="_blank" rel="noreferrer">Cardog Japanese chassis lookup documentation</a> and <a href="https://apiauctions.io/docs" target="_blank" rel="noreferrer">API Auctions documentation</a> for more about these providers.</p>

          <h2>Shipping information</h2>
          <p>Shipping prices and quote details are entered by you. The shipping guide and manual comparison do not contact shipping companies, retrieve live offers or send your quote details to a carrier. Quote entries remain in the page while it is open and are not saved when you leave.</p>

          <h2>What may remain in your browser</h2>
          <p>Earlier versions of Portavero included a vehicle comparison list. Data saved by those versions may still remain in the same browser's local storage even though the comparison feature is no longer offered. Anyone with access to that browser profile may be able to see locally stored information. Clearing the site's browser data can remove it, including any draft saved by the current vehicle-import planner.</p>
          <p>The vehicle-import planner can save one draft in this browser when you press <strong>Save draft on this device</strong>. The draft is stored in this browser's local storage and can be loaded or deleted from the planner. It is not uploaded to Portavero, sent to a provider or linked to an account. Anyone with access to this browser profile may be able to read it. Clearing the site's browser data removes the local draft.</p>
          <p>The current vehicle-import planner does not save estimates to an account. It can save one draft locally in this browser when you choose to do so. The account page is retained for access to older saved estimates. Local browser drafts and legacy account records are separate.</p>

          <h2>Legacy account area</h2>
          <p>When the Supabase project is configured, account sign-up, sign-in and password recovery are handled by Supabase. Portavero does not store your password in its own database. Older estimates saved through that account feature are stored in the Supabase project's <code>saved_estimates</code> table. The database policies are intended to restrict each signed-in user to their own records.</p>
          <p>The account implementation stores Supabase access and refresh tokens in server-set HttpOnly cookies rather than JavaScript-readable browser storage. Account-changing requests are restricted to the same origin. The previous browser-storage session key is removed when the account client loads. Password reset uses a generic acknowledgement that does not disclose whether an email address has an account. The account feature relates to older general-import estimates; it is not connected to the current vehicle-import planner.</p>
          <p>You can sign out and delete records shown in the account area. Browser data and account data are separate, so clearing one does not automatically delete the other.</p>

          <h2>Website hosting</h2>
          <p>Portavero is hosted by Vercel. Like most hosting services, Vercel may process technical details such as IP addresses, request information, timestamps and security logs to operate the site and protect it. What is collected and how long it is retained depends on Vercel's settings and current terms. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel's privacy policy</a>.</p>

          <h2>Analytics and other services</h2>
          <p>The current version does not intentionally use advertising or analytics trackers. It uses fonts available on your device. The checker shares standard VINs with NHTSA and may also share them with CarsXE when the optional fallback is configured and used. Japanese domestic frame/chassis identifiers are shared with Cardog only when that separate option is selected and configured. A standard VIN is sent to API Auctions only when you explicitly start an auction-history search and `API_AUCTIONS_TOKEN` is configured. Auction lookup results and photo links come from that third-party provider; its privacy policy and retention practices apply to data it processes. Other external links take you to government or provider websites that have their own privacy policies.</p>

          <h2>Your options</h2>
          <p>You can clear Portavero's browser data to remove information stored by earlier versions. You can also sign out and delete older estimates saved to your account. Deleting browser data does not delete account records, and deleting an account record does not clear browser storage.</p>

          <h2>About this policy</h2>
          <p>Portavero is a student project and does not currently publish a dedicated support email. This page describes the data flows in the current implementation. It must be reviewed again if the application adds new services or changes its hosting, database or storage behaviour.</p>
          <div className="notice">Portavero is not designed for sensitive personal information. This page is a project disclosure, not a claim of legal compliance for a commercial service. Review the deployed configuration, provider terms and applicable privacy requirements before commercial use.</div>
        </div>
      </section>
    </>
  );
}
