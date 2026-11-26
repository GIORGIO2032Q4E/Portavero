import { formatireGelTanxa } from "@/lib/format-money";

export type KharjisVelisSakheli = "purchase" | "auction" | "inland" | "shipping" | "insurance" | "port" | "delivery";

type ManqanisDetalebi = {
  name: string;
  identifier: string;
  manufactureYear: number | null;
  engine: string;
  declarationYear: number;
  age: number | null;
  steering: string;
  fuel: string;
  preAprilRegime: boolean;
  classicCar: boolean;
  isElectric: boolean;
};

type KharjebisMnishvnelobebi = Record<KharjisVelisSakheli, number | null>;

type ShefasebisDetalebi = {
  knownCosts: number | null;
  unknownCosts: number;
  excise: number;
  invalidTaxAmounts: boolean;
  importDuty: number;
  officialFees: number;
  total: number | null;
};

type Props = {
  documentMeta: { reference: string; issuedAt: string };
  vehicle: ManqanisDetalebi;
  costs: KharjebisMnishvnelobebi;
  assistedCostFields: Record<KharjisVelisSakheli, boolean>;
  estimate: ShefasebisDetalebi;
  canShowTaxEstimate: boolean;
  totalAvailable: boolean;
  status: string;
  missingCostLabels: string[];
};

