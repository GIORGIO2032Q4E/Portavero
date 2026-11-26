import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Look up the vehicle",
    description: "Enter a standard 17-character VIN, or use the separate frame/chassis option for a Japanese domestic-market car. The lookup returns the technical details available from its data source.",
    href: "/vin-check",
    link: "Look up a vehicle"
  },
  {
    number: "02",
    title: "Build the import estimate",
    description: "Check the details carried over, then enter the purchase price, auction fees, shipping and other costs you know. Costs you have not entered stay visible.",
    href: "/vehicle-import",
    link: "Estimate import costs"
  }
];

export default function HomePage() {
  return (
    <>
      <section className="simple-hero">
        <div className="container simple-hero-grid">
          <div className="simple-hero-copy">
            <p className="simple-status">A student project for planning car imports to Georgia</p>
            <h1>Look up a car's details. Then estimate what it may cost to bring it to Georgia.</h1>
            <p className="simple-lede">Start with a standard VIN, or use the separate frame/chassis lookup for a Japanese domestic-market car. Portavero carries over the technical details its data source returns. Check them, then add the purchase price, auction fees, shipping and other costs you know.</p>
            <div className="hero-actions">
              <Link href="/vin-check" className="button button-dark">Look up a vehicle</Link>
            </div>
            <p className="simple-note">The lookup is not a full vehicle-history report. Tax estimates cover selected cases; confirm the vehicle's treatment and current charges with the Revenue Service.</p>
          </div>
          <aside className="simple-example">
            <div className="simple-example-heading">
              <span>CAR IMPORT COSTS</span>
              <span>GEL</span>
            </div>
            <div className="simple-example-row"><span>Car price</span><strong>Enter amount</strong></div>
            <div className="simple-example-row"><span>Auction fees</span><strong>Add if known</strong></div>
            <div className="simple-example-row"><span>Shipping</span><strong>Add your quote</strong></div>
            <div className="simple-example-row"><span>Customs charges</span><strong>Check with Revenue Service</strong></div>
            <p className="simple-example-foot">These are inputs for an estimate, not a quote.</p>
          </aside>
        </div>
      </section>

      <section className="simple-tools-section">
        <div className="container">
          <div className="simple-section-heading">
            <p className="editorial-label">THE TWO STEPS</p>
            <h2>Look up the car, then work out the costs.</h2>
            <p>The lookup fills only the details returned by its source. Check those details before using them, then add figures from your own records or quotes.</p>
          </div>
          <div className="simple-tool-list">
            {steps.map((step) => (
              <article className="simple-tool-row" key={step.number}>
                <span className="simple-tool-number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <Link href={step.href}>{step.link} <span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="simple-how-section">
        <div className="container simple-how-grid">
          <div>
            <p className="editorial-label">BEFORE YOU USE THE ESTIMATE</p>
            <h2>Check the details behind the total.</h2>
          </div>
          <ol>
            <li><strong>Match the vehicle.</strong><span>Compare the returned details with the car and its documents. A lookup can be incomplete or ambiguous.</span></li>
            <li><strong>Confirm the tax inputs.</strong><span>Check the manufacture year, engine capacity and steering side. The lookup may not return every detail used in the tax estimate.</span></li>
            <li><strong>Use costs you can verify.</strong><span>Enter the purchase price and actual auction, shipping, port and delivery costs. Leave unknown amounts unentered until you have a figure.</span></li>
          </ol>
        </div>
      </section>
    </>
  );
}
