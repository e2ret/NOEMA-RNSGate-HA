/**
 * NOEMA RNSGate Card — v2.0
 * Configurable blocks with visual editor.
 */

const NRG_SERVICES = [
  { key: "rnsd",              label: "rnsd" },
  { key: "noema_lxmf_bridge", label: "LXMF Bridge" },
  { key: "i2pd",              label: "i2pd" },
  { key: "nomadnet",          label: "Nomadnet" },
  { key: "rbrowser",          label: "rBrowser" },
];

const NRG_METRICS = [
  { key: "cpu_usage",        label: "CPU",  unit: "%",  icon: "💻" },
  { key: "ram_usage",        label: "RAM",  unit: "%",  icon: "🧠" },
  { key: "disk_usage",       label: "DISK", unit: "%",  icon: "💾" },
  { key: "cpu_temperature",  label: "TEMP", unit: "°C", icon: "🌡️" },
];

const NRG_DEFAULT = {
  title: "NOEMA RNSGate",
  prefix: "noema_rnsgate_noema",
  show_header: true,
  show_metrics: true,
  show_mqtt: true,
  show_lxmf: true,
  show_rnode: true,
  show_services: true,
  show_buttons: true,
  show_footer: true,
  show_addresses: false,
  metrics: ["cpu_usage","ram_usage","disk_usage","cpu_temperature"],
  services: ["rnsd","noema_lxmf_bridge","i2pd","nomadnet","rbrowser"],
  buttons: ["rnsd","noema_lxmf_bridge","i2pd","nomadnet","rbrowser"],
};

class NoemaRnsgateCard extends HTMLElement {
  static getConfigElement() { return document.createElement("noema-rnsgate-card-editor"); }
  static getStubConfig()    { return NRG_DEFAULT; }

  setConfig(config) {
    this._config = { ...NRG_DEFAULT, ...config };
    if (!this._built) { this._build(); this._built = true; }
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
    // Fetch history periodically
    if (!this._histTimer) {
      this._fetchHistory();
      this._histTimer = setInterval(() => this._fetchHistory(), 60000);
    }
  }

  _e(key) {
    if (!this._hass || !this._config.prefix) return null;
    const s = this._hass.states[`sensor.${this._config.prefix}_${key}`];
    return s ? s.state : null;
  }

  _b(key) {
    if (!this._hass || !this._config.prefix) return null;
    const s = this._hass.states[`binary_sensor.${this._config.prefix}_${key}`];
    return s ? s.state === "on" : null;
  }

  _color(pct, warn=70, crit=90) {
    return pct >= crit ? "#ef4444" : pct >= warn ? "#f59e0b" : "#10b981";
  }

