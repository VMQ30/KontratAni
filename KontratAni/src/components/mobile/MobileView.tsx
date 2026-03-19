import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { CropStatus, FarmerSmsStatus } from "@/store/useAppStore";

type Lang = "en" | "tl";
type Step = "lang" | "main" | "crop_info" | "complaint" | "complaint_detail" | "complaint_when" | "support" | "support_detail" | "support_urgency" | "contract" | "done";

interface Message {
  id: number;
  text: string;
  from: "kontratani" | "farmer";
  isBroadcast?: boolean;
}

const STORAGE_KEY = 'kontratani_broadcast';
const CROP_STATUS_KEY = 'kontratani_crop_status';

// ─── Menus ────────────────────────────────────────────────────────────────────

const LANG_PROMPT =
  `Welcome to KontratAni! 🌾\nMaligayang pagdating sa KontratAni!\n\nPumili ng wika / Choose language:\n1 - English\n2 - Tagalog`;

const MAIN_MENU = {
  en: `What would you like to do?\n\n1 - Update a crop\n2 - Submit a complaint\n3 - Request for support\n4 - Check contract status\n0 - Send another message`,
  tl: `Ano ang gusto ninyong gawin?\n\n1 - I-update ang pananim\n2 - Mag-reklamo\n3 - Humingi ng tulong\n4 - Tingnan ang kontrata\n0 - Magpadala ng isa pang mensahe`,
};

const CROP_STATUS_ORDER = [
  'seeds_planted', 'fertilized', 'growing', 'ready_for_harvest', 'harvested', 'delivered'
] as const;

const CROP_STATUS_LABELS = {
  en: ['Seeds Planted', 'Fertilized', 'Growing', 'Ready for Harvest', 'Harvested', 'Delivered'],
  tl: ['Naitanim na ang Binhi', 'Binigyan ng Pataba', 'Lumalaki na', 'Handa nang Anihin', 'Na-ani na', 'Naihatid na'],
};

const COMPLAINT_MENU = {
  en: `What is your complaint about?\n\n1 - Late delivery\n2 - Payment issue\n3 - No update from coordinator\n── Field & Crop Issues ──\n4 - Damaged crops\n5 - Pest or disease on crops\n6 - Weather damage\n7 - Irrigation or water problem\n0 - Back`,
  tl: `Tungkol saan ang reklamo?\n\n1 - Nahuling paghahatid\n2 - Problema sa bayad\n3 - Walang update mula sa coordinator\n── Mga Suliranin sa Bukid ──\n4 - Nasirang pananim\n5 - Peste o sakit ng pananim\n6 - Pinsala ng panahon\n7 - Problema sa patubig\n0 - Bumalik`,
};

