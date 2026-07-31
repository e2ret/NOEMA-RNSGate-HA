/* ============================================================
 * NOEMA RNSGate Card — v1.0.0
 * Standalone Lovelace card for NOEMA RNSGate Lite integration.
 * No dependencies. Auto-discovers entities by integration prefix.
 * ============================================================ 
 */

const NRG_VERSION = "1.0.0";

console.info(
  `%c NOEMA-RNSGATE-CARD %c v${NRG_VERSION} `,
  "color: white; background: #14b8a6; font-weight: 700;",
  "color: #14b8a6; background: white; font-weight: 700;"
);

const NRG_SERVICES = [
  { key: "rnsd",             label: "rnsd" },
  { key: "lxmf_bridge_mqtt", label: "LXMF Bridge" },
  { key: "i2pd",             label: "i2pd" },
  { key: "nomadnet",         label: "Nomadnet" },
  { key: "rbrowser",         label: "rBrowser" },
];

class NoemaRnsgateCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("noema-rnsgate-card-editor");
  }

  static getStubConfig() {
    return { title: "NOEMA RNSGate Lite", prefix: "noema_rnsgate_noema" };
  }

  setConfig(config) {
    this._config = {
      title: "NOEMA RNSGate Lite",
      prefix: "noema_rnsgate_noema",
      ...config,
    };
    this._built = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    this._update();
  }

  _e(key) {
    const id = `sensor.${this._config.prefix}_${key}`;
    const st = this._hass.states[id];
    if (!st || st.state === "unavailable" || st.state === "unknown") return null;
    return st.state;
  }

  _b(key) {
    const id = `binary_sensor.${this._config.prefix}_${key}`;
    const st = this._hass.states[id];
    if (!st || st.state === "unavailable" || st.state === "unknown") return null;
    return st.state === "on";
  }

  _callButton(key) {
    const id = `button.${this._config.prefix}_restart_${key}`;
    this._hass.callService("button", "press", { entity_id: id });
  }

  _build() {
    this._built = true;
    const c = this._config;

    this.innerHTML = `
      <ha-card>
        <style>
          ha-card {
            background: transparent;
            border: none;
            box-shadow: none;
            font-family: Impact, 'Arial Narrow Bold', sans-serif;
          }
          .nrg-wrap {
            padding: 14px 16px;
            color: var(--primary-text-color, #fff);
          }
          .nrg-title {
            text-align: center;
            font-size: 22px;
            letter-spacing: 1px;
            color: var(--primary-color, #14b8a6);
            margin-bottom: 10px;
          }

          /* Info pills */
          .nrg-pills {
            display: flex;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 12px;
          }
          .nrg-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 20px;
            padding: 4px 12px;
            font-size: 13px;
            font-family: sans-serif;
          }
          .nrg-pill-label {
            opacity: .6;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .5px;
          }
          .nrg-pill-val {
            font-weight: 600;
          }

          /* Gauges */
          .nrg-gauges {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 12px;
          }
          @media (max-width: 360px) {
            .nrg-gauges { grid-template-columns: repeat(2, 1fr); }
          }
          .nrg-gauge {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 12px;
            padding: 10px 6px 8px;
            text-align: center;
          }
          .nrg-gauge-val {
            font-size: 22px;
            line-height: 1;
            margin-bottom: 2px;
          }
          .nrg-gauge-bar {
            height: 4px;
            border-radius: 2px;
            background: rgba(255,255,255,0.10);
            margin: 4px 4px 4px;
            overflow: hidden;
          }
          .nrg-gauge-fill {
            height: 100%;
            border-radius: 2px;
            transition: width .6s ease, background .6s ease;
          }
          .nrg-gauge-name {
            font-size: 11px;
            font-family: sans-serif;
            opacity: .6;
            letter-spacing: .5px;
            text-transform: uppercase;
          }

          /* LXMF section */
          .nrg-lxmf {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 12px;
            padding: 10px 14px;
            margin-bottom: 10px;
          }
          .nrg-lxmf-title {
            font-size: 12px;
            font-family: sans-serif;
            text-transform: uppercase;
            letter-spacing: .7px;
            opacity: .5;
            margin-bottom: 6px;
          }
          .nrg-lxmf-addr {
            font-family: monospace;
            font-size: 12px;
            color: #14b8a6;
            word-break: break-all;
            margin-bottom: 6px;
          }
          .nrg-lxmf-stats {
            display: flex;
            gap: 16px;
          }
          .nrg-lxmf-stat {
            font-size: 13px;
            font-family: sans-serif;
          }
          .nrg-lxmf-stat span {
            opacity: .5;
            font-size: 11px;
          }

          /* Services grid */
          .nrg-services {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 10px;
          }
          .nrg-svc:last-child:nth-child(odd) {
            grid-column: 1 / -1;
          }
          .nrg-svc {
            border-radius: 10px;
            overflow: hidden;
            cursor: pointer;
          }
          .nrg-svc-name {
            font-size: 13px;
            text-align: center;
            padding: 4px 8px 2px;
            opacity: .8;
            color: var(--primary-color, #14b8a6);
          }
          .nrg-svc-status {
            font-size: 18px;
            text-align: center;
            padding: 6px 8px;
            color: white;
            font-weight: 700;
            transition: background .4s ease;
          }
          .nrg-svc-status.on  { background: #0A6847; }
          .nrg-svc-status.off { background: #e0483e; animation: nrg-blink 2s ease infinite; }
          .nrg-svc-status.na  { background: #444; }
          @keyframes nrg-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }

          /* MQTT pill */
          .nrg-mqtt {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 10px;
            padding: 8px 14px;
            margin-bottom: 10px;
            font-family: sans-serif;
            font-size: 13px;
          }
          .nrg-mqtt-dot {
            width: 10px; height: 10px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
          }
          .nrg-mqtt-dot.on  { background: #4fc95b; box-shadow: 0 0 6px #4fc95b; }
          .nrg-mqtt-dot.off { background: #e0483e; }

          /* Buttons */
          .nrg-btns {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            justify-content: center;
          }
          .nrg-btn {
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 8px;
            color: var(--primary-text-color, #fff);
            font-family: Impact, sans-serif;
            font-size: 13px;
            padding: 6px 12px;
            cursor: pointer;
            letter-spacing: .5px;
            text-transform: uppercase;
            transition: background .2s;
          }
          .nrg-btn:hover { background: rgba(255,255,255,0.14); }
          .nrg-btn:active { background: rgba(20,184,166,0.3); }
          .nrg-btn.danger { border-color: rgba(224,72,62,0.4); color: #e0483e; }
          .nrg-btn.primary { border-color: rgba(20,184,166,0.4); color: #14b8a6; }

          /* RNS version */
          .nrg-rns {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: sans-serif;
            font-size: 12px;
            opacity: .5;
            padding: 6px 2px 0;
          }
          .nrg-update {
            color: #f0a92e;
            opacity: 1;
            font-weight: 600;
          }
        </style>
        <div class="nrg-wrap">
          <div class="nrg-title">${c.title}</div>

          <!-- Pills: uptime, version, IP -->
          <div class="nrg-pills">
            <div class="nrg-pill">
              <span class="nrg-pill-label">Uptime</span>
              <span class="nrg-pill-val" id="nrg-uptime">—</span>
            </div>
            <div class="nrg-pill">
              <span class="nrg-pill-label">RNS</span>
              <span class="nrg-pill-val" id="nrg-rns-ver">—</span>
            </div>
            <div class="nrg-pill">
              <span class="nrg-pill-label">IP</span>
              <span class="nrg-pill-val" id="nrg-ip">—</span>
            </div>
          </div>

          <!-- Gauges: CPU, DISK, RAM, TEMP -->
          <div class="nrg-gauges">
            <div class="nrg-gauge">
              <div class="nrg-gauge-val" id="nrg-cpu-val">—</div>
              <div class="nrg-gauge-bar"><div class="nrg-gauge-fill" id="nrg-cpu-bar"></div></div>
              <div class="nrg-gauge-name">CPU</div>
            </div>
            <div class="nrg-gauge">
              <div class="nrg-gauge-val" id="nrg-disk-val">—</div>
              <div class="nrg-gauge-bar"><div class="nrg-gauge-fill" id="nrg-disk-bar"></div></div>
              <div class="nrg-gauge-name">DISK</div>
            </div>
            <div class="nrg-gauge">
              <div class="nrg-gauge-val" id="nrg-ram-val">—</div>
              <div class="nrg-gauge-bar"><div class="nrg-gauge-fill" id="nrg-ram-bar"></div></div>
              <div class="nrg-gauge-name">RAM</div>
            </div>
            <div class="nrg-gauge">
              <div class="nrg-gauge-val" id="nrg-temp-val">—</div>
              <div class="nrg-gauge-bar"><div class="nrg-gauge-fill" id="nrg-temp-bar"></div></div>
              <div class="nrg-gauge-name">TEMP</div>
            </div>
          </div>

          <!-- MQTT status -->
          <div class="nrg-mqtt">
            <div>
              <span class="nrg-mqtt-dot" id="nrg-mqtt-dot"></span>
              <span id="nrg-mqtt-label">MQTT Broker</span>
            </div>
            <span id="nrg-mqtt-host" style="opacity:.5;font-size:12px"></span>
          </div>

          <!-- LXMF info -->
          <div class="nrg-lxmf">
            <div class="nrg-lxmf-title">LXMF Bridge</div>
            <div class="nrg-lxmf-addr" id="nrg-lxmf-addr">—</div>
            <div class="nrg-lxmf-stats">
              <div class="nrg-lxmf-stat"><span>Sent </span><span id="nrg-lxmf-sent">0</span></div>
              <div class="nrg-lxmf-stat"><span>Received </span><span id="nrg-lxmf-recv">0</span></div>
              <div class="nrg-lxmf-stat"><span>Total </span><span id="nrg-lxmf-total">0</span></div>
            </div>
          </div>

          <!-- Services -->
          <div class="nrg-services" id="nrg-services"></div>

          <!-- Control buttons -->
          <div class="nrg-btns">
            ${NRG_SERVICES.map(s => `
              <button class="nrg-btn" data-svc="${s.key}" title="Restart ${s.label}">↺ ${s.label}</button>
            `).join("")}
            <button class="nrg-btn danger" data-svc="all">↺ ALL</button>
          </div>

          <!-- RNS version footer -->
          <div class="nrg-rns">
            <span>RNS <span id="nrg-rns-cur">—</span> / latest <span id="nrg-rns-latest">—</span></span>
            <span class="nrg-update" id="nrg-rns-update" style="display:none">↑ Update available</span>
          </div>
        </div>
      </ha-card>
    `;

    // Build services grid
    const svcGrid = this.querySelector("#nrg-services");
    svcGrid.innerHTML = NRG_SERVICES.map(s => `
      <div class="nrg-svc" id="nrg-svc-${s.key}">
        <div class="nrg-svc-name">${s.label}</div>
        <div class="nrg-svc-status na" id="nrg-svc-st-${s.key}">—</div>
      </div>
    `).join("");

    // Button handlers
    this.querySelectorAll(".nrg-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const svc = btn.dataset.svc;
        const label = svc === "all" ? "ALL services" : svc;
        if (!confirm(`Restart ${label}?`)) return;
        if (svc === "all") {
          this._hass.callService("button", "press", {
            entity_id: `button.${this._config.prefix}_restart_all`
          });
        } else {
          this._hass.callService("button", "press", {
            entity_id: `button.${this._config.prefix}_restart_${svc}`
          });
        }
      });
    });
  }

  _color(val, max, heat = false) {
    const t = Math.min(1, Math.max(0, val / max));
    if (heat) {
      // green → yellow → red
      if (t < 0.5) return `rgb(${Math.round(t*2*240)},201,91)`;
      return `rgb(224,${Math.round((1-t)*2*180)},62)`;
    }
    // blue → green → yellow → red
    if (t < 0.6) return "#14b8a6";
    if (t < 0.8) return "#f0a92e";
    return "#e0483e";
  }

  _setGauge(valId, barId, val, unit, max, heat = false) {
    const el = this.querySelector(`#${valId}`);
    const bar = this.querySelector(`#${barId}`);
    if (!el || !bar) return;
    if (val === null) { el.textContent = "—"; bar.style.width = "0%"; return; }
    el.textContent = val + (unit || "");
    const pct = Math.min(100, Math.max(0, (val / max) * 100));
    const color = this._color(val, max, heat);
    bar.style.width = pct + "%";
    bar.style.background = color;
    el.style.color = color;
  }

  _update() {
    if (!this._hass || !this._built) return;

    // Pills
    const uptime = this.querySelector("#nrg-uptime");
    const rnsVer = this.querySelector("#nrg-rns-ver");
    const ip = this.querySelector("#nrg-ip");
    if (uptime) uptime.textContent = this._e("uptime") || "—";
    if (rnsVer) rnsVer.textContent = this._e("rns_version") || "—";
    if (ip) ip.textContent = this._e("ip_address") || "—";

    // Gauges
    const cpu = parseFloat(this._e("cpu_usage"));
    const disk = parseFloat(this._e("disk_usage"));
    const ram = parseFloat(this._e("ram_usage"));
    const temp = parseFloat(this._e("cpu_temperature"));
    this._setGauge("nrg-cpu-val", "nrg-cpu-bar", isNaN(cpu) ? null : cpu, "%", 100);
    this._setGauge("nrg-disk-val", "nrg-disk-bar", isNaN(disk) ? null : disk, "%", 100);
    this._setGauge("nrg-ram-val", "nrg-ram-bar", isNaN(ram) ? null : ram, "%", 100);
    this._setGauge("nrg-temp-val", "nrg-temp-bar", isNaN(temp) ? null : temp, "°C", 90, true);

    // MQTT
    const mqttOn = this._b("mqtt_broker");
    const mqttDot = this.querySelector("#nrg-mqtt-dot");
    const mqttLabel = this.querySelector("#nrg-mqtt-label");
    if (mqttDot) mqttDot.className = "nrg-mqtt-dot " + (mqttOn ? "on" : "off");
    if (mqttLabel) mqttLabel.textContent = "MQTT Broker — " + (mqttOn ? "OK" : "ERROR");

    // LXMF
    const addr = this.querySelector("#nrg-lxmf-addr");
    const sent = this.querySelector("#nrg-lxmf-sent");
    const recv = this.querySelector("#nrg-lxmf-recv");
    const total = this.querySelector("#nrg-lxmf-total");
    if (addr) addr.textContent = this._e("lxmf_bridge_address") || "—";
    if (sent) sent.textContent = this._e("lxmf_sent") || "0";
    if (recv) recv.textContent = this._e("lxmf_received") || "0";
    if (total) total.textContent = this._e("lxmf_total") || "0";

    // Services
    NRG_SERVICES.forEach(s => {
      const st = this.querySelector(`#nrg-svc-st-${s.key}`);
      if (!st) return;
      const on = this._b(s.key);
      if (on === null) {
        st.className = "nrg-svc-status na";
        st.textContent = "—";
      } else if (on) {
        st.className = "nrg-svc-status on";
        st.textContent = "Работает";
      } else {
        st.className = "nrg-svc-status off";
        st.textContent = "Остановлен";
      }
    });

    // RNS version
    const cur = this.querySelector("#nrg-rns-cur");
    const latest = this.querySelector("#nrg-rns-latest");
    const upd = this.querySelector("#nrg-rns-update");
    if (cur) cur.textContent = this._e("rns_version") || "—";
    if (latest) latest.textContent = this._e("rns_latest") || "—";
    const hasUpdate = this._b("rns_update_available");
    if (upd) upd.style.display = hasUpdate ? "" : "none";
  }

  getCardSize() { return 8; }
}

