from nanoid import generate


def generate_id(prefix: str) -> str:
    """Generate a prefixed ID (e.g. u_a3F8x7Kp, plc_x9k2Mn4Q)."""
    return f"{prefix}_{generate(size=8)}"
