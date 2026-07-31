"""Constants for NOEMA RNSGate integration."""

DOMAIN = "noema_rnsgate"
SCAN_INTERVAL = 30  # seconds

DEFAULT_PORT = 8081

SERVICES_LIST = [
    "rnsd",
    "lxmf_bridge_mqtt",
    "i2pd",
    "nomadnet",
    "rbrowser",
]

SERVICES_LIST_BUTTONS = [
    "rnsd",
    "lxmf_bridge_mqtt",
    "i2pd",
    "nomadnet",
    "rbrowser",
    "dashboard",
]
