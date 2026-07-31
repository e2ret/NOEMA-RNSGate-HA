"""Config flow for NOEMA RNSGate integration."""
from __future__ import annotations

import aiohttp
import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import HomeAssistant

from .const import DOMAIN, DEFAULT_PORT

DATA_SCHEMA = vol.Schema({
    vol.Required("host"): str,
    vol.Optional("port", default=DEFAULT_PORT): int,
    vol.Optional("name", default="NOEMA RNSGate"): str,
})


async def validate_connection(hass: HomeAssistant, host: str, port: int) -> dict:
    """Validate connection to NOEMA RNSGate."""
    url = f"http://{host}:{port}/api/system"
    async with aiohttp.ClientSession() as session:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
            if resp.status != 200:
                raise Exception("Cannot connect")
            return await resp.json()


class NOEMAConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for NOEMA RNSGate."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
        errors = {}

        if user_input is not None:
            try:
                info = await validate_connection(
                    self.hass,
                    user_input["host"],
                    user_input.get("port", DEFAULT_PORT),
                )
                return self.async_create_entry(
                    title=user_input.get("name", "NOEMA RNSGate"),
                    data=user_input,
                )
            except aiohttp.ClientError:
                errors["base"] = "cannot_connect"
            except Exception:
                errors["base"] = "cannot_connect"

        return self.async_show_form(
            step_id="user",
            data_schema=DATA_SCHEMA,
            errors=errors,
        )
