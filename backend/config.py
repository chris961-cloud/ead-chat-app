# ── JWT configuration ────────────────────────────────────────────────────────
# SECRET_KEY signs every token.  Anyone who knows it can forge tokens, so in a
# real deployment this must come from an environment variable / secrets manager
# rather than being hard-coded here.  For a university project this is fine.
SECRET_KEY = "change-me-before-going-to-production"

ALGORITHM = "HS256"

# Tokens stay valid for 24 hours.  Adjust as needed.
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
