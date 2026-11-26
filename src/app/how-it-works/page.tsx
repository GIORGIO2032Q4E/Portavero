import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Portavero works",
  description: "How Portavero looks up vehicle details, searches retained auction records and estimates selected costs for importing a car into Georgia."
};

export default function HowItWorksPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">How it works</span>
          <h1>How a vehicle lookup becomes an import estimate.</h1>
          <p>The steps are separate: first look up the vehicle's technical details, then request auction records if needed, and finally add the costs you know. Each source can return incomplete data.</p>
          <div className="hero-actions">
            <Link href="/vin-check" className="button button-dark">Look up a vehicle</Link>
            <Link href="/vehicle-import" className="button button-outline">Open import planner</Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container content-narrow prose">
          <h2>1. Look up the vehicle</h2>
          <p>For a standard 17-character VIN, Portavero checks the NHTSA vehicle database. If important specifications are missing and the optional international provider is configured, it can request additional fields from CarsXE.</p>
          <p>For a Japanese domestic-market vehicle, choose the separate frame/chassis-number option. That lookup uses Cardog data based on Japan MLIT records. A result may list several possible models or engines; Portavero leaves uncertain details unselected rather than guessing.</p>
          <p>Either lookup can return partial information. Check the make, model, year, engine capacity, fuel type and steering side against the vehicle and its documents before using them in a tax estimate. A decoded number is not proof of the vehicle's full specification or condition.</p>

          <h2>2. Search auction records separately</h2>
          <p>After a standard VIN lookup, you can request a separate search of the API Auctions index for retained Copart, IAAI and Emirates Auction records. When available, records may include the lot number, auction date, recorded price or final bid, currency, reported odometer, damage and title fields, and original listing photos.</p>
          <p>Auction data is not part of the technical VIN decode and is not a complete accident, ownership, title or service history. The index may be incomplete. No result does not mean the car has never been listed or is damage-free, and a final bid does not always prove that a sale was completed. Check the original lot and currency before relying on a record.</p>

          <h2>3. Add the import costs</h2>
          <p>Continue to the vehicle-import planner. Available details are carried across when the source provides them. Confirm or enter the manufacture year, engine capacity, fuel system and steering side. Then add the costs you know, including the purchase price, auction fees, inland transport, shipping, insurance, port and broker charges, and local delivery.</p>
          <p>The planner can use the National Bank of Georgia's published USD/GEL reference rate for a user-entered USD amount. It can also suggest dated USA-to-Poti transport and shipping benchmarks, plus selected published Copart fees when the required fee details are confirmed. These are planning estimates, not live carrier or broker quotations. IAAI fees and other conditional charges must be checked separately.</p>
          <p>Blank costs are not treated as zero. The known total leaves out costs you have not entered, so it is not the guaranteed final amount payable.</p>

          <h2>4. Check the tax assumptions</h2>
          <p>The tax calculator covers selected passenger-car cases intended for HS 8703. It applies the supported age, engine-capacity, steering and qualifying hybrid, electric and classic-car rules. It does not decide the legal tariff classification, prove eligibility for a transitional regime or cover every exception.</p>
          <p>The planner includes a stored GEL 480 snapshot of standard charges. This is not a live fee lookup. Tax rules, fees and vehicle requirements can change, so confirm the exact vehicle and current charges with the <a href="https://www.rs.ge/CarClearance-en" target="_blank" rel="noreferrer">Revenue Service Auto/Moto Levy Calculator</a> before bidding or shipping.</p>

          <h2>What the result does and does not tell you</h2>
          <p>Portavero is an import-planning tool. It is not a certified vehicle-history report, official customs assessment, customs-broker service, shipping quotation or guarantee of the final landed cost. Use the vehicle documents, original auction listing, current official tax guidance and written carrier or broker quotations when making a purchase decision.</p>
          <p><Link href="/vin-check" className="text-link">Start with a vehicle number <span aria-hidden="true">↗</span></Link></p>
        </div>
      </section>
    </>
  );
}
