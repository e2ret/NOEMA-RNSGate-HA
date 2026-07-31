"""Sensor platform for NOEMA RNSGate."""
from __future__ import annotations

from homeassistant.components.sensor import SensorEntity, SensorDeviceClass, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import PERCENTAGE, UnitOfTemperature, UnitOfInformation
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up NOEMA RNSGate sensors."""
    coordinator = hass.data[DOMAIN][entry.entry_id]

    entities = [
        NOEMASensor(coordinator, entry, "ip", "IP Address", None, "mdi:ip-network",
                    None, None,
                    lambda d: d.get("system", {}).get("ip")),
        NOEMASensor(coordinator, entry, "cpu", "CPU Usage", PERCENTAGE, "mdi:cpu-64-bit",
                    None, SensorStateClass.MEASUREMENT,
                    lambda d: d.get("system", {}).get("cpu")),
        NOEMASensor(coordinator, entry, "ram", "RAM Usage", PERCENTAGE, "mdi:memory",
                    None, SensorStateClass.MEASUREMENT,
                    lambda d: round(d.get("system", {}).get("ram_used", 0) / d.get("system", {}).get("ram_total", 1) * 100, 1) if d.get("system", {}).get("ram_total") else None),
        NOEMASensor(coordinator, entry, "disk", "Disk Usage", PERCENTAGE, "mdi:harddisk",
                    None, SensorStateClass.MEASUREMENT,
                    lambda d: round(d.get("system", {}).get("disk_used", 0) / d.get("system", {}).get("disk_total", 1) * 100, 1) if d.get("system", {}).get("disk_total") else None),
        NOEMASensor(coordinator, entry, "temp", "CPU Temperature", UnitOfTemperature.CELSIUS, "mdi:thermometer",
                    SensorDeviceClass.TEMPERATURE, SensorStateClass.MEASUREMENT,
                    lambda d: d.get("system", {}).get("temp")),
        NOEMASensor(coordinator, entry, "lxmf_sent", "LXMF Sent", "messages", "mdi:send",
                    None, SensorStateClass.TOTAL_INCREASING,
                    lambda d: d.get("lxmf", {}).get("count", {}).get("sent", 0)),
        NOEMASensor(coordinator, entry, "lxmf_received", "LXMF Received", "messages", "mdi:inbox",
                    None, SensorStateClass.TOTAL_INCREASING,
                    lambda d: d.get("lxmf", {}).get("count", {}).get("recv", 0)),
        NOEMASensor(coordinator, entry, "lxmf_total", "LXMF Total", "messages", "mdi:message-outline",
                    None, SensorStateClass.TOTAL_INCREASING,
                    lambda d: d.get("lxmf", {}).get("count", {}).get("total", 0)),
        NOEMASensor(coordinator, entry, "rns_version", "RNS Version", None, "mdi:package-up",
                    None, None,
                    lambda d: d.get("rns", {}).get("current") or d.get("system", {}).get("rns_version")),
        NOEMASensor(coordinator, entry, "rns_latest", "RNS Latest", None, "mdi:package-up",
                    None, None,
                    lambda d: d.get("rns", {}).get("latest")),
        NOEMASensor(coordinator, entry, "uptime", "Uptime", None, "mdi:timer-outline",
                    None, None,
                    lambda d: d.get("system", {}).get("uptime")),
        NOEMASensor(coordinator, entry, "lxmf_address", "LXMF Bridge Address", None, "mdi:identifier",
                    None, None,
                    lambda d: d.get("addresses", {}).get("lxmf_bridge")),
        NOEMASensor(coordinator, entry, "i2p_address", "I2P Address (b32)", None, "mdi:incognito",
                    None, None,
                    lambda d: d.get("i2p", {}).get("b32_address")),
        NOEMASensor(coordinator, entry, "nomadnet_address", "Nomadnet Node Address", None, "mdi:web",
                    None, None,
                    lambda d: d.get("nomadnet", {}).get("page_addr")),
        NOEMASensor(coordinator, entry, "ram_used_mb", "RAM Used", "MB", "mdi:memory",
                    None, SensorStateClass.MEASUREMENT,
                    lambda d: d.get("system", {}).get("ram_used")),
        NOEMASensor(coordinator, entry, "disk_used_gb", "Disk Used", "MB", "mdi:harddisk",
                    None, SensorStateClass.MEASUREMENT,
                    lambda d: d.get("system", {}).get("disk_used")),
    ]

    async_add_entities(entities)


class NOEMASensor(CoordinatorEntity, SensorEntity):
    """NOEMA RNSGate sensor."""

    def __init__(self, coordinator, entry, key, name, unit, icon,
                 device_class, state_class, value_fn):
        """Initialize sensor."""
        super().__init__(coordinator)
        self._entry = entry
        self._key = key
        self._attr_name = f"NOEMA {name}"
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_native_unit_of_measurement = unit
        self._attr_icon = icon
        self._attr_device_class = device_class
        self._attr_state_class = state_class
        self._value_fn = value_fn

    @property
    def native_value(self):
        """Return sensor value."""
        if self.coordinator.data is None:
            return None
        return self._value_fn(self.coordinator.data)

    @property
    def device_info(self):
        """Return device info."""
        return {
            "identifiers": {(DOMAIN, self._entry.entry_id)},
            "name": self._entry.data.get("name", "NOEMA RNSGate"),
            "manufacturer": "NOEMA",
            "model": "RNSGate Lite",
            "sw_version": self.coordinator.data.get("rns", {}).get("current") if self.coordinator.data else None,
            "configuration_url": f"http://{self._entry.data['host']}:{self._entry.data.get('port', 8081)}",
        }
