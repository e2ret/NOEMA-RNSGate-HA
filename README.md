# NOEMA RNSGate — Home Assistant Integration

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
![Version](https://img.shields.io/badge/version-1.0.0-teal)
![HA](https://img.shields.io/badge/HA-2024.1+-blue)

Home Assistant integration and Lovelace card for NOEMA RNSGate Lite — a Reticulum mesh gateway combining LoRa radio, LXMF messaging, MQTT bridge, I2P and Nomadnet.

<p align="left">
  <img src="https://github.com/e2ret/NOEMA-RNSGate-HA/blob/main/docs/card.png" width="300" alt="NOEMA RNSGate HA">
</p>

---

## Features

**Integration (`noema_rnsgate`):**
- System metrics — CPU, RAM, Disk, Temperature, IP, Uptime
- Service status — rnsd, lxmf_bridge_mqtt, i2pd, nomadnet, rbrowser
- MQTT broker connectivity
- LXMF statistics — sent, received, total
- Gateway addresses — LXMF Bridge, I2P b32, Nomadnet node
- RNS version with update detection
- Restart buttons for each service

**Lovelace Card (`noema-rnsgate-card`):**
- Auto-discovers all entities by integration prefix
- Gauges for CPU, RAM, Disk, Temperature
- Service status indicators with restart buttons
- LXMF bridge info and statistics
- MQTT status
- RNS version footer with update indicator
- No manual entity configuration needed

---

## Requirements

- NOEMA RNSGate Lite running on your network
- Home Assistant 2024.1+
- HACS (for easy installation)

---

## Installation via HACS

### Integration

1. HACS → **Integrations** → ⋮ → **Custom repositories**
2. Add `https://github.com/e2ret/NOEMA-RNSGate-HA` → Category: **Integration**
3. Find **NOEMA RNSGate** → Install
4. Restart Home Assistant
5. **Settings → Integrations → Add → NOEMA RNSGate**

### Lovelace Card

1. HACS → **Frontend** → ⋮ → **Custom repositories**
2. Add `https://github.com/e2ret/NOEMA-RNSGate-HA` → Category: **Lovelace**
3. Find **NOEMA RNSGate Card** → Install

---

## Manual Installation

```bash
# Integration
cp -r custom_components/noema_rnsgate /config/custom_components/

# Card
cp www/noema-rnsgate-card.js /config/www/
```

Add resource in HA: **Settings → Dashboards → Resources → Add**
- URL: `/local/noema-rnsgate-card.js`
- Type: JavaScript module

---

## Configuration

**Settings → Integrations → Add → NOEMA RNSGate**

| Field | Description | Default |
|-------|-------------|---------|
| Host | IP address of your gateway | — |
| Port | Dashboard port | 8081 |
| Name | Device name in HA | NOEMA RNSGate |

---

## Lovelace Card

```yaml
type: custom:noema-rnsgate-card
title: NOEMA RNSGate Lite
prefix: noema_rnsgate_noema
```

| Option | Description | Default |
|--------|-------------|---------|
| `title` | Card title | NOEMA RNSGate Lite |
| `prefix` | Entity ID prefix | noema_rnsgate_noema |

The `prefix` is the common part of your entity IDs. If your entities are named `sensor.noema_rnsgate_noema_cpu_usage`, the prefix is `noema_rnsgate_noema`.

---

## Entities

### Sensors
| Entity | Description |
|--------|-------------|
| `sensor.*_cpu_usage` | CPU usage % |
| `sensor.*_ram_usage` | RAM usage % |
| `sensor.*_disk_usage` | Disk usage % |
| `sensor.*_cpu_temperature` | CPU temperature °C |
| `sensor.*_uptime` | System uptime |
| `sensor.*_ip_address` | Gateway IP address |
| `sensor.*_rns_version` | Installed RNS version |
| `sensor.*_rns_latest` | Latest RNS version on PyPI |
| `sensor.*_lxmf_sent` | LXMF messages sent |
| `sensor.*_lxmf_received` | LXMF messages received |
| `sensor.*_lxmf_total` | LXMF messages total |
| `sensor.*_lxmf_bridge_address` | LXMF Bridge address |
| `sensor.*_i2p_address` | I2P b32 address |
| `sensor.*_nomadnet_address` | Nomadnet node address |

### Binary Sensors
| Entity | Description |
|--------|-------------|
| `binary_sensor.*_mqtt_broker` | MQTT broker connectivity |
| `binary_sensor.*_rns_update_available` | RNS update available |
| `binary_sensor.*_rnsd` | rnsd service status |
| `binary_sensor.*_lxmf_bridge_mqtt` | lxmf_bridge_mqtt status |
| `binary_sensor.*_i2pd` | i2pd service status |
| `binary_sensor.*_nomadnet` | nomadnet service status |
| `binary_sensor.*_rbrowser` | rbrowser service status |

### Buttons
| Entity | Description |
|--------|-------------|
| `button.*_restart_rnsd` | Restart rnsd |
| `button.*_restart_lxmf_bridge_mqtt` | Restart LXMF bridge |
| `button.*_restart_i2pd` | Restart i2pd |
| `button.*_restart_nomadnet` | Restart Nomadnet |
| `button.*_restart_rbrowser` | Restart rBrowser |
| `button.*_restart_dashboard` | Restart dashboard |
| `button.*_restart_all` | Restart all services |

---

## License

MIT