const COMPLAINT_FOLLOWUP: Record<number, { en: string; tl: string }> = {
  1: {
    en: `How many days late is the delivery?\n\n1 - 1 to 2 days\n2 - 3 to 5 days\n3 - More than 5 days`,
    tl: `Ilang araw na naantala ang paghahatid?\n\n1 - 1 hanggang 2 araw\n2 - 3 hanggang 5 araw\n3 - Mahigit 5 araw`,
  },
  2: {
    en: `What is the payment issue?\n\n1 - I have not received payment yet\n2 - Wrong amount was paid\n3 - Payment was delayed`,
    tl: `Ano ang problema sa bayad?\n\n1 - Hindi pa natanggap ang bayad\n2 - Mali ang halagang binayad\n3 - Naantala ang bayad`,
  },
  3: {
    en: `How long have you had no update from your coordinator?\n\n1 - 1 to 2 days\n2 - 3 to 5 days\n3 - More than 5 days`,
    tl: `Gaano katagal na walang update mula sa coordinator?\n\n1 - 1 hanggang 2 araw\n2 - 3 hanggang 5 araw\n3 - Mahigit 5 araw`,
  },
  4: {
    en: `How severe is the damage to your crops?\n\n1 - Minor damage\n2 - Moderate damage\n3 - Severe, most crops are unusable`,
    tl: `Gaano kalala ang pinsala sa inyong pananim?\n\n1 - Maliit na pinsala\n2 - Katamtamang pinsala\n3 - Malubha, karamihan ay hindi na magagamit`,
  },
  5: {
    en: `What kind of pest or disease is affecting your crops?\n\n1 - Insects or pests\n2 - Fungal disease\n3 - Unknown, crops are wilting or dying`,
    tl: `Anong uri ng peste o sakit ang nakakaapekto sa inyong pananim?\n\n1 - Insekto o mga peste\n2 - Sakit na fungi\n3 - Hindi alam, nalalanta o namamatay ang pananim`,
  },
  6: {
    en: `What type of weather damage occurred?\n\n1 - Flood\n2 - Drought or too much heat\n3 - Typhoon or strong winds`,
    tl: `Anong uri ng pinsala ng panahon ang nangyari?\n\n1 - Baha\n2 - Tagtuyot o labis na init\n3 - Bagyo o malakas na hangin`,
  },
  7: {
    en: `What is the irrigation or water problem?\n\n1 - No water supply\n2 - Flooded fields due to excess water\n3 - Broken or blocked irrigation canal`,
    tl: `Ano ang problema sa patubig?\n\n1 - Walang supply ng tubig\n2 - Baha sa palayan dahil sa sobrang tubig\n3 - Sirang o naharang na kanal`,
  },
};

const WHEN_QUESTION = {
  en: `When did this happen?\n\n1 - Today\n2 - Yesterday\n3 - A few days ago\n4 - More than a week ago`,
  tl: `Kailan ito nangyari?\n\n1 - Ngayon\n2 - Kahapon\n3 - Ilang araw na ang nakalipas\n4 - Mahigit isang linggo na`,
};

const RESOLUTION = {
  en: `Thank you for the details. Your complaint has been noted and logged. Our team will look into this and contact you within 24 hours. We apologize for the inconvenience. 🙏`,
  tl: `Salamat sa inyong mga detalye. Naitala na ang inyong reklamo. Susuriin ito ng aming koponan at makikipag-ugnayan sa inyo sa loob ng 24 oras. Pasensya na sa abala. 🙏`,
};

const SUPPORT_MENU = {
  en: `What kind of support do you need?\n\n1 - Visit from agricultural technician\n2 - Seeds or farming supplies\n3 - Emergency crop assistance\n4 - Equipment or tools\n0 - Back`,
  tl: `Anong uri ng tulong ang kailangan ninyo?\n\n1 - Pagbisita ng agricultural technician\n2 - Mga binhi o kagamitan sa pagsasaka\n3 - Emergency na tulong sa pananim\n4 - Makinarya o kagamitan\n0 - Bumalik`,
};

const SUPPORT_FOLLOWUP: Record<number, { en: string; tl: string }> = {
  1: {
    en: `What do you need the technician for?\n\n1 - Soil assessment\n2 - Pest or disease inspection\n3 - Crop health check\n4 - General farming advice`,
    tl: `Para saan kailangan ang technician?\n\n1 - Pagsusuri ng lupa\n2 - Inspeksyon ng peste o sakit\n3 - Pagsusuri ng kalusugan ng pananim\n4 - Pangkalahatang payo sa pagsasaka`,
  },
  2: {
    en: `What supplies do you need?\n\n1 - Seeds\n2 - Fertilizer\n3 - Pesticide or herbicide\n4 - Other farming materials`,
    tl: `Anong kagamitan ang kailangan ninyo?\n\n1 - Mga binhi\n2 - Pataba\n3 - Pesticide o herbicide\n4 - Iba pang kagamitan sa pagsasaka`,
  },
  3: {
    en: `What is the emergency?\n\n1 - Crops are dying\n2 - Flood or water damage\n3 - Pest or disease outbreak\n4 - Fire or physical damage`,
    tl: `Ano ang emergency?\n\n1 - Namamatay ang mga pananim\n2 - Baha o pinsala ng tubig\n3 - Pagkalat ng peste o sakit\n4 - Sunog o pisikal na pinsala`,
  },
  4: {
    en: `What equipment do you need?\n\n1 - Plow or tractor\n2 - Irrigation pump\n3 - Harvesting tools\n4 - Sprayer or applicator`,
    tl: `Anong kagamitan ang kailangan ninyo?\n\n1 - Araro o tractor\n2 - Irrigation pump\n3 - Mga kagamitan sa pag-aani\n4 - Sprayer o applicator`,
  },
};

