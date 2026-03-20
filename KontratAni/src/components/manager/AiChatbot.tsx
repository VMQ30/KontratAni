import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickActions = [
  { label: "How do I accept a contract?", icon: "📄" },
  { label: "How to allocate quotas?", icon: "📊" },
  { label: "How does SMS broadcasting work?", icon: "📱" },
  { label: "How are payouts released?", icon: "💰" },
  { label: "What is escrow?", icon: "🔒" },
  { label: "Show system tutorial", icon: "🎓" },
];

function getAiResponse(
  question: string,
  contracts: any[],
  cooperatives: any[],
): string {
  const q = question.toLowerCase();
  const coop = cooperatives[0];
  const activeContracts = contracts.filter((c) => c.matchedCooperative);

  if (
    q.includes("tutorial") ||
    q.includes("how to use") ||
    q.includes("guide") ||
    q.includes("get started")
  ) {
    return `🎓 **Welcome to KontratAni — Manager Portal Tutorial!**

Here's a step-by-step guide to using the system:

**Step 1: Set Up Your Profile**
Navigate to **Profile & Land** to register your cooperative details, add member farmers, and set soil/location data. Toggle between Cooperative and Solo Farmer mode.

**Step 2: Review Contract Inbox**
Go to **Contract Inbox** to see forward contracts from institutional buyers. Review the crop, volume, price, and deadline. Click **Accept** to commit.

**Step 3: Allocate Quotas** *(Coops only)*
After accepting, go to **Quota Allocation** to distribute the required volume among your member farmers using the sliders.

**Step 4: Broadcast SMS**
Head to **SMS & Monitoring** to send automated SMS blasts to assigned farmers. Watch the live table and map update as farmers reply.

**Step 5: Release Payouts**
Once harvest is confirmed, go to **Payouts** to distribute escrow funds directly to farmers' GCash, Maya, or cash wallets.

**Step 6: Generate AI Reports**
Use **AI Reports** to get intelligent analysis of your contracts, crop health, finances, and farmer performance.

Need help with a specific step? Just ask! 😊`;
  }

  if (q.includes("accept") && q.includes("contract")) {
    return `📄 **How to Accept a Contract:**

1. Go to **Contract Inbox** from the sidebar
2. You'll see pending contracts from institutional buyers
3. Each card shows the crop type, volume (kg), target date, and buyer name
4. Click the green **"Accept Contract"** button on any card
5. The contract status will update to "Accepted" across the entire platform
6. You'll then be prompted to proceed to **Quota Allocation**

Currently you have **${contracts.filter((c) => c.status === "matched").length}** contracts waiting for your review.`;
  }

  if (q.includes("quota") || q.includes("allocat")) {
    return `📊 **Quota Allocation Guide:**

1. After accepting a contract, navigate to **Quota Allocation**
2. Select the contract you want to allocate from the tabs
3. Use the **sliders** to assign kg amounts to each member farmer
4. The system shows remaining volume and warns if you over-allocate
5. Click **"Confirm Allocation"** to finalize

**Tips:**
- Assign based on each farmer's land capacity (hectares)
- Larger plots can handle more volume
- Your cooperative has **${coop?.members?.length || 0} member farmers** with **${coop?.totalHectares || 0} total hectares**`;
  }

  if (q.includes("sms") || q.includes("broadcast") || q.includes("message")) {
    return `📱 **SMS Broadcasting Guide:**

1. Go to **SMS & Monitoring** from the sidebar
2. Select an active contract from the tabs at the top
3. Click the **"Broadcast SMS"** button to send notifications to all assigned farmers
4. Watch the status table update in real-time as SMS messages are sent
5. The **Farm Plot Map** will change colors based on farmer responses

**Status Color Legend:**
- ⚪ Gray = Pending (no SMS sent)
- 🟡 Yellow = SMS Sent (awaiting reply)
- 🔵 Blue = Confirmed (farmer acknowledged)
- 🟢 Green = Planted
- 🟤 Dark Green = Harvested

Farmers respond via SMS from their feature phones — the system tracks everything automatically!`;
  }

  if (
    q.includes("payout") ||
    q.includes("payment") ||
    q.includes("release") ||
    q.includes("distribute") ||
    q.includes("money")
  ) {
    return `💰 **Payout Distribution Guide:**

1. Navigate to **Payouts** from the sidebar
2. Select a funded contract (buyer must have locked escrow funds first)
3. Choose the **payout method** for each farmer:
   - **GCash** — instant mobile wallet transfer
   - **Maya** — instant mobile wallet transfer
   - **Cash** — physical cash distribution
4. Click **"Distribute Payouts"** to release funds
5. Watch the animated distribution and balance update

**Current Status:**
- Total escrow locked: **₱${contracts.reduce((s, c) => s + c.escrowAmount, 0).toLocaleString()}**
- Funded contracts: **${contracts.filter((c) => c.escrowAmount > 0).length}**`;
  }

  if (q.includes("escrow") || q.includes("fund")) {
    return `🔒 **Understanding Escrow in KontratAni:**

Escrow is a secure holding mechanism where the **institutional buyer locks funds** before the farming cycle begins. This guarantees farmers will be paid upon delivery.

**How it works:**
1. Buyer creates a demand and matches with your cooperative
2. After both parties accept, the buyer clicks **"Lock Funds in Escrow"**
3. The funds are held securely (simulated) until harvest is confirmed
4. Upon successful delivery, the cooperative manager releases payouts to individual farmers

**Benefits:**
- Farmers have guaranteed payment before planting
- Buyers have committed supply
- Reduces risk for both parties

Currently **₱${contracts.reduce((s, c) => s + c.escrowAmount, 0).toLocaleString()}** is locked in escrow across your contracts.`;
  }

  if (
    q.includes("contract") &&
    (q.includes("status") || q.includes("how many") || q.includes("active"))
  ) {
    return `📋 **Your Contract Summary:**

- **Total contracts:** ${contracts.length}
- **Active:** ${activeContracts.length}
- **In Progress:** ${contracts.filter((c) => c.status === "in_progress").length}
- **Funded:** ${contracts.filter((c) => c.status === "funded").length}
- **Awaiting acceptance:** ${contracts.filter((c) => c.status === "matched").length}
- **Completed:** ${contracts.filter((c) => c.status === "completed").length}

Total contracted volume: **${contracts.reduce((s, c) => s + c.volumeKg, 0).toLocaleString()} kg**
Total escrow locked: **₱${contracts.reduce((s, c) => s + c.escrowAmount, 0).toLocaleString()}**`;
  }

  if (
    q.includes("farmer") &&
    (q.includes("how many") || q.includes("list") || q.includes("member"))
  ) {
    return `👥 **Your Member Farmers:**

${coop?.members?.map((m: any, i: number) => `${i + 1}. **${m.name}** — ${m.hectares} ha in ${m.location} (${m.payoutMethod})`).join("\n") || "No members found."}

**Total:** ${coop?.members?.length || 0} farmers | **${coop?.totalHectares || 0} hectares** combined
**Cooperative:** ${coop?.name || "N/A"} — ${coop?.region || "N/A"}`;
  }

  if (
    q.includes("report") ||
    q.includes("analytics") ||
    q.includes("insight")
  ) {
    return `📈 **AI Reports Feature:**

Navigate to **AI Reports** from the sidebar to generate intelligent analysis. Available report types:

1. **Contract Overview** — Summary of all active contracts and milestones
2. **Crop Health Analysis** — Soil quality, weather forecasts, and growth projections
3. **Financial Summary** — Escrow balances, payout forecasts, and market comparisons
4. **Farmer Performance** — Response rates, yield estimates, and recommendations

Just select a report type and click **"Generate Report"**. The AI analyzes your cooperative's data and produces actionable insights!`;
  }

  if (
    q.includes("hello") ||
    q.includes("hi") ||
    q.includes("hey") ||
    q.includes("kumusta")
  ) {
    return `Kumusta! 👋 I'm your KontratAni AI assistant. I can help you navigate the manager portal, explain features, or give you a full system tutorial.

Try asking me:
- "Show system tutorial"
- "How do I accept a contract?"
- "What's my contract status?"
- "How are payouts released?"

What would you like to know?`;
  }

  return `I'd be happy to help! Here are some things I can assist with:

- **"Show system tutorial"** — Full step-by-step guide
- **"How do I accept a contract?"** — Contract management
- **"How to allocate quotas?"** — Volume distribution
- **"How does SMS broadcasting work?"** — Farmer notifications
- **"How are payouts released?"** — Fund distribution
- **"What's my contract status?"** — Portfolio overview
- **"List my farmers"** — Member database

Just ask a question and I'll guide you through it! 😊`;
}

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "0",
      role: "assistant",
      content:
        "Kumusta! 👋 I'm your KontratAni AI assistant. I can help you navigate the platform, explain features, or provide a full tutorial. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const contracts = useAppStore((s) => s.contracts);
  const cooperatives = useAppStore((s) => s.cooperatives);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(
      () => {
        const response = getAiResponse(text, contracts, cooperatives);
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsTyping(false);
      },
      800 + Math.random() * 700,
    );
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90"
              size="icon"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <span className="absolute -right-1 -top-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-terracotta" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex h-[540px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">
                    KontratAni AI
                  </p>
                  <p className="text-[10px] text-primary-foreground/70">
                    Always ready to help
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                        msg.role === "user"
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md bg-accent text-foreground",
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return (
                              <strong key={i} className="font-semibold">
                                {part.slice(2, -2)}
                              </strong>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        })}
                      </div>
                    </div>
                    {msg.role === "user" && (
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-accent px-4 py-3">
                      <div className="flex gap-1">
                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions (show only when few messages) */}
              {messages.length <= 2 && !isTyping && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Quick Actions
                  </p>
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.label)}
                      className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent"
                    >
                      <span>{action.icon}</span>
                      <span className="flex-1">{action.label}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border px-3 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex items-center gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about KontratAni..."
                  className="h-9 rounded-full border-border bg-muted/50 px-4 text-sm"
                  disabled={isTyping}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full"
                  disabled={!input.trim() || isTyping}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