export default function ImportisDasabechdiAngarishi({
  documentMeta,
  vehicle,
  costs,
  assistedCostFields,
  estimate,
  canShowTaxEstimate,
  totalAvailable,
  status,
  missingCostLabels
}: Props) {
  return (
    <article className="portavero-print-document" aria-label="Printable Portavero vehicle import estimate">
          <header className="portavero-document-header">
            <div className="portavero-document-brand">
              <span className="portavero-document-mark" aria-hidden="true">P</span>
              <div>
                <strong>PORTAVERO</strong>
                <span>VEHICLE IMPORT ESTIMATE</span>
              </div>
            </div>
            <div className="portavero-document-reference">
              <span>DOCUMENT REFERENCE</span>
              <strong>{documentMeta.reference || "Preparing document"}</strong>
              <small>Issued {documentMeta.issuedAt || "on document generation"}</small>
            </div>
          </header>
    
          <div className="portavero-document-title">
            <div>
              <span className="portavero-document-kicker">VEHICLE IMPORT PLANNING REPORT</span>
              <h1>Vehicle import cost estimate</h1>
              <p>Prepared from the vehicle details and cost information entered into Portavero.</p>
            </div>
            <span className={`portavero-document-status ${totalAvailable ? "is-ready" : "is-incomplete"}`}>{status}</span>
          </div>
    
          <section className="portavero-document-section">
            <div className="portavero-document-section-heading">
              <span>01</span>
              <h2>Vehicle identification</h2>
            </div>
            <div className="portavero-document-vehicle-grid">
              <div><span>Vehicle</span><strong>{vehicle.name}</strong></div>
              <div><span>VIN / chassis number</span><strong>{vehicle.identifier || "Not provided"}</strong></div>
              <div><span>Manufacture year</span><strong>{vehicle.manufactureYear ?? "Not entered"}</strong></div>
              <div><span>Engine / powertrain</span><strong>{vehicle.engine}</strong></div>
              <div><span>Declaration year / vehicle age</span><strong>{vehicle.declarationYear} / {vehicle.age === null ? "Age unavailable" : `${vehicle.age} year(s)`}</strong></div>
              <div><span>Steering / fuel</span><strong>{vehicle.steering} · {vehicle.fuel}</strong></div>
              <div><span>Excise regime selected</span><strong>{vehicle.preAprilRegime ? "Previous rates; transitional eligibility must be verified" : "Current rates"}</strong></div>
              {vehicle.classicCar && <div><span>Vehicle classification selection</span><strong>Classic-car rate selected; legal classification must be verified</strong></div>}
            </div>
          </section>
    
          <section className="portavero-document-section">
            <div className="portavero-document-section-heading">
              <span>02</span>
              <h2>Cost and tax breakdown</h2>
              <small>All amounts in Georgian lari (GEL)</small>
            </div>
            <table className="portavero-document-table">
              <thead>
                <tr><th scope="col">Description</th><th scope="col">Amount</th><th scope="col">Basis</th></tr>
              </thead>
              <tbody>
                <tr><td>Vehicle purchase price</td><td>{costs.purchase === null ? "Not entered" : formatireGelTanxa(costs.purchase)}</td><td>{assistedCostFields.purchase ? "Portavero bid conversion" : "User entry"}</td></tr>
                <tr><td>Auction fees</td><td>{costs.auction === null ? "Not entered" : formatireGelTanxa(costs.auction)}</td><td>{assistedCostFields.auction ? "Copart schedule incl. gate and environmental fees" : "User entry"}</td></tr>
                <tr><td>Inland transport to export port</td><td>{costs.inland === null ? "Not entered" : formatireGelTanxa(costs.inland)}</td><td>{assistedCostFields.inland ? "USA–Poti benchmark midpoint" : "User entry"}</td></tr>
                <tr><td>International shipping</td><td>{costs.shipping === null ? "Not entered" : formatireGelTanxa(costs.shipping)}</td><td>{assistedCostFields.shipping ? "USA–Poti benchmark midpoint" : "User entry"}</td></tr>
                <tr><td>Insurance</td><td>{costs.insurance === null ? "Not entered" : formatireGelTanxa(costs.insurance)}</td><td>{assistedCostFields.insurance ? "0.2% planning assumption" : "User entry"}</td></tr>
                <tr><td>Port, broker and storage</td><td>{costs.port === null ? "Not entered" : formatireGelTanxa(costs.port)}</td><td>{assistedCostFields.port ? "Shared-container benchmark midpoint" : "User entry"}</td></tr>
                <tr><td>Local delivery / other costs</td><td>{costs.delivery === null ? "Not entered" : formatireGelTanxa(costs.delivery)}</td><td>{assistedCostFields.delivery ? "Poti pickup selected" : "User entry"}</td></tr>
                <tr className="portavero-document-subtotal"><td>Vehicle and logistics costs</td><td>{estimate.knownCosts === null ? "Check entries" : formatireGelTanxa(estimate.knownCosts)}</td><td>{Object.values(assistedCostFields).some(Boolean) ? "User entries + Portavero estimates" : "User-entered subtotal"}</td></tr>
                <tr><td>Estimated excise tax</td><td>{canShowTaxEstimate && !estimate.invalidTaxAmounts ? formatireGelTanxa(estimate.excise) : "Not calculated"}</td><td>Portavero calculation</td></tr>
                <tr><td>Estimated import duty</td><td>{canShowTaxEstimate && !estimate.invalidTaxAmounts ? (vehicle.isElectric ? "Exempt for electric vehicles" : formatireGelTanxa(estimate.importDuty)) : "Not calculated"}</td><td>Portavero calculation</td></tr>
                <tr><td>Standard clearance and registration fees</td><td>{formatireGelTanxa(estimate.officialFees)}</td><td>Stored fee snapshot</td></tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">{estimate.unknownCosts > 0 ? "Known total so far" : "Estimated total"}</th>
                  <td>{totalAvailable ? formatireGelTanxa(estimate.total as number) : "Not available"}</td>
                  <td>GEL</td>
                </tr>
              </tfoot>
            </table>
            <div className="portavero-document-completeness">
              <strong>{estimate.unknownCosts} of 7 cost categories not entered</strong>
              {missingCostLabels.length > 0
                ? <span>Still missing: {missingCostLabels.join(", ")}.</span>
                : <span>All seven cost categories have an entered value, including any confirmed zero amounts.</span>}
            </div>
          </section>
    
          <section className="portavero-document-notes">
            <h2>Important information and limitations</h2>
            <ul>
              <li>This is an informational planning estimate, not a customs assessment, commercial invoice, shipping quote or guarantee of the final amount payable.</li>
              <li>Blank cost categories are excluded from the known total. Broker charges, storage, repairs, special handling, classification decisions and other unentered costs may increase the final amount.</li>
              <li>Tax calculations cover only the vehicle cases supported by this version of Portavero. Vehicle classification, transitional eligibility and unusual cases must be checked with the Revenue Service.</li>
              <li>The standard GEL 480 fee amount is a stored snapshot, not a live fee lookup. Verify current fees and tax treatment before purchase, bidding or shipping.</li>
              <li>Rows marked as Portavero estimates use dated USA-to-Poti benchmark ranges and/or the selected standard-car Copart fee schedule, including published gate and environmental fees. Applied range values use the midpoint; they are not carrier, broker or auction invoices. Conditional Copart charges may still apply.</li>
            </ul>
            <p className="portavero-document-sources">
              Reference sources:
              <a href="https://new.matsne.gov.ge/en/document/view/1043717">Tax Code of Georgia, Articles 188, 197 and 199</a>
              <span>·</span>
              <a href="https://www.rs.ge/CarClearance-en">Revenue Service Auto/Moto Levy Calculator</a>
              <span>·</span>
              <a href="https://nbg.gov.ge/en/monetary-policy/currency">National Bank of Georgia exchange rates</a>
              <span>·</span>
              <a href="https://www.copart.com/content/us/en/member-fees">Copart member fee schedule</a>
              <span>·</span>
              <a href="https://voice.rs.ge/Default.aspx?id=3874">Revenue Service notice on the 2 April 2026 change</a>
            </p>
          </section>
    
          <section className="portavero-document-signatures">
            <div className="portavero-document-section-heading">
              <span>03</span>
              <h2>Review and signature</h2>
            </div>
            <div className="portavero-signature-grid">
              <div className="portavero-signature-block">
                <span>PREPARED BY</span>
                <strong>Portavero</strong>
                <div className="portavero-signature-line" />
                <small>Authorized representative signature</small>
                <small>Date: __________________________</small>
              </div>
              <div className="portavero-signature-block">
                <span>REVIEWED BY</span>
                <strong>Vehicle owner / reviewer</strong>
                <div className="portavero-signature-line" />
                <small>Name and signature</small>
                <small>Date: __________________________</small>
              </div>
            </div>
            <p className="portavero-document-unsigned-note">This report is generated automatically from the information entered into Portavero. It carries no digital signature, certification or official customs approval until reviewed and signed by an authorized person.</p>
          </section>
    
          <footer className="portavero-document-footer">
            <strong>PORTAVERO</strong>
            <span>portavero.vercel.app</span>
            <span>{documentMeta.reference}</span>
            <small>Document reference for this generated estimate only. Not a customs declaration or transaction number.</small>
          </footer>
        </article>
  );
}
