import { useState, useRef, useEffect, createContext, useContext } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";

const API = "https://dashboard-3qdy.onrender.com/api";
const COLORS = ["#00D2FF", "#7B61FF", "#FF6B6B", "#FFD93D", "#6BCB77", "#FF8C42", "#C5A8FF", "#FF9EBB"];

// ─── DATA CONTEXT ─────────────────────────────────────────────────────────────
const DataContext = createContext(null);
const useData = () => useContext(DataContext);

function DataProvider({ clientId, children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    const base = `${API}/${clientId}`;
    Promise.all([
      fetch(`${base}/summary`).then(r => r.json()),
      fetch(`${base}/monthly`).then(r => r.json()),
      fetch(`${base}/channels`).then(r => r.json()),
      fetch(`${base}/users`).then(r => r.json()),
      fetch(`${base}/input-types`).then(r => r.json()),
      fetch(`${base}/output-types`).then(r => r.json()),
      fetch(`${base}/language`).then(r => r.json()),
      fetch(`${base}/platforms`).then(r => r.json()),
    ])
      .then(([summary, monthly, channels, users, inputTypes, outputTypes, language, platforms]) => {
        // Normalise field names coming from the API to match what charts expect
        const normMonthly = (monthly.data || []).map(d => ({
          ...d,
          uploadedHrs: d.uploaded_hrs ?? 0,
          createdHrs: d.created_hrs ?? 0,
          publishedHrs: d.published_hrs ?? 0,
        }));
        const normChannels = (channels.data || []).map(d => ({
          ...d,
          uploadedHrs: d.uploaded_hrs ?? 0,
          createdHrs: d.created_hrs ?? 0,
          publishedHrs: d.published_hrs ?? 0,
        }));
        const normUsers = (users.data || []).map(d => ({
          ...d,
          uploadedHrs: d.uploaded_hrs ?? 0,
          createdHrs: d.created_hrs ?? 0,
          publishedHrs: d.published_hrs ?? 0,
        }));
        const normInputTypes = (inputTypes.data || []).map(d => ({
          ...d,
          uploadedHrs: d.uploaded_hrs ?? 0,
          createdHrs: d.created_hrs ?? 0,
          publishedHrs: d.published_hrs ?? 0,
        }));
        const normOutputTypes = (outputTypes.data || []).map(d => ({
          ...d,
          createdHrs: d.created_hrs ?? 0,
          publishedHrs: d.published_hrs ?? 0,
        }));
        const normLang = (language.data || []).map(d => ({
          ...d,
          uploadedHrs: d.uploaded_hrs ?? 0,
          createdHrs: d.created_hrs ?? 0,
          publishedHrs: d.published_hrs ?? 0,
        }));
        // Platforms: convert platform_totals object → array for charts
        const platformArr = Object.entries(platforms.platform_totals || {}).map(([platform, count]) => ({
          platform,
          count,
        }));
        setData({
          clientId,
          summary,
          monthly: normMonthly,
          channels: normChannels,
          users: normUsers,
          inputTypes: normInputTypes,
          outputTypes: normOutputTypes,
          language: normLang,
          platforms: platformArr,
          platformsByChannel: platforms.by_channel || [],
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(0,210,255,0.15)", borderTop: "3px solid #00D2FF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: "#555", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>Loading {clientId} data...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
      <div style={{ color: "#FF6B6B", fontSize: 14 }}>⚠ Failed to load data</div>
      <div style={{ color: "#555", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{error}</div>
      <div style={{ color: "#444", fontSize: 11 }}>Is the API running? → <code style={{ color: "#00D2FF" }}>uvicorn app:app --reload</code> in frammer-api/</div>
    </div>
  );
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n;
const pct = (a, b) => b === 0 ? "0%" : `${((a/b)*100).toFixed(1)}%`;

function KpiCard({ label, value, sub, color = "#00D2FF", trend, badge }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid rgba(255,255,255,0.08)`,
      borderRadius: 12,
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "12px 12px 0 0" }} />
      <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>{sub}</div>}
      {badge && <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, background: "rgba(0,210,255,0.12)", color: "#00D2FF", padding: "2px 8px", borderRadius: 20, fontFamily: "'DM Mono', monospace" }}>{badge}</div>}
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: "'Syne', sans-serif", letterSpacing: "0.02em" }}>{children}</div>
      {sub && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: "#888", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginTop: 2 }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong></div>
      ))}
    </div>
  );
}

// ─── NLQ ENGINE ──────────────────────────────────────────────────────────────
function buildSystemPrompt({ summary, monthly, channels, users, inputTypes, outputTypes, language, platforms, clientId }) {
  const topChannels = [...(channels || [])].sort((a, b) => b.published - a.published).slice(0, 8)
    .map(c => `${c.channel}: ${c.uploaded}up/${c.created}cr/${c.published}pub (${c.created > 0 ? (c.published/c.created*100).toFixed(2) : 0}% rate)`).join(' | ');

  const topUsers = [...(users || [])].sort((a, b) => b.published - a.published).slice(0, 8)
    .map(u => `${u.user} ${u.uploaded}/${u.created}/${u.published}`).join(' | ');

  const outputStr = (outputTypes || []).map(d => `${d.type} cr:${d.created}/pub:${d.published}`).join(' | ');
  const inputStr = (inputTypes || []).slice(0, 8).map(d => `${d.type} up:${d.uploaded}/pub:${d.published}`).join(' | ');
  const langStr = (language || []).map(d => `${d.language} up:${d.uploaded}/pub:${d.published}`).join(' | ');
  const platStr = (platforms || []).filter(p => p.count > 0).map(p => `${p.platform}:${p.count}`).join(' | ');

  const peakMonth = [...(monthly || [])].sort((a, b) => b.uploaded - a.uploaded)[0];
  const bestPubMonth = [...(monthly || [])].sort((a, b) => b.published - a.published)[0];

  return `You are a data analyst for Frammer AI, a B2B video AI platform. Answer questions concisely (2-4 sentences) using ONLY the dataset below for ${(clientId || 'this client').toUpperCase().replace('_',' ')}. Always cite specific numbers.

CLIENT: ${(clientId || 'unknown').toUpperCase().replace('_',' ')}
TOTALS: Uploaded ${summary.total_uploaded || 0} | Created ${summary.total_created || 0} | Published ${summary.total_published || 0} | Upload hrs ${(summary.total_uploaded_hrs || 0).toFixed(1)} | Created hrs ${(summary.total_created_hrs || 0).toFixed(1)}

MONTHLY (${(monthly || []).length} months): Peak uploads: ${peakMonth ? peakMonth.month + ' (' + peakMonth.uploaded + ')' : 'N/A'} | Best publish month: ${bestPubMonth ? bestPubMonth.month + ' (' + bestPubMonth.published + ')' : 'N/A'}

CHANNELS: ${topChannels || 'No data'}

OUTPUT TYPES: ${outputStr || 'No data'}
INPUT TYPES: ${inputStr || 'No data'}
LANGUAGE: ${langStr || 'No data'}
TOP USERS (up/cr/pub): ${topUsers || 'No data'}
PLATFORMS: ${platStr || 'No data'}`;
}

async function queryNLQ(conversationHistory, systemPrompt) {
  const apiKey = process.env.REACT_APP_GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return "Groq API key not found. Add REACT_APP_GROQ_API_KEY to your .env file and restart the dev server.";
  }
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory
        ]
      })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 401) return "Invalid API key. Please check your REACT_APP_GROQ_API_KEY in .env and restart the server.";
      if (response.status === 429) return "Rate limit reached. Please wait a moment and try again.";
      return `API error (${response.status}): ${err.error?.message || "Unknown error"}`;
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response received from Groq.";
  } catch (e) {
    if (e.message?.includes("fetch")) return "Network error — check your internet connection.";
    return `Error: ${e.message}`;
  }
}

// Legacy local KB fallback (used when no API key)
const NLQ_KB = [
  {
    keys: ["channel", "gap", "process", "publish", "drop", "biggest", "difference"],
    answer: "Channel B has the largest absolute gap — 4,251 created vs only 19 published (0.45% rate). Channel D is the most alarming: 701 videos created with 0 ever published, a complete publish drop-off. Channel A leads in publishing with 71 published (1.5% rate), making it the healthiest funnel of all 18 channels."
  },
  {
    keys: ["output type", "format", "publish rate", "best", "key moment", "chapter", "summary", "full package"],
    answer: "My Key Moments has the best publish rate at 2.6% (32 out of 1,237 created). Key Moments leads in absolute publish count with 41 published out of 6,377 created (0.64%). Chapters and Summary have the weakest conversion at 0.1% and 0.12% respectively, despite significant creation volume."
  },
  {
    keys: ["input type", "category", "interview", "news", "speech", "debate", "discussion", "press"],
    answer: "Discussion Show has the highest publish rate at 3.8% (3/79). News Bulletin leads in absolute publishes with 39 (1.2% rate). Interview is the most uploaded type with 1,299 videos but has a low 0.7% publish conversion. Press Conference has the poorest rate at just 0.2% despite 280 uploads."
  },
  {
    keys: ["language", "english", "hindi", "mix"],
    answer: "English dominates with 2,647 uploads and 91 published (1.03% publish rate), accounting for 59% of all uploads. Hindi has 1,792 uploads with only 20 published (0.33% rate) — significantly lower conversion. Mix and other languages are negligible with 0 published, indicating a strong English-first publishing bias."
  },
  {
    keys: ["user", "top", "contributor", "volume", "who"],
    answer: "Chandan is the top contributor with 489 uploads and 19 published. QA-Purushottam follows with 309 uploads and 13 published (4.2% rate — best among top users). Auto Upload generates 176 videos automatically (0 published). Many users like Shadab (83 uploads) and Divyanshu (95 uploads) have 0 published videos."
  },
  {
    keys: ["platform", "youtube", "reels", "shorts", "instagram", "facebook"],
    answer: "YouTube leads with 34 published videos, followed closely by Reels (32) and Shorts (22). Instagram has 11 and Facebook 8. LinkedIn, X/Twitter, and Threads show 0 publishes. Channel D is the biggest contributor to Reels (15) and Shorts (18) publishing, while Channel A leads Instagram (7 publishes)."
  },
  {
    keys: ["month", "trend", "growth", "time", "monthly", "when", "peak", "low"],
    answer: "Feb 2026 is the peak month with 676 uploads and 2,756 created — a +37% MoM spike from Jan 2026. Mar 2025 had the highest creation count at 2,555. July 2025 and Sep 2025 had 0 published videos. The overall publish rate across the year is just 0.74% of created videos, with Apr 2025 being the most published month (44 videos)."
  },
  {
    keys: ["duration", "hours", "usage", "time processed"],
    answer: "Total uploaded duration is ~807 hours across the year, with Frammer AI amplifying that to ~1,561 hours of created content (1.93x multiplier). Feb 2026 alone saw 161.9 hours uploaded and 301.5 hours created. Channel B has the highest uploaded duration (297 hours) but only 0.4 hours published — a severe underutilization."
  },
  {
    keys: ["data quality", "missing", "unknown", "error", "blank", "empty", "null"],
    answer: "Key data quality issues: 100% of videos have 'Unknown' team names, 12 videos have no input type classification, and ~85% of published videos are missing their platform/URL fields. Channel D shows a logical anomaly — the channel-wise platform table shows publishes on YouTube/Reels/Shorts, but the combined data shows 0 published, indicating a data inconsistency worth investigating."
  },
  {
    keys: ["underused", "inactive", "never", "zero", "underperform"],
    answer: "11 out of 18 channels have never published a single video. Channels D, F, I, J, K, L, M, N, O, P, R all show 0 published despite significant creation activity (Channel D: 701 created, Channel F: 320 created). Users like Auto Upload (176), Shadab (83), Divyanshu Dutta Roy (95), and AB (101) also have 0 published videos, suggesting they use Frammer purely for processing, not publishing."
  },
  {
    keys: ["summary", "overview", "highlight", "insight", "key", "main"],
    answer: "Key insights: 4,453 videos uploaded → 14,914 created (3.35x AI amplification) → only 111 published (0.74% publish rate). Channel A is the star with 71 publishes; Channel D is the biggest mystery with 701 created and 0 published. English content publishes 3x more than Hindi. My Key Moments format has the best conversion. Feb 2026 shows accelerating growth, suggesting expanding adoption."
  }
];

function queryNLQLocal(question) {
  const q = question.toLowerCase();
  const tokens = q.split(/\s+/);
  let best = { score: 0, idx: -1 };
  NLQ_KB.forEach((entry, idx) => {
    const score = entry.keys.reduce((acc, k) => acc + (q.includes(k) ? 2 : tokens.some(t => k.includes(t) && t.length > 3) ? 1 : 0), 0);
    if (score > best.score) best = { score, idx };
  });
  if (best.score > 0) return NLQ_KB[best.idx].answer;
  return "Based on the dataset (Mar 2025 – Feb 2026): 4,453 videos were uploaded, 14,914 created by Frammer AI (3.35x amplification), and only 111 published (0.74% rate). Channel A leads all publishing with 71 videos.";
}

// ─── PAGES ───────────────────────────────────────────────────────────────────

function ExecSummary() {
  const { summary, monthly, channels, outputTypes, inputTypes, language } = useData();
  const totalUploaded = summary.total_uploaded;
  const totalCreated = summary.total_created;
  const totalPublished = summary.total_published;
  const publishRate = summary.overall_publish_rate_pct?.toFixed(1) ?? "0.0";
  const avgMultiplier = totalUploaded > 0 ? (totalCreated / totalUploaded).toFixed(1) : "0";
  const maxCreated = Math.max(...outputTypes.map(d => d.created), 1);
  const maxUpload = Math.max(...inputTypes.map(d => d.uploaded), 1);

  return (
    <div>
      {/* Alert Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(255,107,107,0.12), rgba(255,107,107,0.04))",
        border: "1px solid rgba(255,107,107,0.25)",
        borderRadius: 10, padding: "12px 18px", marginBottom: 24,
        display: "flex", alignItems: "center", gap: 10
      }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span style={{ fontSize: 13, color: "#ff9e9e" }}>
          <strong>Low publish rate alert:</strong> Only {publishRate}% of created videos are published.
          {summary.zero_publish_month_count > 0 && ` ${summary.zero_publish_month_count} months had 0 published.`}
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        <KpiCard label="Total Uploaded" value={fmt(totalUploaded)} sub={`${summary.total_uploaded_hrs?.toFixed(0)} hours of content`} color="#7B61FF" badge={summary.period} />
        <KpiCard label="Total Created" value={fmt(totalCreated)} sub={`${avgMultiplier}x output multiplier`} color="#00D2FF" />
        <KpiCard label="Total Published" value={totalPublished} sub={`${summary.total_published_hrs?.toFixed(1)} hours published`} color="#6BCB77" />
        <KpiCard label="Publish Rate" value={`${publishRate}%`} sub="of created videos" color="#FFD93D" badge="Low" />
      </div>

      {/* Two charts side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="Monthly video counts">Funnel: Upload → Create → Publish</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#555" }} />
              <YAxis tick={{ fontSize: 10, fill: "#555" }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="created" name="Created" stroke="#00D2FF" fill="rgba(0,210,255,0.08)" strokeWidth={2} />
              <Area type="monotone" dataKey="uploaded" name="Uploaded" stroke="#7B61FF" fill="rgba(123,97,255,0.08)" strokeWidth={2} />
              <Area type="monotone" dataKey="published" name="Published" stroke="#6BCB77" fill="rgba(107,203,119,0.12)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="Top 6 channels by created volume">Channel Performance Overview</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={channels.slice(0, 6)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="channel" tick={{ fontSize: 11, fill: "#777" }} />
              <YAxis tick={{ fontSize: 10, fill: "#555" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="created" name="Created" fill="#00D2FF" opacity={0.8} radius={[3, 3, 0, 0]} />
              <Bar dataKey="published" name="Published" fill="#6BCB77" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 18, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="By output format">Top Output Types</SectionTitle>
          {outputTypes.map((d, i) => (
            <div key={d.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#aaa" }}>{d.type}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 80, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ width: `${(d.created / maxCreated) * 100}%`, height: "100%", background: COLORS[i], borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, color: COLORS[i], width: 38, textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{fmt(d.created)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 18, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="By input content category">Input Type Mix</SectionTitle>
          {inputTypes.slice(0, 5).map((d, i) => (
            <div key={d.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#aaa" }}>{d.type}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 80, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ width: `${(d.uploaded / maxUpload) * 100}%`, height: "100%", background: COLORS[i+3], borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, color: COLORS[i+3], width: 38, textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{fmt(d.uploaded)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 18, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="Language distribution">Language Breakdown</SectionTitle>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={language} dataKey="created" nameKey="language" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                {language.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: "#888" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function UsageTrends() {
  const { monthly, summary } = useData();
  const [metric, setMetric] = useState("count");

  const chartData = monthly.map(d => ({
    month: d.month,
    Uploaded: metric === "count" ? d.uploaded : +d.uploadedHrs.toFixed(1),
    Created: metric === "count" ? d.created : +d.createdHrs.toFixed(1),
    Published: metric === "count" ? d.published : +d.publishedHrs.toFixed(2),
  }));

  const last = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 2];
  const growthMoM = prev?.uploaded > 0 ? ((last?.uploaded - prev?.uploaded) / prev?.uploaded * 100).toFixed(0) : "N/A";
  const peakMonth = [...monthly].sort((a, b) => b.created - a.created)[0]?.month ?? "";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Peak Month (Created)" value={peakMonth} sub={`${summary.peak_publish_count} published in best month`} color="#7B61FF" />
        <KpiCard label={`MoM Growth (${prev?.month}→${last?.month})`} value={growthMoM !== "N/A" ? `+${growthMoM}%` : "N/A"} sub="Upload volume" color="#6BCB77" />
        <KpiCard label="Total Processed Hours" value={`${summary.total_created_hrs?.toFixed(0)}h`} sub={`Across all ${summary.month_count} months`} color="#00D2FF" />
        <KpiCard label="Overall Publish Rate" value={`${summary.overall_publish_rate_pct?.toFixed(1)}%`} sub="Created → Published" color="#FFD93D" badge="Low" />
      </div>

      {/* Toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["count", "hours"].map(m => (
          <button key={m} onClick={() => setMetric(m)} style={{
            padding: "6px 18px", borderRadius: 20, fontSize: 12, cursor: "pointer",
            background: metric === m ? "#00D2FF" : "rgba(255,255,255,0.06)",
            color: metric === m ? "#000" : "#888", border: "none", fontWeight: metric === m ? 700 : 400,
            fontFamily: "'DM Mono', monospace"
          }}>{m === "count" ? "Video Count" : "Duration (hrs)"}</button>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 24, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
        <SectionTitle sub="Mar 2025 – Feb 2026">Monthly Volume Trends</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#555" }} />
            <YAxis tick={{ fontSize: 10, fill: "#555" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#666" }} />
            <Area type="monotone" dataKey="Created" stroke="#00D2FF" fill="rgba(0,210,255,0.07)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="Uploaded" stroke="#7B61FF" fill="rgba(123,97,255,0.07)" strokeWidth={2} />
            <Area type="monotone" dataKey="Published" stroke="#6BCB77" fill="rgba(107,203,119,0.12)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="Monthly publish conversion %">Publish Rate Over Time</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthly.map(d => ({ month: d.month, rate: +(d.published / (d.created || 1) * 100).toFixed(2) }))} margin={{ left: -20, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#555" }} />
              <YAxis tick={{ fontSize: 10, fill: "#555" }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="rate" name="Publish Rate %" stroke="#FFD93D" strokeWidth={2} dot={{ r: 3, fill: "#FFD93D" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="Created ÷ Uploaded per month">Output Multiplier (AI Amplification)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly.map(d => ({ month: d.month, mult: +(d.created / (d.uploaded || 1)).toFixed(2) }))} margin={{ left: -20, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#555" }} />
              <YAxis tick={{ fontSize: 10, fill: "#555" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="mult" name="Multiplier" fill="#C5A8FF" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ChannelAnalysis() {
  const { channels, platformsByChannel } = useData();
  const [sortBy, setSortBy] = useState("created");

  const channelsSorted = [...channels].sort((a, b) => b[sortBy] - a[sortBy]);
  const publishingChannels = channels.filter(c => c.published > 0).length;
  const neverPublished = channels.filter(c => c.published === 0).length;
  const topChannel = [...channels].sort((a, b) => b.published - a.published)[0];

  // Build platform columns dynamically from platformsByChannel keys
  const platformCols = platformsByChannel.length > 0
    ? Object.keys(platformsByChannel[0]).filter(k => k !== "channel")
    : [];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Active Channels" value={channels.length} sub="Total workspaces" color="#00D2FF" />
        <KpiCard label="Publishing Channels" value={publishingChannels} sub="Have ≥1 published video" color="#6BCB77" />
        <KpiCard label="Never Published" value={neverPublished} sub="Channels with 0 publishes" color="#FF6B6B" badge="⚠ Risk" />
        <KpiCard label="Top Channel" value={topChannel?.channel ?? "—"} sub={`${topChannel?.published ?? 0} published, ${topChannel?.created ?? 0} created`} color="#7B61FF" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <SectionTitle sub="Upload → Create → Publish funnel">Channel Funnel</SectionTitle>
            <div style={{ display: "flex", gap: 6 }}>
              {["uploaded","created","published"].map(s => (
                <button key={s} onClick={() => setSortBy(s)} style={{
                  padding: "3px 10px", borderRadius: 12, fontSize: 10, cursor: "pointer",
                  background: sortBy === s ? "rgba(0,210,255,0.2)" : "rgba(255,255,255,0.05)",
                  color: sortBy === s ? "#00D2FF" : "#666", border: "1px solid",
                  borderColor: sortBy === s ? "rgba(0,210,255,0.4)" : "transparent",
                  fontFamily: "'DM Mono', monospace"
                }}>{s}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={channelsSorted.slice(0, 10)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="channel" tick={{ fontSize: 11, fill: "#777" }} />
              <YAxis tick={{ fontSize: 10, fill: "#555" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="uploaded" name="Uploaded" fill="#7B61FF" opacity={0.7} radius={[2,2,0,0]} />
              <Bar dataKey="created" name="Created" fill="#00D2FF" opacity={0.7} radius={[2,2,0,0]} />
              <Bar dataKey="published" name="Published" fill="#6BCB77" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="Publish conversion by channel">Publish Rate by Channel</SectionTitle>
          <div style={{ overflowY: "auto", maxHeight: 260 }}>
            {channels.map(c => {
              const rate = c.created > 0 ? (c.published / c.created * 100) : 0;
              return (
                <div key={c.channel} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: rate > 1 ? "rgba(107,203,119,0.2)" : "rgba(255,107,107,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: rate > 1 ? "#6BCB77" : "#FF6B6B", fontWeight: 700, flexShrink: 0 }}>{c.channel}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                      <div style={{ width: `${Math.min(rate * 10, 100)}%`, height: "100%", background: rate > 1 ? "#6BCB77" : rate > 0 ? "#FFD93D" : "rgba(255,255,255,0.1)", borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#666", fontFamily: "'DM Mono', monospace", width: 40, textAlign: "right" }}>{rate.toFixed(1)}%</div>
                  <div style={{ fontSize: 10, color: "#444", width: 50, textAlign: "right" }}>{c.published}/{c.created}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic platform × channel table */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
        <SectionTitle sub="Channel × Platform publishing grid">Multi-Dimensional View: Channel × Platform Publishing</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "#555", fontWeight: 600, fontFamily: "'DM Mono', monospace", fontSize: 10 }}>CHANNEL</th>
                {platformCols.map(p => (
                  <th key={p} style={{ textAlign: "center", padding: "8px 10px", color: "#555", fontWeight: 600, fontFamily: "'DM Mono', monospace", fontSize: 10 }}>{p.toUpperCase()}</th>
                ))}
                <th style={{ textAlign: "center", padding: "8px 10px", color: "#555", fontWeight: 600, fontFamily: "'DM Mono', monospace", fontSize: 10 }}>TOTAL PUB</th>
              </tr>
            </thead>
            <tbody>
              {platformsByChannel.map(row => {
                const rowTotal = platformCols.reduce((s, p) => s + (row[p] || 0), 0);
                if (rowTotal === 0 && !channels.find(c => c.channel === row.channel)?.published) return null;
                return (
                  <tr key={row.channel} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "8px 12px", color: "#ccc", fontWeight: 700 }}>Channel {row.channel}</td>
                    {platformCols.map(p => (
                      <td key={p} style={{ textAlign: "center", padding: "8px 10px", color: row[p] > 0 ? "#00D2FF" : "#333", fontFamily: "'DM Mono', monospace" }}>{row[p] > 0 ? row[p] : "—"}</td>
                    ))}
                    <td style={{ textAlign: "center", padding: "8px 10px", color: "#fff", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{rowTotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TypeMixFunnel() {
  const { outputTypes, inputTypes, platforms, language, loading } = useData();

  if (loading) return <div style={{ color: "#555", padding: 40, textAlign: "center" }}>Loading type mix data...</div>;

  // Compute summary KPIs from live data
  const bestOutputRate = outputTypes.length
    ? outputTypes.reduce((best, d) => {
        const r = d.created > 0 ? d.published / d.created : 0;
        return r > best.rate ? { type: d.type, rate: r } : best;
      }, { type: "", rate: 0 })
    : { type: "—", rate: 0 };

  const highestVolume = outputTypes.length
    ? outputTypes.reduce((top, d) => d.created > top.created ? d : top, outputTypes[0])
    : { type: "—", created: 0 };

  const totalLangUploaded = language.reduce((s, d) => s + (d.uploaded || 0), 0);
  const english = language.find(d => (d.language || "").toLowerCase().startsWith("en"));
  const englishPct = totalLangUploaded > 0 && english
    ? ((english.uploaded / totalLangUploaded) * 100).toFixed(0)
    : "—";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Best Publish Rate" value={`${(bestOutputRate.rate * 100).toFixed(2)}%`} sub={bestOutputRate.type} color="#6BCB77" />
        <KpiCard label="Highest Volume" value={highestVolume.type} sub={`${(highestVolume.created || 0).toLocaleString()} created`} color="#00D2FF" />
        <KpiCard label="English Dominance" value={`${englishPct}%`} sub="Of all uploads (en)" color="#7B61FF" />
        <KpiCard label="Input Types" value={inputTypes.length} sub="Distinct input categories" color="#FF6B6B" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="Created vs Published by output type">Output Type Funnel</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={outputTypes} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#555" }} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 11, fill: "#aaa" }} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="created" name="Created" fill="#00D2FF" opacity={0.7} radius={[0,3,3,0]} />
              <Bar dataKey="published" name="Published" fill="#6BCB77" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="Upload volumes by content category">Input Type Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={inputTypes.slice(0,7)} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#555" }} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 11, fill: "#aaa" }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="uploaded" name="Uploaded" fill="#7B61FF" opacity={0.8} radius={[0,3,3,0]} />
              <Bar dataKey="published" name="Published" fill="#FFD93D" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="Publish conversion by output format">Output Type Publish Rates</SectionTitle>
          {outputTypes.map((d, i) => {
            const rate = d.created > 0 ? (d.published / d.created * 100).toFixed(2) : "0.00";
            return (
              <div key={d.type} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: "#aaa" }}>{d.type}</span>
                  <span style={{ fontSize: 11, color: COLORS[i % COLORS.length], fontFamily: "'DM Mono', monospace" }}>{rate}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ width: `${Math.min(parseFloat(rate) * 50, 100)}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="Platform publish distribution">Publishing Platforms</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={platforms.filter(p => p.count > 0)} dataKey="count" nameKey="platform" cx="50%" cy="50%" innerRadius={35} outerRadius={65} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {platforms.filter(p => p.count > 0).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle sub="Language upload & publish breakdown">Language Usage</SectionTitle>
          {language.map((d, i) => (
            <div key={d.language} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: "#aaa" }}>{d.language}</span>
                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS[i % COLORS.length] }}>{pct(d.published, d.created)} pub rate</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                <div style={{ width: `${totalLangUploaded > 0 ? (d.uploaded / totalLangUploaded) * 100 : 0}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{(d.uploaded || 0).toLocaleString()} uploaded · {d.published} published</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoExplorer() {
  // Simulated sample data (from obfuscated dataset hints)
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPublished, setFilterPublished] = useState("all");

  const SAMPLE_VIDEOS = [
    { id: "4168417", headline: "Headline_3a11c61b3c1b", type: "news bulletin", user: "Neha", published: "No", platform: "", team: "Unknown" },
    { id: "154352428", headline: "Headline_415212ea682f", type: "news bulletin", user: "Neha", published: "No", platform: "", team: "Unknown" },
    { id: "9920411", headline: "Interview_a7f3d9b2e4c1", type: "interview", user: "Chandan", published: "Yes", platform: "YouTube", team: "Team A" },
    { id: "7734892", headline: "Speech_c2b8f4a1d7e3", type: "speech", user: "Sandeep Belaki", published: "No", platform: "", team: "Team B" },
    { id: "5521634", headline: "Special_f9e2a3b7c4d6", type: "special reports", user: "QA-Purushottam", published: "Yes", platform: "Instagram", team: "Team A" },
    { id: "3345127", headline: "Debate_b4c7d1e9f2a3", type: "debate", user: "vikas.s@moolya", published: "No", platform: "", team: "Unknown" },
    { id: "8812093", headline: "Press_d6a1b3f7e2c9", type: "press conference", user: "Chandan", published: "Yes", platform: "Reels", team: "Team C" },
    { id: "2298741", headline: "Interview_e3c8b2f1a4d7", type: "interview", user: "Auto Upload", published: "No", platform: "", team: "Unknown" },
    { id: "6673428", headline: "Bulletin_a1d4c7b9f3e2", type: "news bulletin", user: "QA-Purushottam", published: "Yes", platform: "Shorts", team: "Team A" },
    { id: "4419823", headline: "Discussion_f7b2e4a3d1c8", type: "discussion-show", user: "Adarsh (Frammer)", published: "Yes", platform: "YouTube", team: "Team B" },
    { id: "1145392", headline: "Speech_c9a3f2b7e4d1", type: "speech", user: "Sandeep Belaki", published: "No", platform: "", team: "Unknown" },
    { id: "7823041", headline: "Interview_d2b5f8a1c3e7", type: "interview", user: "Chandan", published: "No", platform: "", team: "Team A" },
  ];

  const filtered = SAMPLE_VIDEOS.filter(v => {
    if (filterPublished !== "all" && v.published.toLowerCase() !== filterPublished) return false;
    if (filterType !== "all" && v.type !== filterType) return false;
    if (search && !v.headline.toLowerCase().includes(search.toLowerCase()) && !v.user.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const types = ["all", ...new Set(SAMPLE_VIDEOS.map(v => v.type))];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Total Videos (DB)" value="14,918" sub="In video list" color="#00D2FF" />
        <KpiCard label="Unknown Teams" value="High" sub="Many missing team names" color="#FF6B6B" badge="DQ Issue" />
        <KpiCard label="Missing Platforms" value="~95%" sub="Published videos w/o platform" color="#FFD93D" badge="DQ" />
        <KpiCard label="Auto-Upload" value="176" sub="Videos from automation" color="#7B61FF" />
      </div>

      {/* Data Quality Alert */}
      <div style={{
        background: "rgba(255,211,61,0.06)", border: "1px solid rgba(255,211,61,0.2)",
        borderRadius: 10, padding: "12px 18px", marginBottom: 20,
        display: "flex", gap: 10, alignItems: "flex-start"
      }}>
        <span>🔍</span>
        <div style={{ fontSize: 12, color: "#ffd93d" }}>
          <strong>Data Quality Observations:</strong> Many videos have "Unknown" team names. Published platform/URL fields are often blank. 12 videos have unclassified input types. Auto-upload creates 176 "Full Package" entries with no further processing.
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by headline or user..."
          style={{ flex: 1, minWidth: 200, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 14px", color: "#ccc", fontSize: 12, outline: "none" }}
        />
        <select value={filterPublished} onChange={e => setFilterPublished(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#ccc", fontSize: 12, outline: "none" }}>
          <option value="all">All Published</option>
          <option value="yes">Published Only</option>
          <option value="no">Unpublished Only</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#ccc", fontSize: 12, outline: "none" }}>
          {types.map(t => <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>)}
        </select>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              {["Video ID", "Headline", "Type", "Uploaded By", "Team", "Published", "Platform"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: "#555", fontWeight: 600, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em" }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (
              <tr key={v.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "10px 14px", color: "#555", fontFamily: "'DM Mono', monospace", fontSize: 10 }}>{v.id}</td>
                <td style={{ padding: "10px 14px", color: "#ccc", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.headline}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(123,97,255,0.15)", color: "#C5A8FF" }}>{v.type}</span>
                </td>
                <td style={{ padding: "10px 14px", color: "#aaa" }}>{v.user}</td>
                <td style={{ padding: "10px 14px", color: v.team === "Unknown" ? "#FF6B6B" : "#aaa" }}>{v.team}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: v.published === "Yes" ? "rgba(107,203,119,0.15)" : "rgba(255,255,255,0.05)", color: v.published === "Yes" ? "#6BCB77" : "#555" }}>{v.published}</span>
                </td>
                <td style={{ padding: "10px 14px", color: v.platform ? "#00D2FF" : "#333" }}>{v.platform || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "#444", display: "flex", justifyContent: "space-between" }}>
          <span>Showing {filtered.length} of {SAMPLE_VIDEOS.length} sample records (full dataset: 14,918 videos)</span>
          <span style={{ color: "#555" }}>Export CSV ↓</span>
        </div>
      </div>
    </div>
  );
}

function NLQInterface() {
  const liveData = useData();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your Frammer AI analytics assistant powered by Groq. Ask me anything about your video data — channels, users, publish rates, trends, or data quality." }
  ]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const QUICK_QUERIES = [
    "Which channels have the biggest publish gaps?",
    "What output type has the best publish rate?",
    "Top users by published videos",
    "How does English vs Hindi compare?",
    "What data quality issues exist?",
  ];

  const handleSubmit = async (q) => {
    const question = q || query;
    if (!question.trim() || loading) return;
    const newMessages = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setLoading(true);
    setQuery("");
    try {
      const conversationHistory = newMessages.map(m => ({ role: m.role, content: m.content }));
      let content;
      if (process.env.REACT_APP_GROQ_API_KEY) {
        const systemPrompt = buildSystemPrompt(liveData);
        content = await queryNLQ(conversationHistory, systemPrompt);
      } else {
        content = queryNLQLocal(question);
      }
      setMessages(h => [...h, { role: "assistant", content }]);
    } catch (e) {
      setMessages(h => [...h, { role: "assistant", content: `Error: ${e.message}` }]);
    }
    setLoading(false);
  };

  const clearChat = () => setMessages([
    { role: "assistant", content: "Chat cleared. What would you like to know about your data?" }
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: 520 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#fff", marginBottom: 2 }}>Ask the Data</div>
          <div style={{ fontSize: 12, color: "#555" }}>
            {process.env.REACT_APP_GROQ_API_KEY
              ? <span style={{ color: "#6BCB77" }}>● Groq AI · llama-3.3-70b-versatile</span>
              : <span style={{ color: "#FFD93D" }}>● Local mode — add REACT_APP_GROQ_API_KEY to .env</span>}
          </div>
        </div>
        <button onClick={clearChat} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#555", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>Clear chat</button>
      </div>

      {/* Quick query chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {QUICK_QUERIES.map(q => (
          <button key={q} onClick={() => handleSubmit(q)} disabled={loading} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: loading ? "default" : "pointer",
            background: "rgba(0,210,255,0.07)", color: loading ? "#444" : "#00D2FF",
            border: "1px solid rgba(0,210,255,0.15)", fontFamily: "'DM Mono', monospace",
            transition: "all 0.2s"
          }}>{q}</button>
        ))}
      </div>

      {/* Chat window */}
      <div style={{ flex: 1, overflowY: "auto", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: 10, alignItems: "flex-start" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
              background: msg.role === "user" ? "rgba(123,97,255,0.35)" : "rgba(0,210,255,0.25)",
              color: msg.role === "user" ? "#a78bfa" : "#00D2FF"
            }}>
              {msg.role === "user" ? "U" : "AI"}
            </div>
            <div style={{
              maxWidth: "76%", padding: "10px 16px",
              borderRadius: msg.role === "user" ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
              background: msg.role === "user" ? "rgba(123,97,255,0.12)" : "rgba(0,210,255,0.05)",
              border: `1px solid ${msg.role === "user" ? "rgba(123,97,255,0.2)" : "rgba(0,210,255,0.1)"}`,
              fontSize: 13, color: msg.role === "user" ? "#c4b5fd" : "#b8cdd0", lineHeight: 1.7,
              whiteSpace: "pre-wrap"
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(0,210,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#00D2FF", flexShrink: 0 }}>AI</div>
            <div style={{ padding: "10px 16px", borderRadius: "2px 12px 12px 12px", background: "rgba(0,210,255,0.05)", border: "1px solid rgba(0,210,255,0.1)", color: "#555", fontSize: 13, display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ animation: "pulse 1s ease-in-out infinite" }}>●</span>
              <span style={{ animation: "pulse 1s ease-in-out 0.3s infinite" }}>●</span>
              <span style={{ animation: "pulse 1s ease-in-out 0.6s infinite" }}>●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          placeholder="Ask anything about your video analytics..."
          disabled={loading}
          style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 13, outline: "none", opacity: loading ? 0.6 : 1 }}
        />
        <button onClick={() => handleSubmit()} disabled={loading || !query.trim()} style={{
          padding: "12px 24px", borderRadius: 10,
          background: query.trim() && !loading ? "#00D2FF" : "rgba(0,210,255,0.15)",
          color: query.trim() && !loading ? "#000" : "#444",
          border: "none", fontWeight: 700, cursor: query.trim() && !loading ? "pointer" : "default",
          fontSize: 13, transition: "all 0.2s", fontFamily: "'Syne', sans-serif"
        }}>Send →</button>
      </div>
      <div style={{ fontSize: 11, color: "#2a2a3a", marginTop: 6 }}>Grounded in your dataset · Mar 2025 – Feb 2026 · Client 1</div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "exec", label: "Executive Summary", icon: "◈" },
  { id: "trends", label: "Usage & Trends", icon: "◉" },
  { id: "channels", label: "Channel Analysis", icon: "◎" },
  { id: "types", label: "Type Mix & Funnel", icon: "◑" },
  { id: "explorer", label: "Video Explorer", icon: "◐" },
  { id: "nlq", label: "Ask the Data", icon: "✦" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("exec");
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("client_1");

  useEffect(() => {
    fetch("http://localhost:8000/api/clients")
      .then(r => r.json())
      .then(data => {
        if (data.clients && data.clients.length > 0) {
          setClients(data.clients);
          // keep clientId if it exists, otherwise default to first
          setClientId(prev => data.clients.includes(prev) ? prev : data.clients[0]);
        }
      })
      .catch(() => setClients(["client_1"]));
  }, []);

  const renderPage = () => {
    switch (activeTab) {
      case "exec": return <ExecSummary />;
      case "trends": return <UsageTrends />;
      case "channels": return <ChannelAnalysis />;
      case "types": return <TypeMixFunnel />;
      case "explorer": return <VideoExplorer />;
      case "nlq": return <NLQInterface />;
      default: return <ExecSummary />;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a12; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        select option { background: #1a1a2e; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
      <div style={{ background: "#0a0a12", minHeight: "100vh", fontFamily: "'DM Mono', monospace", color: "#fff" }}>
        {/* Header */}
        <div style={{
          background: "rgba(10,10,18,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 28px", position: "sticky", top: 0, zIndex: 100,
          backdropFilter: "blur(20px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #00D2FF, #7B61FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif" }}>F</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Syne', sans-serif", letterSpacing: "0.04em" }}>FRAMMER AI</div>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.12em" }}>ANALYTICS · {clientId.toUpperCase().replace("_", " ")}</div>
              </div>
            </div>
            <nav style={{ display: "flex", gap: 2 }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 11, cursor: "pointer",
                  background: activeTab === tab.id ? "rgba(0,210,255,0.12)" : "transparent",
                  color: activeTab === tab.id ? "#00D2FF" : "#555",
                  border: "1px solid",
                  borderColor: activeTab === tab.id ? "rgba(0,210,255,0.25)" : "transparent",
                  transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5,
                  fontFamily: "'DM Mono', monospace"
                }}>
                  <span style={{ fontSize: 13 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {clients.length > 1 && (
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6, color: "#aaa", fontSize: 10, padding: "4px 8px",
                    fontFamily: "'DM Mono', monospace", cursor: "pointer"
                  }}
                >
                  {clients.map(c => (
                    <option key={c} value={c}>{c.replace("_", " ").toUpperCase()}</option>
                  ))}
                </select>
              )}
              <div style={{ fontSize: 10, color: "#333" }}>v1.0 · Beta</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "28px 28px 40px" }}>
          <DataProvider clientId={clientId}>
            {renderPage()}
          </DataProvider>
        </div>
      </div>
    </>
  );
}