  _build() {
    this.innerHTML = `
<ha-card>
<style>
  :host { display: block; }
  ha-card { padding: 16px; font-family: var(--primary-font-family, sans-serif); }
  .nrg-title { text-align:center; font-size:1.1em; font-weight:700; color:var(--primary-color); margin-bottom:6px; }
  .nrg-info  { display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
  .nrg-badge { background:var(--secondary-background-color); border-radius:20px; padding:3px 10px; font-size:.75em; display:flex; gap:5px; }
  .nrg-badge b { color:var(--primary-text-color); }
  .nrg-metrics { display:grid; gap:8px; margin-bottom:10px; }
  .nrg-metric { background:var(--secondary-background-color); border-radius:12px; padding:10px 14px; text-align:center; }
  .nrg-metric-val { font-size:1.4em; font-weight:700; }
  .nrg-metric-bar { height:3px; border-radius:2px; background:var(--divider-color); margin:4px 0 2px; }
  .nrg-metric-fill { height:100%; border-radius:2px; transition:width .4s; }
  .nrg-metric-lbl { font-size:.7em; color:var(--secondary-text-color); }
  .nrg-metric { position:relative; overflow:hidden; }
  .nrg-metric svg { position:absolute; bottom:0; left:0; width:100%; height:50%; opacity:0.25; pointer-events:none; }
  .nrg-mqtt { display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--secondary-background-color); border-radius:10px; margin-bottom:10px; font-size:.85em; }
  .nrg-dot  { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
  .nrg-block { background:var(--secondary-background-color); border-radius:12px; padding:12px 14px; margin-bottom:10px; }
  .nrg-block-title { font-size:.7em; color:var(--secondary-text-color); letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px; }
  .nrg-addr { font-family:monospace; font-size:.78em; color:var(--primary-color); word-break:break-all; margin-bottom:6px; }
  .nrg-addr-copy { cursor:pointer; user-select:none; transition:opacity .15s; }
  .nrg-addr-copy:hover { opacity:.7; }
  .nrg-addr-copy:active { opacity:.4; }
  .nrg-stats { display:flex; gap:12px; flex-wrap:wrap; font-size:.8em; color:var(--secondary-text-color); }
  .nrg-stats b { color:var(--primary-text-color); }
  .nrg-svcs { display:grid; gap:8px; margin-bottom:10px; }
  .nrg-svc  { background:var(--secondary-background-color); border-radius:10px; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; }
  .nrg-svc-name { font-size:.8em; font-weight:600; }
  .nrg-svc-pill { font-size:.7em; font-weight:700; padding:2px 9px; border-radius:20px; }
  .nrg-svc-pill.on  { background:#10b98122; color:#10b981; }
  .nrg-svc-pill.off { background:#ef444422; color:#ef4444; }
  .nrg-svc-pill.na  { background:var(--divider-color); color:var(--secondary-text-color); }
  .nrg-btns { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
  .nrg-btn  { flex:1; min-width:80px; padding:6px 4px; border:1px solid var(--divider-color); border-radius:8px; background:var(--secondary-background-color); color:var(--primary-text-color); font-size:.75em; cursor:pointer; }
  .nrg-btn.danger { border-color:#ef4444; color:#ef4444; }
  .nrg-footer { font-size:.72em; color:var(--secondary-text-color); text-align:center; padding-top:4px; }
  .nrg-update { color:#f59e0b; margin-left:8px; }
</style>
<div id="nrg-header" class="nrg-title"></div>
<div id="nrg-info" class="nrg-info"></div>
<div id="nrg-metrics" class="nrg-metrics"></div>
<div id="nrg-mqtt" class="nrg-mqtt" style="display:none">
  <div class="nrg-dot" id="nrg-mqtt-dot"></div>
  <span id="nrg-mqtt-txt">MQTT Broker</span>
</div>
<div id="nrg-lxmf" class="nrg-block" style="display:none">
  <div class="nrg-block-title">LXMF Bridge</div>
  <div class="nrg-addr nrg-addr-copy" id="nrg-lxmf-addr" title="Click to copy">—</div>
  <div class="nrg-stats">
    <span>Sent <b id="nrg-lxmf-sent">0</b></span>
    <span>Received <b id="nrg-lxmf-recv">0</b></span>
    <span>Total <b id="nrg-lxmf-total">0</b></span>
  </div>
</div>
<div id="nrg-rnode" class="nrg-block" style="display:none">
  <div class="nrg-block-title">RNode · <span id="nrg-rnode-iface" style="opacity:.7">—</span></div>
  <div class="nrg-stats">
    <span>RSSI <b id="nrg-rnode-rssi">—</b> dBm</span>
    <span>SNR <b id="nrg-rnode-snr">—</b> dB</span>
    <span>Nodes <b id="nrg-nodes-total">—</b></span>
  </div>
</div>
<div id="nrg-addresses" class="nrg-block" style="display:none">
  <div class="nrg-block-title">Addresses</div>
  <div style="font-size:.72em;color:var(--secondary-text-color);margin-bottom:2px">I2P (b32)</div>
  <div class="nrg-addr nrg-addr-copy" id="nrg-i2p-addr" title="Click to copy">—</div>
  <div style="font-size:.72em;color:var(--secondary-text-color);margin-bottom:2px">Nomadnet node</div>
  <div class="nrg-addr nrg-addr-copy" id="nrg-nn-addr" title="Click to copy">—</div>
</div>
<div id="nrg-svcs" class="nrg-svcs"></div>
<div id="nrg-btns" class="nrg-btns"></div>
<div id="nrg-footer" class="nrg-footer"></div>
</ha-card>`;

    this.addEventListener("click", e => {
      const el = e.target.closest(".nrg-addr-copy");
      if (!el || el.textContent === "—") return;
      navigator.clipboard.writeText(el.textContent).then(() => {
        const orig = el.textContent;
        el.textContent = "✓ Copied!";
        setTimeout(() => el.textContent = orig, 1500);
      });
    });

    this.querySelector("#nrg-btns").addEventListener("click", e => {
      const btn = e.target.closest("[data-svc]");
      if (!btn || !this._hass) return;
      const svc = btn.dataset.svc;
      const label = svc === "all" ? "ALL services" : svc;
      if (!confirm(`Restart ${label}?`)) return;
      const eid = svc === "all"
        ? `button.${this._config.prefix}_restart_all`
        : `button.${this._config.prefix}_restart_${svc}`;
      this._hass.callService("button", "press", { entity_id: eid });
    });
  }

