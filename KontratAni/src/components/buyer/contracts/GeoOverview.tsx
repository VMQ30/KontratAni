import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Leaf } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import Map, { Source, Layer } from "react-map-gl/maplibre";
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

  //mockup plot
  const plotGeoJSON = useMemo(() => {
    if (!contract || !contract.matchedCooperative) return null;
    
    return {
      type: "FeatureCollection",
      features: contract.matchedCooperative.members.map((farmer, idx) => ({
        type: "Feature",
        properties: { name: farmer.name, status: farmer.smsStatus },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [120.98 + idx * 0.01, 14.59],
              [120.985 + idx * 0.01, 14.59],
              [120.985 + idx * 0.01, 14.595],
              [120.98 + idx * 0.01, 14.595],
              [120.98 + idx * 0.01, 14.59],
            ],
          ],
        },
      })),
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
  const plots = coop.members.map((farmer) => ({
    name: `${farmer.name.split(" ")[0]}'s Plot`,
    yield: `${Math.round(contract.volumeKg / coop.members.length)} kg est.`,
    status: farmer.smsStatus === "pending" ? "Pending" : "Active",
  }));

  return (
    <Card className="flex flex-col border border-border bg-card shadow-none">
      <div className="relative h-52 w-full overflow-hidden rounded-t-lg lg:h-64">
        {!mapError ? (
          <Map
            initialViewState={{
              longitude: 120.98, 
              latitude: 14.59,
              zoom: 12,
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
                  paint={{
                    "fill-color": [
                      "match",
                      ["get", "status"],
                      "pending", "#eab308", 
                      "#22c55e", 
                    ],
                    "fill-opacity": 0.6,
                  }}
                />
                <Layer
                  id="plot-outlines"
                  type="line"
                  paint={{
                    "line-color": "#ffffff",
                    "line-width": 2,
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

      <div className="divide-y divide-border p-4">
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
    </Card>
  );
};

export default GeoOverview;