const SUPPORT_URGENCY = {
  en: `How urgent is your request?\n\n1 - Urgent, I need help today\n2 - Within the next few days\n3 - No rush, within the week`,
  tl: `Gaano kahalaga ang inyong kahilingan?\n\n1 - Urgent, kailangan ko ng tulong ngayon\n2 - Sa susunod na ilang araw\n3 - Hindi nagmamadali, sa loob ng linggo`,
};

const SUPPORT_RESOLUTION = {
  en: `Thank you for the details. Your support request has been noted and logged. Our team will reach out to you based on your urgency. We appreciate your patience. 🙏`,
  tl: `Salamat sa inyong mga detalye. Naitala na ang inyong kahilingan para sa tulong. Makikipag-ugnayan sa inyo ang aming koponan batay sa inyong pangangailangan. Salamat sa inyong pasensya. 🙏`,
};

const CONTRACT_MENU = {
  en: `What would you like to know about your contract?\n\n1 - Is my contract active?\n2 - When is the pick-up schedule?\n3 - How much is my expected payout?\n0 - Back`,
  tl: `Ano ang gusto ninyong malaman tungkol sa inyong kontrata?\n\n1 - Aktibo ba ang aking kontrata?\n2 - Kailan ang schedule ng pick-up?\n3 - Magkano ang aking inaasahang bayad?\n0 - Bumalik`,
};

