"""Button platform for NOEMA RNSGate."""
from __future__ import annotations

import aiohttp

from homeassistant.components.button import ButtonEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, SERVICES_LIST_BUTTONS


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up NOEMA RNSGate buttons."""
    coordinator = hass.data[DOMAIN][entry.entry_id]
    host = entry.data["host"]
    port = entry.data.get("port", 8081)
    base_url = f"http://{host}:{port}"

    entities = []

    # Restart buttons for each service
    for svc in SERVICES_LIST_BUTTONS:
        entities.append(NOEMAServiceButton(entry, base_url, svc, "restart", coordinator))

    # Restart all button
    entities.append(NOEMARestartAllButton(entry, base_url, coordinator))

    async_add_entities(entities)


class NOEMAServiceButton(ButtonEntity):
    """Button to control a NOEMA service."""

    def __init__(self, entry, base_url, service, action, coordinator):
        """Initialize button."""
        self._entry = entry
        self._base_url = base_url
        self._service = service
        self._action = action
        self._coordinator = coordinator
        self._attr_name = f"NOEMA {action.capitalize()} {service}"
        self._attr_unique_id = f"{entry.entry_id}_btn_{service}_{action}"
        self._attr_icon = "mdi:restart" if action == "restart" else "mdi:play"

    async def async_press(self) -> None:
        """Handle button press."""
        async with aiohttp.ClientSession() as session:
            await session.post(
                f"{self._base_url}/api/services/{self._service}/{self._action}",
                timeout=aiohttp.ClientTimeout(total=10)
            )
        await self._coordinator.async_request_refresh()

    @property
    def device_info(self):
        """Return device info."""
        return {
            "identifiers": {(DOMAIN, self._entry.entry_id)},
            "name": self._entry.data.get("name", "NOEMA RNSGate"),
            "manufacturer": "NOEMA",
            "model": "RNSGate Lite",
        }


class NOEMARestartAllButton(ButtonEntity):
    """Button to restart all NOEMA services."""

    def __init__(self, entry, base_url, coordinator):
        """Initialize button."""
        self._entry = entry
        self._base_url = base_url
        self._coordinator = coordinator
        self._attr_name = "NOEMA Restart All"
        self._attr_unique_id = f"{entry.entry_id}_btn_restart_all"
        self._attr_icon = "mdi:restart-alert"

    async def async_press(self) -> None:
        """Handle button press."""
        async with aiohttp.ClientSession() as session:
            await session.post(
                f"{self._base_url}/api/run",
                json={"cmd": "restart_all"},
                timeout=aiohttp.ClientTimeout(total=30)
            )
        await self._coordinator.async_request_refresh()

    @property
    def device_info(self):
        """Return device info."""
        return {
            "identifiers": {(DOMAIN, self._entry.entry_id)},
            "name": self._entry.data.get("name", "NOEMA RNSGate"),
            "manufacturer": "NOEMA",
            "model": "RNSGate Lite",
        }
