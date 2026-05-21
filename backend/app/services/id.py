from nanoid import generate


def generate_id(prefix: str) -> str:
    """Generate a prefixed ID (e.g. generate_id('u') -> u_a3F8x7Kp)."""
    return f"{prefix}_{generate(size=8)}"