const INVALID = {
  en: "Invalid input. Please type a valid number.",
  tl: "Di wasto. Mangyaring mag-type ng tamang numero.",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MobileView() {
  // ── Juan dela Cruz — f1, member of coop1 (Quezon Farmers Cooperative) ───────
  const FARMER_ID = 'f1';
  const COOP_ID   = 'coop1';

  const contracts             = useAppStore((s) => s.contracts);
  const updateCropStatus      = useAppStore((s) => s.updateCropStatus);
  const updateFarmerSmsStatus = useAppStore((s) => s.updateFarmerSmsStatus);
  const cooperatives          = useAppStore((s) => s.cooperatives);

  const farmer = cooperatives
    .find((c) => c.id === COOP_ID)
    ?.members.find((f) => f.id === FARMER_ID);

  // Find his contract — the one matched to his cooperative
  const activeContract = contracts.find((c) =>
    ['accepted', 'funded', 'in_progress', 'matched'].includes(c.status) &&
    c.matchedCooperative?.id === COOP_ID
  );

  // Build dynamic contract replies from real store data
  const getContractReply = (question: number, lang: Lang): string => {
    if (!activeContract) {
      return lang === "en"
        ? "We could not find an active contract linked to your account. Please contact your coordinator. 📋"
        : "Hindi namin mahanap ang aktibong kontrata sa inyong account. Mangyaring makipag-ugnayan sa inyong coordinator. 📋";
    }

    const { crop, status, targetDate, escrowAmount, volumeKg, cropStatus, matchedCooperative } = activeContract;
    const isActive = ['accepted', 'funded', 'in_progress'].includes(status);
    const perFarmer = matchedCooperative
      ? Math.floor(escrowAmount / (matchedCooperative.members.length || 1))
      : escrowAmount;
    const formattedDate = new Date(targetDate).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const statusLabels: Record<string, { en: string; tl: string }> = {
      matched:     { en: 'Matched',     tl: 'Nakatugma' },
      accepted:    { en: 'Accepted',    tl: 'Tinanggap' },
      funded:      { en: 'Funded',      tl: 'Pondo na' },
      in_progress: { en: 'In Progress', tl: 'Isinasagawa' },
      completed:   { en: 'Completed',   tl: 'Nakumpleto' },
    };
    const statusLabel = statusLabels[status]?.[lang] ?? status;

    if (question === 1) {
      return lang === "en"
        ? `Your contract for ${crop} is currently ${isActive ? 'ACTIVE ✅' : 'not yet active'}.\nStatus: ${statusLabel}\nCrop Status: ${cropStatus.replace(/_/g, ' ')}`
        : `Ang inyong kontrata para sa ${crop} ay kasalukuyang ${isActive ? 'AKTIBO ✅' : 'hindi pa aktibo'}.\nStatus: ${statusLabel}\nKalagayan ng Pananim: ${cropStatus.replace(/_/g, ' ')}`;
    }
    if (question === 2) {
      return lang === "en"
        ? `Your target pick-up date for ${crop} is ${formattedDate}.\nVolume: ${volumeKg.toLocaleString()} kg\nYour coordinator will contact you 2 days before. Please have your crops ready. 📦`
        : `Ang inyong target na petsa ng pick-up para sa ${crop} ay ${formattedDate}.\nDami: ${volumeKg.toLocaleString()} kg\nMakikipag-ugnayan sa inyo ang inyong coordinator 2 araw bago. Ihanda ang inyong pananim. 📦`;
    }
    if (question === 3) {
      return lang === "en"
        ? `Your payout for ${crop} has not been finalized yet. The exact amount will depend on the volume you deliver and the agreed price per kg. Your coordinator will inform you of the final amount once your crops are picked up. 💰`
        : `Ang inyong bayad para sa ${crop} ay hindi pa naaprubahan. Ang eksaktong halaga ay depende sa dami ng inyong maihahatid at sa napagkasunduang presyo bawat kg. Ipapaalam sa inyo ng inyong coordinator ang huling halaga pagkatapos kunin ang inyong pananim. 💰`;
    }
    return INVALID[lang];
  };

  const getCropInfoMsg = (lang: Lang): string => {
    if (!activeContract) {
      return lang === "en"
        ? "No active contract found. Please contact your coordinator. 📋"
        : "Walang aktibong kontratang nahanap. Makipag-ugnayan sa inyong coordinator. 📋";
    }
    const { crop, cropStatus, volumeKg, targetDate } = activeContract;
    const currentLabel: Record<string, { en: string; tl: string }> = {
      pending:           { en: "Pending",           tl: "Nakabinbin" },
      seeds_planted:     { en: "Seeds Planted",     tl: "Naitanim na ang Binhi" },
      fertilized:        { en: "Fertilized",        tl: "Binigyan ng Pataba" },
      growing:           { en: "Growing",           tl: "Lumalaki na" },
      ready_for_harvest: { en: "Ready for Harvest", tl: "Handa nang Anihin" },
      harvested:         { en: "Harvested",         tl: "Na-ani na" },
      delivered:         { en: "Delivered",         tl: "Naihatid na" },
    };
    const formattedDate = new Date(targetDate).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const label = currentLabel[cropStatus]?.[lang] ?? cropStatus;

    // Build only the next valid statuses (forward only)
    const currentIdx = CROP_STATUS_ORDER.indexOf(cropStatus as typeof CROP_STATUS_ORDER[number]);
    const nextStatuses = CROP_STATUS_ORDER.slice(currentIdx + 1);
    const nextLines = nextStatuses.map((s, i) => {
      const lbl = CROP_STATUS_LABELS[lang][CROP_STATUS_ORDER.indexOf(s)];
      return `${i + 1} - ${lbl}`;
    });

    const hasNext = nextLines.length > 0;
    const updatePrompt = hasNext
      ? (lang === "en"
          ? `\n\nUpdate status to:\n\n${nextLines.join('\n')}\n0 - Back`
          : `\n\nI-update ang status sa:\n\n${nextLines.join('\n')}\n0 - Bumalik`)
      : (lang === "en"
          ? `\n\nYour crops are fully delivered. No further updates needed. ✅\n\n0 - Back`
          : `\n\nAng inyong pananim ay naihatid na. Walang karagdagang update. ✅\n\n0 - Bumalik`);

    return lang === "en"
      ? `Your current contract:\n\nCrop: ${crop}\nVolume: ${volumeKg.toLocaleString()} kg\nTarget date: ${formattedDate}\nCurrent status: ${label}${updatePrompt}`
      : `Ang inyong kasalukuyang kontrata:\n\nPananim: ${crop}\nDami: ${volumeKg.toLocaleString()} kg\nTarget na petsa: ${formattedDate}\nKasalukuyang status: ${label}${updatePrompt}`;
  };

  // Build the cropStatusMap dynamically based on current status (forward-only)
  const getForwardStatusMap = (): Record<number, CropStatus> => {
    if (!activeContract) return {};
    const currentIdx = CROP_STATUS_ORDER.indexOf(activeContract.cropStatus as typeof CROP_STATUS_ORDER[number]);
    const nextStatuses = CROP_STATUS_ORDER.slice(currentIdx + 1);
    return Object.fromEntries(nextStatuses.map((s, i) => [i, s]));
  };

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: "kontratani", text: LANG_PROMPT },
  ]);
  const [step, setStep]               = useState<Step>("lang");
  const [lang, setLang]               = useState<Lang>("en");
  const [complaintType, setComplaintType] = useState<number>(0);
  const [supportType, setSupportType]     = useState<number>(0);
  const [input, setInput]             = useState("");
  const [seenIds, setSeenIds]         = useState<Set<string>>(new Set());
  const bottomRef                     = useRef<HTMLDivElement>(null);

  // ── Listen for localStorage broadcast from manager tab ──────────────────────
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const payload = JSON.parse(e.newValue) as { id: string; text: string; time: string };
        if (seenIds.has(payload.id)) return;
        setSeenIds((prev) => new Set([...prev, payload.id]));
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            from: "kontratani",
            text: payload.text,
            isBroadcast: true,
          },
        ]);
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [seenIds]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMsg = (text: string, from: "kontratani" | "farmer") => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), text, from }]);
  };

  const handleSend = () => {
    const val = input.trim();
    if (!val) return;
    setInput("");
    addMsg(val, "farmer");
    setTimeout(() => process(val), 400);
  };

  const process = (val: string) => {
    if (step === "lang") {
      if (val === "1") { setLang("en"); setStep("main"); addMsg(MAIN_MENU.en, "kontratani"); }
      else if (val === "2") { setLang("tl"); setStep("main"); addMsg(MAIN_MENU.tl, "kontratani"); }
      else addMsg("Please type 1 or 2. / Mag-type ng 1 o 2.", "kontratani");
      return;
    }

    if (step === "main") {
      if (val === "1") { setStep("crop_info"); addMsg(getCropInfoMsg(lang), "kontratani"); }
      else if (val === "2") { setStep("complaint"); addMsg(COMPLAINT_MENU[lang], "kontratani"); }
      else if (val === "3") { setStep("support"); addMsg(SUPPORT_MENU[lang], "kontratani"); }
      else if (val === "4") { setStep("contract"); addMsg(CONTRACT_MENU[lang], "kontratani"); }
      else if (val === "0") { setStep("lang"); addMsg(LANG_PROMPT, "kontratani"); }
      else addMsg(INVALID[lang], "kontratani");
      return;
    }

    if (step === "crop_info") {
      if (val === "0") { setStep("main"); addMsg(MAIN_MENU[lang], "kontratani"); return; }
      const forwardMap = getForwardStatusMap();
      const idx = parseInt(val) - 1;
      const newStatus = forwardMap[idx];
      if (!isNaN(idx) && newStatus !== undefined && activeContract) {
        updateCropStatus(activeContract.id, newStatus);

        const smsMap: Record<string, FarmerSmsStatus> = {
          seeds_planted:     'planted',
          fertilized:        'planted',
          growing:           'planted',
          ready_for_harvest: 'planted',
          harvested:         'harvested',
          delivered:         'harvested',
        };
        updateFarmerSmsStatus(activeContract.id, FARMER_ID, smsMap[newStatus] ?? 'planted');

        // Write to localStorage so buyer portal tab syncs the crop status
        localStorage.setItem(CROP_STATUS_KEY, JSON.stringify({
          contractId: activeContract.id,
          cropStatus: newStatus,
          ts: Date.now(),
        }));

        const labelMap = CROP_STATUS_LABELS[lang];
        const newLabel = labelMap[CROP_STATUS_ORDER.indexOf(newStatus)];
        const confirm = lang === "en"
          ? `✅ Status updated to: ${newLabel}\n\nThank you, Juan! Your coordinator has been notified. 🌾`
          : `✅ Na-update ang status sa: ${newLabel}\n\nSalamat, Juan! Naabisuhan na ang inyong coordinator. 🌾`;
        addMsg(confirm, "kontratani");
        setTimeout(() => addMsg(MAIN_MENU[lang], "kontratani"), 700);
        setStep("main");
      } else {
        addMsg(INVALID[lang], "kontratani");
      }
      return;
    }

    if (step === "support") {
      if (val === "0") { setStep("main"); addMsg(MAIN_MENU[lang], "kontratani"); return; }
      const idx = parseInt(val);
      if (idx >= 1 && idx <= 4) {
        setSupportType(idx);
        setStep("support_detail");
        addMsg(SUPPORT_FOLLOWUP[idx][lang], "kontratani");
      } else {
        addMsg(INVALID[lang], "kontratani");
      }
      return;
    }

    if (step === "support_detail") {
      const idx = parseInt(val);
      if (idx >= 1 && idx <= 4) {
        setStep("support_urgency");
        addMsg(SUPPORT_URGENCY[lang], "kontratani");
      } else {
        addMsg(INVALID[lang], "kontratani");
      }
      return;
    }

    if (step === "support_urgency") {
      const idx = parseInt(val);
      if (idx >= 1 && idx <= 3) {
        addMsg(SUPPORT_RESOLUTION[lang], "kontratani");
        setTimeout(() => addMsg(MAIN_MENU[lang], "kontratani"), 800);
        setStep("main");
      } else {
        addMsg(INVALID[lang], "kontratani");
      }
      return;
    }

    if (step === "contract") {
      if (val === "0") { setStep("main"); addMsg(MAIN_MENU[lang], "kontratani"); return; }
      const idx = parseInt(val);
      if (idx >= 1 && idx <= 3) {
        addMsg(getContractReply(idx, lang), "kontratani");
        setTimeout(() => addMsg(MAIN_MENU[lang], "kontratani"), 800);
        setStep("main");
      } else {
        addMsg(INVALID[lang], "kontratani");
      }
      return;
    }

    if (step === "complaint") {
      if (val === "0") { setStep("main"); addMsg(MAIN_MENU[lang], "kontratani"); return; }
      const idx = parseInt(val);
      if (idx >= 1 && idx <= 7) {
        setComplaintType(idx);
        setStep("complaint_detail");
        addMsg(COMPLAINT_FOLLOWUP[idx][lang], "kontratani");
      } else {
        addMsg(INVALID[lang], "kontratani");
      }
      return;
    }

    if (step === "complaint_detail") {
      const idx = parseInt(val);
      if (idx >= 1 && idx <= 3) {
        setStep("complaint_when");
        addMsg(WHEN_QUESTION[lang], "kontratani");
      } else {
        addMsg(INVALID[lang], "kontratani");
      }
      return;
    }

    if (step === "complaint_when") {
      const idx = parseInt(val);
      if (idx >= 1 && idx <= 4) {
        addMsg(RESOLUTION[lang], "kontratani");
        setTimeout(() => addMsg(MAIN_MENU[lang], "kontratani"), 800);
        setStep("main");
      } else {
        addMsg(INVALID[lang], "kontratani");
      }
      return;
    }

    if (step === "done") {
      addMsg(
        lang === "en"
          ? "This session has ended. Please reload to start again."
          : "Tapos na ang session. I-reload para magsimula ulit.",
        "kontratani"
      );
    }
  };

  // Suppress unused variable warnings for state setters used only via step flow
  void complaintType;
  void supportType;

  return (
    <div style={styles.page}>
      <div style={styles.phone}>

        <div style={styles.header}>
          <div style={styles.avatar}>K</div>
          <div style={{ flex: 1 }}>
            <div style={styles.name}>KontratAni</div>
            <div style={styles.sub}>Text Message</div>
          </div>
          <div style={styles.farmerTag}>
            <div style={styles.farmerInitials}>
              {(farmer?.name ?? 'JD').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div style={styles.farmerName}>{farmer?.name ?? 'Juan dela Cruz'}</div>
              <div style={styles.farmerSub}>Quezon Farmers Coop</div>
            </div>
          </div>
        </div>

        <div style={styles.body}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.from === "farmer" ? "flex-end" : "flex-start",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  ...(msg.from === "farmer" ? styles.farmerBubble : styles.kontrataniBubble),
                  ...(msg.isBroadcast ? styles.broadcastBubble : {}),
                }}
              >
                {msg.isBroadcast && (
                  <div style={styles.broadcastLabel}>📡 Manager Broadcast</div>
                )}
                {msg.text.split("\n").map((line, i, arr) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            type="number"
            inputMode="numeric"
            placeholder="Type a number..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={step === "done"}
          />
          <button
            style={{ ...styles.sendBtn, opacity: step === "done" ? 0.4 : 1 }}
            onClick={handleSend}
            disabled={step === "done"}
          >
            ➤
          </button>
        </div>

      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#d6d6d6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },
  phone: {
    width: 360,
    height: 680,
    background: "#fff",
    borderRadius: 32,
    boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    background: "#f2f2f2",
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderBottom: "1px solid #ddd",
    flexShrink: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#2e7d32",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 700,
    flexShrink: 0,
  },
  name: { fontWeight: 700, fontSize: 16, color: "#111" },
  sub: { fontSize: 12, color: "#888" },
  farmerTag: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#f0f7f0",
    border: "1px solid #a5d6a7",
    borderRadius: 10,
    padding: "4px 8px",
    flexShrink: 0,
  },
  farmerInitials: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#2e7d32",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 9,
    fontWeight: 700,
    flexShrink: 0,
  },
  farmerName: { fontSize: 10, fontWeight: 700, color: "#1b5e20" },
  farmerSub: { fontSize: 9, color: "#4caf50" },
  body: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "16px 14px",
  },
  kontrataniBubble: {
    background: "#f0f0f0",
    color: "#111",
    padding: "11px 14px",
    borderRadius: "16px 16px 16px 4px",
    fontSize: 14,
    lineHeight: 1.7,
    maxWidth: "82%",
  },
  broadcastBubble: {
    background: "#f0f7f0",
    border: "1.5px solid #a5d6a7",
  },
  broadcastLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#2e7d32",
    marginBottom: 4,
  },
  farmerBubble: {
    background: "#2e7d32",
    color: "#fff",
    padding: "11px 18px",
    borderRadius: "16px 16px 4px 16px",
    fontSize: 15,
    fontWeight: 700,
    maxWidth: "40%",
    textAlign: "center" as const,
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 14px",
    borderTop: "1px solid #eee",
    background: "#fafafa",
    gap: 10,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: "11px 16px",
    borderRadius: 20,
    border: "1px solid #ddd",
    fontSize: 16,
    outline: "none",
    background: "#f5f5f5",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "#2e7d32",
    color: "#fff",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    flexShrink: 0,
  },
};