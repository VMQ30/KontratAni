import MetricCards from "./MetricCards";
import MilestoneStepper from "./MilestoneStepper";
import GeoOverview from "./GeoOverview";
import AuditLog from "./AuditLog";

const ContractsIndex = () => (
  <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-6xl ">
      <div className="mt-6">
        <MetricCards />
      </div>
      <div className="mt-6">
        <MilestoneStepper />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <GeoOverview />
        </div>
        <div className="lg:col-span-2">
          <AuditLog />
        </div>
      </div>
    </div>
  </div>
);

export default ContractsIndex;
