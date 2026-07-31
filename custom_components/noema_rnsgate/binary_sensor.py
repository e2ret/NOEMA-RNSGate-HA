"""Binary sensor platform for NOEMA RNSGate."""
from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity, BinarySensorDeviceClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, SERVICES_LIST


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up NOEMA RNSGate binary sensors."""
    coordinator = hass.data[DOMAIN][entry.entry_id]

    entities = []

    # MQTT status
    entities.append(NOEMABinarySensor(
        coordinator, entry, "mqtt", "MQTT Broker",
        "mdi:server-network", BinarySensorDeviceClass.CONNECTIVITY,
        lambda d: d.get("mqtt", {}).get("status") == "ok"
    ))

    # RNS update available
    entities.append(NOEMABinarySensor(
        coordinator, entry, "rns_update", "RNS Update Available",
        "mdi:update", None,
        lambda d: d.get("rns", {}).get("update_available", False)
    ))

    # Service sensors
    for svc in SERVICES_LIST:
        entities.append(NOEMAServiceSensor(coordinator, entry, svc))

    async_add_entities(entities)


class NOEMABinarySensor(CoordinatorEntity, BinarySensorEntity):
    """NOEMA binary sensor."""

    def __init__(self, coordinator, entry, key, name, icon, device_class, value_fn):
        """Initialize binary sensor."""
        super().__init__(coordinator)
        self._entry = entry
        self._key = key
        self._attr_name = f"NOEMA {name}"
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_icon = icon
        self._attr_device_class = device_class
        self._value_fn = value_fn

    @property
    def is_on(self):
        """Return state."""
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
        }


class NOEMAServiceSensor(CoordinatorEntity, BinarySensorEntity):
    """Binary sensor for NOEMA service status."""

    def __init__(self, coordinator, entry, service_name):
        """Initialize service sensor."""
        super().__init__(coordinator)
        self._entry = entry
        self._service = service_name
        self._attr_name = f"NOEMA {service_name}"
        self._attr_unique_id = f"{entry.entry_id}_svc_{service_name}"
        self._attr_icon = "mdi:cog-outline"
        self._attr_device_class = BinarySensorDeviceClass.RUNNING

    @property
    def is_on(self):
        """Return True if service is active."""
        if self.coordinator.data is None:
            return None
        services = self.coordinator.data.get("services", [])
        for svc in services:
            if svc.get("name") == self._service:
                return svc.get("status") == "active"
        return False

    @property
    def device_info(self):
        """Return device info."""
        return {
            "identifiers": {(DOMAIN, self._entry.entry_id)},
            "name": self._entry.data.get("name", "NOEMA RNSGate"),
            "manufacturer": "NOEMA",
            "model": "RNSGate Lite",
        }
