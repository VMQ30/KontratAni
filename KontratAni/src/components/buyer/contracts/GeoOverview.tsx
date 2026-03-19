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
    
    return {
      type: "FeatureCollection",
      features: contract.matchedCooperative.members.map((farmer, idx) => {
        // Offset each plot slightly so they don't overlap
        const plotSize = 0.001;
        const offset = idx * 0.0015; 
        return {
          type: "Feature",
          properties: { 
            name: farmer.name, 
            status: farmer.smsStatus 
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [PH_CENTER.longitude + offset, PH_CENTER.latitude],
              [PH_CENTER.longitude + plotSize + offset, PH_CENTER.latitude],
              [PH_CENTER.longitude + plotSize + offset, PH_CENTER.latitude + plotSize],
              [PH_CENTER.longitude + offset, PH_CENTER.latitude + plotSize],
              [PH_CENTER.longitude + offset, PH_CENTER.latitude],
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
  const plots = coop.members.map((farmer) => ({
    name: `${farmer.name.split(" ")[0]}'s Plot`,
    yield: `${Math.round(contract.volumeKg / coop.members.length)} kg est.`,
    status: farmer.smsStatus === "pending" ? "Pending" : "Active",
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