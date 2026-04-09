import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sprout,
  Loader2,
  Building2,
  Users,
  ArrowLeft,
  MapPin,
  Info,
  ChevronDown,
  X,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { toast } from "sonner";

import myBackground from "../assets/pexels-designstrive-1334312.jpg";

type Role = "buyer" | "coop" | "farmer" | null;

const mapStyle = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap Contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

export default function Auth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>(null);

  // Map State
  const [showMapModal, setShowMapModal] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const MOCK_ACCOUNTS = [
    { email: "buyer@test.com", password: "password123", role: "buyer" },
    { email: "coop@test.com", password: "password123", role: "coop" },
    { email: "farmer@test.com", password: "password123", role: "farmer" },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const account = MOCK_ACCOUNTS.find(
        (acc) => acc.email === email && acc.password === password,
      );

      if (account) {
        toast.success(`Welcome back! Logged in as ${account.role}.`);
        localStorage.setItem("palai_user_role", account.role);
        navigate(`/${account.role}-dashboard`);
      } else {
        toast.error("Invalid email or password. Please try again.");
      }
    }, 1500);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((role === "coop" || role === "farmer") && !pinnedLocation) {
      toast.error("Please pin your location on the map.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem("palai_user_role", role || "");
      navigate(`/${role}-dashboard`);
      setIsLoading(false);
    }, 1500);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setTimeout(() => setStep(1), 300);
  };

  const handleMapClick = (e: any) => {
    setPinnedLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  };

  const inputClass =
    "w-full px-5 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:bg-transparent focus:ring-2 focus:ring-primary/20 text-sm transition-all outline-none placeholder:text-muted-foreground";
  const selectClass =
    "w-full px-5 py-3 pr-10 rounded-xl bg-muted border border-transparent focus:border-primary focus:bg-transparent focus:ring-2 focus:ring-primary/20 text-sm transition-all outline-none appearance-none cursor-pointer invalid:text-muted-foreground";

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${myBackground})` }}
      />

      <div className="absolute inset-0 z-0 bg-black/20 backdrop-blur-[6px]" />

      <div className="relative z-10 w-full max-w-5xl h-[700px] bg-card rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.4)] overflow-hidden flex">
        {/* ==========================================
            MAP MODAL OVERLAY
            ========================================== */}
        <AnimatePresence>
          {showMapModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card w-full max-w-3xl h-[80%] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border"
              >
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                  <div>
                    <h3 className="font-bold text-foreground">
                      Pin Your Location
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Click anywhere on the map to set your farm/coop
                      coordinates.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 relative bg-accent/20">
                  <Map
                    initialViewState={{
                      longitude: 121.774, // Centered on Philippines
                      latitude: 12.8797,
                      zoom: 5,
                    }}
                    mapStyle={mapStyle as any}
                    onClick={handleMapClick}
                    cursor="crosshair"
                  >
                    <NavigationControl position="top-right" />
                    {pinnedLocation && (
                      <Marker
                        longitude={pinnedLocation.lng}
                        latitude={pinnedLocation.lat}
                        color="var(--primary)"
                      />
                    )}
                  </Map>
                </div>

                <div className="p-4 border-t border-border flex justify-between items-center bg-muted/30">
                  <div className="text-sm font-mono text-muted-foreground">
                    {pinnedLocation
                      ? `Lat: ${pinnedLocation.lat.toFixed(5)}, Lng: ${pinnedLocation.lng.toFixed(5)}`
                      : "No location pinned yet"}
                  </div>
                  <button
                    onClick={() => setShowMapModal(false)}
                    disabled={!pinnedLocation}
                    className="flex items-center px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  >
                    <Check className="w-4 h-4 mr-2" /> Confirm Location
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==========================================
            LEFT SIDE: SIGN UP FORMS
            ========================================== */}
        <div className="absolute top-0 left-0 w-1/2 h-full p-10 flex flex-col bg-card">
          <motion.div
            animate={{ opacity: isLogin ? 0 : 1, x: isLogin ? -50 : 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full h-full flex flex-col ${isLogin ? "pointer-events-none" : ""}`}
          >
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 my-auto max-w-sm mx-auto w-full"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-primary mb-2">
                    Join PalAI
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Select your role to get started
                  </p>
                </div>

                <button
                  onClick={() => {
                    setRole("buyer");
                    setStep(2);
                  }}
                  className="w-full flex items-center p-4 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left bg-background"
                >
                  <div className="bg-primary/10 p-3 rounded-full mr-4">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Institutional Buyer</h3>
                    <p className="text-xs text-muted-foreground">
                      Focus on Legality & Volume
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setRole("coop");
                    setStep(2);
                  }}
                  className="w-full flex items-center p-4 border border-border rounded-xl hover:border-[#1c3c2b] hover:bg-accent transition-all text-left bg-background"
                >
                  <div className="bg-[#1c3c2b]/10 p-3 rounded-full mr-4">
                    <Users className="w-6 h-6 text-[#1c3c2b]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Cooperative Manager</h3>
                    <p className="text-xs text-muted-foreground">
                      Focus on Logistics & Network
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setRole("farmer");
                    setStep(2);
                  }}
                  className="w-full flex items-center p-4 border border-border rounded-xl hover:border-[#8c4a2a] hover:bg-accent transition-all text-left bg-background"
                >
                  <div className="bg-[#8c4a2a]/10 p-3 rounded-full mr-4">
                    <Sprout className="w-6 h-6 text-[#8c4a2a]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Solo Farmer</h3>
                    <p className="text-xs text-muted-foreground">
                      Focus on Land & Production
                    </p>
                  </div>
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
                    {role} Account
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto pr-4 pl-2 -ml-2 pb-4 scrollbar-thin">
                  <form onSubmit={handleSignupSubmit} className="space-y-6">
                    {role === "buyer" && (
                      <>
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            Company Details
                          </h3>
                          <input
                            required
                            type="text"
                            placeholder="Company Name (e.g. Jollibee Corp)"
                            className={inputClass}
                          />
                          <input
                            required
                            type="email"
                            placeholder="Company Email (e.g. purchasing@jollibee.ph)"
                            className={inputClass}
                          />
                          <input
                            required
                            type="password"
                            placeholder="Create Password"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            Legal & Logistics
                          </h3>
                          <input
                            required
                            type="text"
                            placeholder="Business TIN / Registration No."
                            className={inputClass}
                          />
                          <textarea
                            required
                            placeholder="Company Address"
                            rows={2}
                            className={`${inputClass} resize-none`}
                          />

                          <div className="relative">
                            <select
                              required
                              className={selectClass}
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Select Industry Type
                              </option>
                              <option
                                value="restaurant"
                                className="text-foreground"
                              >
                                Restaurant / Food Service
                              </option>
                              <option
                                value="wholesale"
                                className="text-foreground"
                              >
                                Wholesale / Distributor
                              </option>
                              <option
                                value="retail"
                                className="text-foreground"
                              >
                                Grocery / Retail
                              </option>
                              <option
                                value="export"
                                className="text-foreground"
                              >
                                Export
                              </option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>
                      </>
                    )}

                    {role === "coop" && (
                      <>
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            Cooperative Details
                          </h3>
                          <input
                            required
                            type="text"
                            placeholder="Cooperative Name (e.g. La Trinidad Assoc.)"
                            className={inputClass}
                          />
                          <input
                            required
                            type="text"
                            placeholder="CDA / SEC Registration Number"
                            className={inputClass}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              required
                              type="email"
                              placeholder="Email Address"
                              className={inputClass}
                            />
                            <input
                              required
                              type="password"
                              placeholder="Password"
                              className={inputClass}
                            />
                          </div>
                          <textarea
                            required
                            placeholder="Main Office Address"
                            rows={2}
                            className={`${inputClass} resize-none`}
                          />

                          <div className="bg-accent/50 p-3 rounded-xl border border-border">
                            <label className="text-xs text-muted-foreground block mb-1">
                              Initial Member Count
                            </label>
                            <input
                              required
                              type="number"
                              min="1"
                              placeholder="e.g. 50"
                              className={inputClass}
                            />
                            <p className="text-[10px] text-muted-foreground mt-2 flex items-center">
                              <Info className="w-3 h-3 mr-1" /> You can add or
                              remove members later.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-border">
                          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            First Farmland Profiling
                          </h3>
                          <p className="text-xs text-muted-foreground pb-2">
                            Register your primary location. You can add more
                            farmlands in your dashboard.
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                              <input
                                required
                                type="number"
                                step="0.1"
                                placeholder="Size"
                                className={`${inputClass} pr-20`}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center border-l border-border/70 pl-2">
                                <select className="bg-transparent text-sm font-medium text-muted-foreground focus:outline-none cursor-pointer appearance-none pr-5 py-1">
                                  <option value="ha">ha</option>
                                  <option value="sqm">sqm</option>
                                </select>
                                <ChevronDown className="absolute right-1 w-3 h-3 text-muted-foreground pointer-events-none" />
                              </div>
                            </div>

                            <div className="relative">
                              <select
                                required
                                className={selectClass}
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  Ownership
                                </option>
                                <option
                                  value="owner"
                                  className="text-foreground"
                                >
                                  Owned
                                </option>
                                <option
                                  value="tenant"
                                  className="text-foreground"
                                >
                                  Tenant
                                </option>
                                <option
                                  value="lease"
                                  className="text-foreground"
                                >
                                  Leased
                                </option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                          </div>

                          <div className="relative">
                            <select
                              required
                              className={selectClass}
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Select Soil Type
                              </option>
                              <option value="loam" className="text-foreground">
                                Loam
                              </option>
                              <option value="clay" className="text-foreground">
                                Clay
                              </option>
                              <option value="sandy" className="text-foreground">
                                Sandy
                              </option>
                              <option value="silt" className="text-foreground">
                                Silt
                              </option>
                              <option
                                value="clay-loam"
                                className="text-foreground"
                              >
                                Clay Loam
                              </option>
                              <option
                                value="sandy-loam"
                                className="text-foreground"
                              >
                                Sandy Loam
                              </option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowMapModal(true)}
                            className={`w-full flex items-center justify-center py-3 border-2 ${pinnedLocation ? "border-primary bg-primary/10 text-primary" : "border-dashed border-primary/50 text-primary hover:bg-primary/5"} rounded-xl transition-colors text-sm font-semibold`}
                          >
                            {pinnedLocation ? (
                              <>
                                <Check className="w-4 h-4 mr-2" /> Location
                                Pinned ({pinnedLocation.lat.toFixed(2)},{" "}
                                {pinnedLocation.lng.toFixed(2)})
                              </>
                            ) : (
                              <>
                                <MapPin className="w-4 h-4 mr-2" /> Pin Location
                                on Map
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}

                    {role === "farmer" && (
                      <>
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            Personal Details
                          </h3>
                          <input
                            required
                            type="text"
                            placeholder="Full Name"
                            className={inputClass}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              required
                              type="email"
                              placeholder="Email Address"
                              className={inputClass}
                            />
                            <input
                              required
                              type="password"
                              placeholder="Password"
                              className={inputClass}
                            />
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-border">
                          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            Farm Profiling
                          </h3>
                          <input
                            type="text"
                            placeholder="Farm Name (Optional, e.g. Mang Juan's Acre)"
                            className={inputClass}
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                              <input
                                required
                                type="number"
                                step="0.1"
                                placeholder="Farm Size"
                                className={`${inputClass} pr-20`}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center border-l border-border/70 pl-2">
                                <select className="bg-transparent text-sm font-medium text-muted-foreground focus:outline-none cursor-pointer appearance-none pr-5 py-1">
                                  <option value="ha">ha</option>
                                  <option value="sqm">sqm</option>
                                </select>
                                <ChevronDown className="absolute right-1 w-3 h-3 text-muted-foreground pointer-events-none" />
                              </div>
                            </div>

                            <div className="relative">
                              <select
                                required
                                className={selectClass}
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  Land Status
                                </option>
                                <option
                                  value="owner"
                                  className="text-foreground"
                                >
                                  Owner
                                </option>
                                <option
                                  value="tenant"
                                  className="text-foreground"
                                >
                                  Tenant
                                </option>
                                <option
                                  value="lease"
                                  className="text-foreground"
                                >
                                  Lease
                                </option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                          </div>

                          <div className="relative">
                            <select
                              required
                              className={selectClass}
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Select Soil Type
                              </option>
                              <option value="loam" className="text-foreground">
                                Loam
                              </option>
                              <option value="clay" className="text-foreground">
                                Clay
                              </option>
                              <option value="sandy" className="text-foreground">
                                Sandy
                              </option>
                              <option value="silt" className="text-foreground">
                                Silt
                              </option>
                              <option
                                value="clay-loam"
                                className="text-foreground"
                              >
                                Clay Loam
                              </option>
                              <option
                                value="sandy-loam"
                                className="text-foreground"
                              >
                                Sandy Loam
                              </option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowMapModal(true)}
                            className={`w-full flex items-center justify-center py-3 border-2 ${pinnedLocation ? "border-primary bg-primary/10 text-primary" : "border-dashed border-primary/50 text-primary hover:bg-primary/5"} rounded-xl transition-colors text-sm font-semibold`}
                          >
                            {pinnedLocation ? (
                              <>
                                <Check className="w-4 h-4 mr-2" /> Farm Pinned (
                                {pinnedLocation.lat.toFixed(2)},{" "}
                                {pinnedLocation.lng.toFixed(2)})
                              </>
                            ) : (
                              <>
                                <MapPin className="w-4 h-4 mr-2" /> Pin Farm on
                                Map
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}

                    <div className="pt-4 sticky bottom-0 bg-card pb-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                            Setting up Workspace...
                          </>
                        ) : (
                          "CREATE ACCOUNT"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ==========================================
            RIGHT SIDE: LOGIN FORM
            ========================================== */}
        <div className="absolute top-0 right-0 w-1/2 h-full p-10 flex flex-col justify-center bg-card">
          <motion.div
            animate={{ opacity: isLogin ? 1 : 0, x: isLogin ? 0 : 50 }}
            transition={{ duration: 0.5 }}
            className={`w-full max-w-sm mx-auto ${!isLogin ? "pointer-events-none" : ""}`}
          >
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Welcome!
              </h1>
              <p className="text-muted-foreground text-sm">
                Login to your account to continue
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <input
                type="email"
                placeholder="Email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />

              <div className="flex justify-center text-xs mt-2">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  Forgot your password?
                </a>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Logging
                      in...
                    </>
                  ) : (
                    "LOG IN"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* ==========================================
            SLIDING OVERLAY PANEL
            ========================================== */}
        <motion.div
          animate={{
            x: isLogin ? "0%" : "100%",
            borderTopRightRadius: isLogin ? "6rem" : "0rem",
            borderBottomRightRadius: isLogin ? "6rem" : "0rem",
            borderTopLeftRadius: isLogin ? "0rem" : "6rem",
            borderBottomLeftRadius: isLogin ? "0rem" : "6rem",
          }}
          transition={{ type: "spring", stiffness: 45, damping: 15 }}
          className="absolute top-0 left-0 w-1/2 h-full bg-primary text-primary-foreground z-50 flex flex-col items-center justify-center text-center p-12 shadow-[0_0_40px_rgba(0,0,0,0.2)]"
        >
          <div className="bg-white/20 p-4 rounded-full mb-8 backdrop-blur-sm">
            <Sprout className="w-12 h-12 text-white" />
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login-overlay"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <h2 className="text-4xl font-bold mb-4 tracking-tight">
                  PalAI!
                </h2>
                <p className="text-primary-foreground/100 mb-6 px-10 leading-relaxed font-medium italic">
                  Hindi masasayang ang palay, protektado ang hanap buhay!
                </p>
                <button
                  onClick={toggleMode}
                  className="px-12 py-3 border-2 border-primary-foreground rounded-full font-bold tracking-wider hover:bg-primary-foreground hover:text-primary transition-all duration-300 shadow-lg"
                >
                  SIGN UP
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="signup-overlay"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <h2 className="text-4xl font-bold mb-4 tracking-tight">
                  Welcome Back!
                </h2>
                <p className="text-primary-foreground/90 mb-8 px-4 leading-relaxed font-medium">
                  To stay connected with your network, please login with your
                  personal info.
                </p>
                <button
                  onClick={toggleMode}
                  className="px-12 py-3 border-2 border-primary-foreground rounded-full font-bold tracking-wider hover:bg-primary-foreground hover:text-primary transition-all duration-300 shadow-lg"
                >
                  SIGN IN
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