customElements.define("noema-rnsgate-card", NoemaRnsgateCard);

// Simple editor
class NoemaRnsgateCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; }
  set hass(hass) { this._hass = hass; }

  connectedCallback() {
    if (!this.innerHTML) {
      this.innerHTML = `
        <div style="padding:16px;font-family:sans-serif">
          <label style="display:block;margin-bottom:8px">Title<br>
            <input id="title" value="${this._config?.title || "NOEMA RNSGate Lite"}"
              style="width:100%;padding:6px;border-radius:6px;border:1px solid #ccc;margin-top:4px">
          </label>
          <label style="display:block;margin-bottom:8px">Entity prefix<br>
            <input id="prefix" value="${this._config?.prefix || "noema_rnsgate_noema"}"
              style="width:100%;padding:6px;border-radius:6px;border:1px solid #ccc;margin-top:4px">
          </label>
        </div>`;
      this.querySelectorAll("input").forEach(inp => {
        inp.addEventListener("change", () => {
          this.dispatchEvent(new CustomEvent("config-changed", {
            detail: {
              config: {
                ...this._config,
                title: this.querySelector("#title").value,
                prefix: this.querySelector("#prefix").value,
              }
            },
            bubbles: true,
            composed: true,
          }));
        });
      });
    }
  }
}
customElements.define("noema-rnsgate-card-editor", NoemaRnsgateCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "noema-rnsgate-card",
  name: "NOEMA RNSGate Card",
  description: "Dashboard card for NOEMA RNSGate Lite gateway",
  preview: false,
});
