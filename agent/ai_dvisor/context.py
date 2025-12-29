from contextvars import ContextVar

# Context variable to store the user ID for the current request
user_context: ContextVar[str] = ContextVar("user_context", default=None)
