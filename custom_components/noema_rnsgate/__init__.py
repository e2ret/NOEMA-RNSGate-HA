"""NOEMA RNSGate integration for Home Assistant."""
from __future__ import annotations

import logging
from datetime import timedelta

import aiohttp
import async_timeout

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import DOMAIN, SCAN_INTERVAL

_LOGGER = logging.getLogger(__name__)

PLATFORMS = ["sensor", "binary_sensor", "button"]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up NOEMA RNSGate from a config entry."""
    host = entry.data["host"]
    port = entry.data.get("port", 8081)
    base_url = f"http://{host}:{port}"

    coordinator = NOEMADataUpdateCoordinator(hass, base_url)
    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id)
    return unload_ok


class NOEMADataUpdateCoordinator(DataUpdateCoordinator):
    """Coordinator to fetch data from NOEMA RNSGate."""

    def __init__(self, hass: HomeAssistant, base_url: str) -> None:
        """Initialize coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=SCAN_INTERVAL),
        )
        self.base_url = base_url

    async def _async_update_data(self):
        """Fetch data from NOEMA RNSGate API."""
        try:
            async with async_timeout.timeout(10):
                async with aiohttp.ClientSession() as session:
                    data = {}

                    # System metrics
                    async with session.get(f"{self.base_url}/api/system") as resp:
                        if resp.status == 200:
                            data["system"] = await resp.json()

                    # Services status
                    async with session.get(f"{self.base_url}/api/services") as resp:
                        if resp.status == 200:
                            data["services"] = await resp.json()

                    # LXMF stats
                    async with session.get(f"{self.base_url}/api/lxmf/stats") as resp:
                        if resp.status == 200:
                            data["lxmf"] = await resp.json()

                    # MQTT status
                    async with session.get(f"{self.base_url}/api/mqtt/status") as resp:
                        if resp.status == 200:
                            data["mqtt"] = await resp.json()

                    # Addresses
                    async with session.get(f"{self.base_url}/api/addresses") as resp:
                        if resp.status == 200:
                            data["addresses"] = await resp.json()

                    # I2P status
                    async with session.get(f"{self.base_url}/api/i2p/status") as resp:
                        if resp.status == 200:
                            data["i2p"] = await resp.json()

                    # Nomadnet status
                    async with session.get(f"{self.base_url}/api/nomadnet/status") as resp:
                        if resp.status == 200:
                            data["nomadnet"] = await resp.json()

                    return data

        except aiohttp.ClientError as err:
            raise UpdateFailed(f"Cannot connect to NOEMA RNSGate: {err}") from err
        except Exception as err:
            raise UpdateFailed(f"Error communicating with NOEMA RNSGate: {err}") from err
