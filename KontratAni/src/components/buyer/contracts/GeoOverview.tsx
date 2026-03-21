import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Leaf } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import Map, { Source, Layer } from "react-map-gl/maplibre";
import { FeatureCollection } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const MAP_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;
const TERRAIN_URL = `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`;

const GeoOverview = () => {
  const { contracts, selectedContractId } = useAppStore();
  const contract = contracts.find((c) => c.id === selectedContractId);
  const [mapError, setMapError] = useState(!MAPTILER_KEY);

  const MapFallback = ({ message }) => (
    <div className="relative flex h-52 items-center justify-center rounded-t-lg bg-muted lg:h-64">
      <MapPin className="h-12 w-12 text-muted-foreground/40" />
      <span className="absolute bottom-3 left-3 rounded-md bg-card/80 px-2 py-1 text-xs font-medium text-heading backdrop-blur">
        {message}
      </span>
    </div>
  );

  const PH_CENTER = {
    longitude: 120.90, 
    latitude: 15.71,
  };

  //mockup plot
  const plotGeoJSON = useMemo<FeatureCollection | null>(() => {
    if (!contract || !contract.matchedCooperative) return null;

    const shiftedCenter = {
      longitude: PH_CENTER.longitude - 0.002,
      latitude: PH_CENTER.latitude - 0.002,
    }
    
    return {
      type: "FeatureCollection",
      features: contract.matchedCooperative.members.map((farmer, idx) => {
        const plotSize = 0.0006;
        const offset = idx * 0.0010; 
        return {
          type: "Feature",
          properties: { 
            name: farmer.name, 
            status: farmer.smsStatus 
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [shiftedCenter.longitude + offset, shiftedCenter.latitude],
              [shiftedCenter.longitude + plotSize + offset, shiftedCenter.latitude],
              [shiftedCenter.longitude + plotSize + offset, shiftedCenter.latitude + plotSize],
              [shiftedCenter.longitude + offset, shiftedCenter.latitude + plotSize],
              [shiftedCenter.longitude + offset, shiftedCenter.latitude],
            ]],
          },
        };
      }),
    };
  }, [contract]);

  if (!contract || !contract.matchedCooperative) {
    return (
      <Card className="flex flex-col border border-border bg-card shadow-none">
        <div className="relative flex h-52 items-center justify-center rounded-t-lg bg-muted lg:h-64">
          <MapPin className="h-12 w-12 text-muted-foreground/40" />
          <span className="absolute bottom-3 left-3 rounded-md bg-card/80 px-2 py-1 text-xs font-medium text-heading backdrop-blur">
            No Cooperative Data
          </span>
        </div>
      </Card>
    );
  }

  const coop = contract.matchedCooperative;
  
  const statusColorMap: Record<string, { color: string; label: string }> = {
    pending: { color: "#eab308", label: "Pending" },
    notified: { color: "#3b82f6", label: "Notified" },
    confirmed: { color: "#8b5cf6", label: "Confirmed" },
    planted: { color: "#22c55e", label: "Planted" },
    harvested: { color: "#f97316", label: "Harvested" },
  };

  const plots = coop.members.map((farmer) => ({
    name: `${farmer.name.split(" ")[0]}'s Plot`,
    yield: `${Math.round(contract.volumeKg / coop.members.length)} kg est.`,
    status: statusColorMap[farmer.smsStatus]?.label || "Unknown",
  }));

  console.log("Current GeoJSON Data:", plotGeoJSON);

  return (
    <Card className="flex flex-col border border-border bg-card shadow-none">
      <div className="relative h-52 w-full overflow-hidden rounded-t-lg lg:h-64">
        {!mapError ? (
          <Map
            initialViewState={{
              longitude: PH_CENTER.longitude, 
              latitude: PH_CENTER.latitude,
              zoom: 15,
              pitch: 60, 
              bearing: 20,
            }}
            mapStyle={MAP_STYLE}
            terrain={{ source: "terrain-source", exaggeration: 1.5 }}
            interactive={true}
          >
            <Source id="terrain-source" type="raster-dem" url={TERRAIN_URL} tileSize={256} />

            {plotGeoJSON && (
              <Source id="plot-data" type="geojson" data={plotGeoJSON}>
                <Layer
                  id="plot-fills"
                  type="fill"
                  source="plot-data"
                  paint={{
                    "fill-color": [
                      "match",
                      ["get", "status"],
                      "pending", "#eab308",
                      "notified", "#3b82f6",
                      "confirmed", "#8b5cf6",
                      "planted", "#22c55e",
                      "harvested", "#f97316",
                      "#22c55e",
                    ],
                    "fill-opacity": 0.9,
                  }}
                />
                <Layer
                  id="plot-outlines"
                  type="line"
                  source="plot-data"
                  paint={{
                    "line-color": "#ffffff",
                    "line-width": 2,
                  }}
                />
                <Layer
                  id="plot-labels"
                  type="symbol"
                  source="plot-data"
                  layout={{
                    "text-field": ["get", "name"],
                    "text-size": 12,
                    "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
                    "text-offset": [0, 0.6],
                    "text-anchor": "top",
                  }}
                  paint={{
                    "text-color": "#1f2937",
                    "text-halo-color": "#ffffff",
                    "text-halo-width": 1.5,
                  }}
                />
              </Source>
            )}
          </Map>
        ) : (
          <MapFallback message="Map loading failed. Please check your MapTiler API key." />
        )}
        
        {!mapError && (
          <span className="absolute bottom-3 left-3 rounded-md bg-card/80 px-2 py-1 text-xs font-medium text-heading backdrop-blur z-10">
            Cooperative Zone: Region 1
          </span>
        )}
      </div>

      <div className="border-t border-border p-4">
        <div className="mb-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plot Status Legend</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: "#eab308" }}></div>
              <span className="text-sm text-body">Pending</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
              <span className="text-sm text-body">Notified</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: "#8b5cf6" }}></div>
              <span className="text-sm text-body">Confirmed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: "#22c55e" }}></div>
              <span className="text-sm text-body">Planted</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: "#f97316" }}></div>
              <span className="text-sm text-body">Harvested</span>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plot Details</h3>
          <div className="divide-y divide-border">
            {plots.map((p) => (
              <div key={p.name} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-heading">{p.name}</span>
                  <span className="text-sm text-body">{p.yield}</span>
                </div>
                <span className="rounded-full bg-status-success/15 px-2 py-0.5 text-xs font-medium text-status-success">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GeoOverview;