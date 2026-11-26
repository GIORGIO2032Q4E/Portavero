import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Portavero",
  description: "The reason for the project, how its vehicle lookups work and what its import estimates cover."
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">About</span>
          <h1>Why I built Portavero.</h1>
          <p>A car's auction price is only the first number. Buyer fees, transport, shipping, port charges, taxes and local delivery all affect what it costs to bring the car to Georgia. I built Portavero to keep the vehicle details and those costs in the same estimate.</p>
        </div>
      </section>
      <section className="section">
        <div className="container content-narrow prose">
          <h2>How the project works</h2>
          <p>Enter a standard VIN or a Japanese domestic-market frame/chassis number. The selected source may return the make, model, year, engine and other technical details. Check them against the car's documents before using them in the estimate. A separate search can look for retained Copart, IAAI and Emirates Auction records; those records are not part of the VIN decode.</p>

          <h2>How I built it</h2>
          <p>Portavero uses Next.js, React and TypeScript. The vehicle-tax and import-cost calculations live in separate JavaScript modules and have automated tests. VIN and auction requests go through server routes, so provider API keys are not sent to the browser.</p>

          <h2>What it does not check</h2>
          <p>The vehicle lookup returns technical details, not accident, title, ownership, odometer or service history. Auction records are searched separately through a third-party index. That index may not contain every listing, and no result does not mean a car has never been listed or is damage-free. VIN and chassis results can also be incomplete or ambiguous.</p>
          <p>The vehicle-tax estimate covers selected passenger-car cases, not every classification or exception. The GEL 480 standard-fee amount is a stored snapshot, not a live lookup. Shipping prices and other costs must come from quotes or documents you have checked. Before buying or shipping a car, verify its details and tax treatment with the Georgian Revenue Service.</p>
          <p>The source code and automated tests are available in the <a href="https://github.com/GIORGIO2032Q4E/Portavero" target="_blank" rel="noreferrer">Portavero repository</a>.</p>

          <h2>Project creator</h2>
          <p>George Pavliashvili</p>
          <p>Contact: <a href="mailto:giopavliashvili09@gmail.com">giopavliashvili09@gmail.com</a></p>
        </div>
      </section>
    </>
  );
}
