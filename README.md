# NOEMA RNSGate — Home Assistant Integration

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration) [![Version](https://img.shields.io/badge/version-1.1.0-teal)](https://github.com/e2ret/NOEMA-RNSGate-HA) [![HA](https://img.shields.io/badge/HA-2024.1+-blue)](https://www.home-assistant.io)

Home Assistant integration and configurable Lovelace card for **NOEMA RNSGate** — a Reticulum mesh gateway combining LoRa radio, LXMF messaging, MQTT bridge, I2P and Nomadnet.

Works with both **[NOEMA RNSGate Lite](https://github.com/e2ret/NOEMA-RNSGate-Lite)** and **[NOEMA RNSGate FULL](https://github.com/e2ret/NOEMA-RNSGate-FULL)**.

[![NOEMA RNSGate HA](https://github.com/e2ret/NOEMA-RNSGate-HA/raw/main/docs/card.png)](https://github.com/e2ret/NOEMA-RNSGate-HA/blob/main/docs/card.png)

---

## Features

**Integration (`noema_rnsgate`):**

- System metrics — CPU, RAM, Disk, Temperature, IP, Uptime
- Service status — lxmf_bridge, i2pd, nomadnet, rbrowser
- MQTT broker connectivity
- LXMF statistics — sent, received, total
- Gateway addresses — LXMF Bridge, I2P b32, Nomadnet node
- RNS version
- **RNode RF telemetry — RSSI, SNR, interface name** *(FULL only)*
- **RNS nodes heard count** *(FULL only)*
- Restart buttons for each service

**Lovelace Card (`noema-rnsgate-card`) v2:**

- Visual editor — toggle blocks on/off, choose which metrics/services to show
- Sparkline graphs on metric cards (3h history from HA)
- Configurable blocks: Header, Metrics, MQTT, LXMF, RNode, Addresses, Services, Buttons, Footer
- Clickable addresses with copy to clipboard
- Confirmation dialog before restarting services
- No manual entity configuration needed

---

## Requirements

- NOEMA RNSGate Lite or FULL running on your network
- Home Assistant 2024.1+
- HACS (for integration installation)

---

## Installation

### Integration via HACS

1. HACS → **Integrations** → ⋮ → **Custom repositories**
2. Add `https://github.com/e2ret/NOEMA-RNSGate-HA` → Category: **Integration**
3. Find **NOEMA RNSGate** → Install
4. Restart Home Assistant
5. **Settings → Integrations → Add → NOEMA RNSGate**

### Lovelace Card — manual install

Download `www/noema-rnsgate-card.js` and copy to your HA config:

```bash
cp noema-rnsgate-card.js /config/www/
```

Add resource: **Settings → Dashboards → Resources → Add**

- URL: `/local/noema-rnsgate-card.js`
- Type: JavaScript module

---

## Integration Configuration

**Settings → Integrations → Add → NOEMA RNSGate**

| Field | Description                | Default       |
| ----- | -------------------------- | ------------- |
| Host  | IP address of your gateway | —             |
| Port  | Dashboard port             | 8081          |
| Name  | Device name in HA          | NOEMA RNSGate |

---

## Lovelace Card Usage

```yaml
type: custom:noema-rnsgate-card
title: NOEMA RNSGate
prefix: noema_rnsgate_noema
show_rnode: true
show_addresses: true
metrics:
  - cpu_usage
  - ram_usage
  - disk_usage
  - cpu_temperature
services:
  - noema_lxmf_bridge
  - i2pd
  - nomadnet
  - rbrowser
```

The `prefix` is the common part of your entity IDs. Find it in Developer Tools → States by searching `noema`.

---

## Entities

### Sensors

| Entity | Description |
|---|---|
| `sensor.*_cpu_usage` | CPU usage % |
| `sensor.*_ram_usage` | RAM usage % |
| `sensor.*_disk_usage` | Disk usage % |
| `sensor.*_cpu_temperature` | CPU temperature °C |
| `sensor.*_uptime` | System uptime |
| `sensor.*_ip_address` | Gateway IP address |
| `sensor.*_rns_version` | Installed RNS version |
| `sensor.*_lxmf_sent` | LXMF messages sent |
| `sensor.*_lxmf_received` | LXMF messages received |
| `sensor.*_lxmf_total` | LXMF messages total |
| `sensor.*_lxmf_bridge_address` | LXMF Bridge address |
| `sensor.*_i2p_address_b32` | I2P b32 address |
| `sensor.*_nomadnet_node_address` | Nomadnet node address |
| `sensor.*_rnode_rssi` | RNode RSSI dBm *(FULL)* |
| `sensor.*_rnode_snr` | RNode SNR dB *(FULL)* |
| `sensor.*_rnode_interface` | RNode interface name *(FULL)* |
| `sensor.*_rns_nodes_heard` | RNS nodes heard *(FULL)* |

### Binary Sensors

| Entity | Description |
|---|---|
| `binary_sensor.*_mqtt_broker` | MQTT broker connectivity |
| `binary_sensor.*_noema_lxmf_bridge` | LXMF bridge status |
| `binary_sensor.*_i2pd` | i2pd service status |
| `binary_sensor.*_nomadnet` | Nomadnet service status |
| `binary_sensor.*_rbrowser` | rBrowser service status |

### Buttons

| Entity | Description |
|---|---|
| `button.*_restart_noema_lxmf_bridge` | Restart LXMF bridge |
| `button.*_restart_i2pd` | Restart i2pd |
| `button.*_restart_nomadnet` | Restart Nomadnet |
| `button.*_restart_rbrowser` | Restart rBrowser |
| `button.*_restart_dashboard` | Restart dashboard |
| `button.*_restart_all` | Restart all services |

---

## License

MIT