  _sparkline(values, color) {
    const w = 100, h = 40;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h * 0.9;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  async _fetchHistory() {
    if (!this._hass || !this._config.prefix) return;
    const end = new Date();
    const start = new Date(end - 3 * 60 * 60 * 1000); // 3 hours
    const keys = this._config.metrics || [];
    const entityIds = keys.map(k => `sensor.${this._config.prefix}_${k}`).join(",");
    try {
      const resp = await this._hass.callApi("GET",
        `history/period/${start.toISOString()}?filter_entity_id=${entityIds}&end_time=${end.toISOString()}&minimal_response=true&no_attributes=true`
      );
      this._history = {};
      if (Array.isArray(resp)) {
        resp.forEach(entityHistory => {
          if (!entityHistory.length) return;
          const eid = entityHistory[0].entity_id;
          const key = keys.find(k => eid.endsWith("_" + k));
          if (!key) return;
          this._history[key] = entityHistory
            .map(s => parseFloat(s.state))
            .filter(v => !isNaN(v));
        });
      }
      this._update();
    } catch(e) { /* silent */ }
  }

  _update() {
    if (!this._built || !this._config) return;
    const cfg = this._config;

    // Header
    const hdr = this.querySelector("#nrg-header");
    if (hdr) {
      hdr.style.display = cfg.show_header ? "" : "none";
      hdr.textContent = cfg.title || "NOEMA RNSGate";
    }

    // Info badges
    const info = this.querySelector("#nrg-info");
    if (info) {
      info.style.display = cfg.show_header ? "" : "none";
      info.innerHTML = `
        <div class="nrg-badge"><span>UPTIME</span><b>${this._e("uptime") || "—"}</b></div>
        <div class="nrg-badge"><span>RNS</span><b>${this._e("rns_version") || "—"}</b></div>
        <div class="nrg-badge"><span>IP</span><b>${this._e("ip_address") || "—"}</b></div>
      `;
    }

    // Metrics
    const metricsEl = this.querySelector("#nrg-metrics");
    if (metricsEl) {
      metricsEl.style.display = cfg.show_metrics ? "" : "none";
      if (cfg.show_metrics) {
        const cols = Math.min(cfg.metrics.length, 4);
        metricsEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        metricsEl.innerHTML = (cfg.metrics || []).map(mkey => {
          const m = NRG_METRICS.find(x => x.key === mkey);
          if (!m) return "";
          const raw = parseFloat(this._e(m.key));
          const val = isNaN(raw) ? "—" : (m.unit === "°C" ? Math.round(raw) : raw);
          const pct = isNaN(raw) ? 0 : (m.unit === "°C" ? Math.min(raw/120*100,100) : raw);
          const col = this._color(pct);
          const hist = this._history ? (this._history[m.key] || []) : [];
          const sparkSvg = hist.length > 1 ? this._sparkline(hist, col) : "";
          return `<div class="nrg-metric">
            ${sparkSvg}
            <div class="nrg-metric-val" style="color:${col};position:relative;z-index:1">${val}${isNaN(raw)?"":(m.unit)}</div>
            <div class="nrg-metric-bar" style="position:relative;z-index:1"><div class="nrg-metric-fill" style="width:${pct}%;background:${col}"></div></div>
            <div class="nrg-metric-lbl" style="position:relative;z-index:1">${m.label}</div>
          </div>`;
        }).join("");
      }
    }

    // MQTT
    const mqttEl = this.querySelector("#nrg-mqtt");
    if (mqttEl) {
      mqttEl.style.display = cfg.show_mqtt ? "flex" : "none";
      if (cfg.show_mqtt) {
        const on = this._b("mqtt_broker");
        const dot = this.querySelector("#nrg-mqtt-dot");
        const txt = this.querySelector("#nrg-mqtt-txt");
        if (dot) dot.style.background = on === null ? "var(--divider-color)" : on ? "#10b981" : "#ef4444";
        if (txt) txt.textContent = `MQTT Broker — ${on === null ? "—" : on ? "OK" : "Offline"}`;
      }
    }

    // LXMF
    const lxmfEl = this.querySelector("#nrg-lxmf");
    if (lxmfEl) {
      lxmfEl.style.display = cfg.show_lxmf ? "" : "none";
      if (cfg.show_lxmf) {
        const a = this.querySelector("#nrg-lxmf-addr");
        if (a) a.textContent = this._e("lxmf_bridge_address") || "—";
        const s = this.querySelector("#nrg-lxmf-sent");
        const r = this.querySelector("#nrg-lxmf-recv");
        const t = this.querySelector("#nrg-lxmf-total");
        if (s) s.textContent = this._e("lxmf_sent") || "0";
        if (r) r.textContent = this._e("lxmf_received") || "0";
        if (t) t.textContent = this._e("lxmf_total") || "0";
      }
    }

    // RNode
    const rnodeEl = this.querySelector("#nrg-rnode");
    if (rnodeEl) {
      rnodeEl.style.display = cfg.show_rnode ? "" : "none";
      if (cfg.show_rnode) {
        const ri = this.querySelector("#nrg-rnode-iface");
        const rr = this.querySelector("#nrg-rnode-rssi");
        const rs = this.querySelector("#nrg-rnode-snr");
        const nt = this.querySelector("#nrg-nodes-total");
        if (ri) ri.textContent = this._e("rnode_interface") || "—";
        if (rr) rr.textContent = this._e("rnode_rssi") ?? "—";
        if (rs) rs.textContent = this._e("rnode_snr") ?? "—";
        if (nt) nt.textContent = this._e("nodes_total") ?? "—";
      }
    }

    // Addresses
    const addrEl = this.querySelector("#nrg-addresses");
    if (addrEl) {
      addrEl.style.display = cfg.show_addresses ? "" : "none";
      if (cfg.show_addresses) {
        const i2pEl = this.querySelector("#nrg-i2p-addr");
        const nnEl  = this.querySelector("#nrg-nn-addr");
        if (i2pEl) i2pEl.textContent = this._e("i2p_address_b32") || "—";
        if (nnEl)  nnEl.textContent  = this._e("nomadnet_node_address") || "—";
      }
    }

    // Services
    const svcsEl = this.querySelector("#nrg-svcs");
    if (svcsEl) {
      svcsEl.style.display = cfg.show_services && cfg.services?.length ? "" : "none";
      if (cfg.show_services) {
        const cols = Math.min(cfg.services.length, 2);
        svcsEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        svcsEl.innerHTML = (cfg.services || []).map(key => {
          const svc = NRG_SERVICES.find(s => s.key === key);
          if (!svc) return "";
          const on = this._b(key);
          const cls = on === null ? "na" : on ? "on" : "off";
          const lbl = on === null ? "—" : on ? "Running" : "Stopped";
          return `<div class="nrg-svc">
            <span class="nrg-svc-name">${svc.label}</span>
            <span class="nrg-svc-pill ${cls}">${lbl}</span>
          </div>`;
        }).join("");
      }
    }

    // Buttons
    const btnsEl = this.querySelector("#nrg-btns");
    if (btnsEl) {
      btnsEl.style.display = cfg.show_buttons && cfg.buttons?.length ? "" : "none";
      if (cfg.show_buttons) {
        btnsEl.innerHTML = (cfg.buttons || []).map(key => {
          const svc = NRG_SERVICES.find(s => s.key === key);
          return `<button class="nrg-btn" data-svc="${key}">↺ ${svc ? svc.label : key}</button>`;
        }).join("") + `<button class="nrg-btn danger" data-svc="all" style="flex-basis:100%">↺ ALL</button>`;
      }
    }

    // Footer
    const footerEl = this.querySelector("#nrg-footer");
    if (footerEl) {
      footerEl.style.display = cfg.show_footer ? "" : "none";
      if (cfg.show_footer) {
        footerEl.innerHTML = `RNS ${this._e("rns_version") || "—"}`;
      }
    }
  }
}

// ── Visual Editor ──────────────────────────────────────────────────────────────
class NoemaRnsgateCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...NRG_DEFAULT, ...config }; this._build(); }

  _fire(cfg) {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
  }

  _chk(key, val) {
    this._config = { ...this._config, [key]: val };
    this._fire(this._config);
    this._build();
  }

  _build() {
    const cfg = this._config;
    const tog = (key, label) => `
      <label style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--divider-color)">
        <span>${label}</span>
        <input type="checkbox" ${cfg[key] ? "checked" : ""} data-key="${key}" data-type="bool" style="width:18px;height:18px;cursor:pointer">
      </label>`;

    const multicheck = (listKey, items) => items.map(it => `
      <label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:.85em">
        <input type="checkbox" ${(cfg[listKey]||[]).includes(it.key) ? "checked" : ""} data-list="${listKey}" data-val="${it.key}" style="width:15px;height:15px;cursor:pointer">
        ${it.label || it.key}
      </label>`).join("");

    this.innerHTML = `
<style>
  .nrg-ed { padding:12px; font-family:var(--primary-font-family,sans-serif); font-size:.9em; }
  .nrg-ed input[type=text] { width:100%; box-sizing:border-box; padding:6px 8px; border:1px solid var(--divider-color); border-radius:8px; background:var(--secondary-background-color); color:var(--primary-text-color); margin-top:4px; }
  .nrg-ed-sec { font-weight:700; font-size:.8em; letter-spacing:.06em; text-transform:uppercase; color:var(--secondary-text-color); margin:14px 0 6px; }
  .nrg-ed-sub { padding:0 8px; }
</style>
<div class="nrg-ed">
  <div class="nrg-ed-sec">General</div>
  <label>Title<input type="text" data-key="title" value="${cfg.title||""}"></label>
  <label style="display:block;margin-top:8px">Entity prefix<input type="text" data-key="prefix" value="${cfg.prefix||""}"></label>

  <div class="nrg-ed-sec">Blocks</div>
  ${tog("show_header","Header (title + badges)")}
  ${tog("show_metrics","Metrics (CPU/RAM/DISK/TEMP)")}
  ${tog("show_mqtt","MQTT status")}
  ${tog("show_lxmf","LXMF Bridge")}
  ${tog("show_rnode","RNode (RF + nodes)")}
  ${tog("show_addresses","Addresses (I2P + Nomadnet)")}
  ${tog("show_services","Services status")}
  ${tog("show_buttons","Restart buttons")}
  ${tog("show_footer","Footer (RNS version)")}

  <div class="nrg-ed-sec">Metrics to show</div>
  <div class="nrg-ed-sub">${multicheck("metrics", NRG_METRICS)}</div>

  <div class="nrg-ed-sec">Services to show</div>
  <div class="nrg-ed-sub">${multicheck("services", NRG_SERVICES)}</div>

  <div class="nrg-ed-sec">Restart buttons</div>
  <div class="nrg-ed-sub">${multicheck("buttons", NRG_SERVICES)}</div>
</div>`;

    this.querySelectorAll("input[data-key]").forEach(el => {
      el.addEventListener("change", () => {
        const key = el.dataset.key;
        const val = el.dataset.type === "bool" ? el.checked : el.value;
        this._chk(key, val);
      });
    });

    this.querySelectorAll("input[data-list]").forEach(el => {
      el.addEventListener("change", () => {
        const listKey = el.dataset.list;
        const val = el.dataset.val;
        let arr = [...(this._config[listKey] || [])];
        if (el.checked) { if (!arr.includes(val)) arr.push(val); }
        else { arr = arr.filter(x => x !== val); }
        this._chk(listKey, arr);
      });
    });
  }
}

customElements.define("noema-rnsgate-card", NoemaRnsgateCard);
customElements.define("noema-rnsgate-card-editor", NoemaRnsgateCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "noema-rnsgate-card",
  name: "NOEMA RNSGate Card",
  description: "Configurable card for NOEMA RNSGate gateway",
});
