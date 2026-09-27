## File Access Tracker & Download Limiter (Simulated Rate-Limiting)

A client-side access tracking module that simulates rate-limiting download behaviors.

### Security Framing & Architecture Notes

- **Client-Side Limitation Notice:** Client-side counters and rate limits serve as a user experience nudge, NOT a security barrier. Browser state and `localStorage` are fully editable by the user. True rate limits MUST be enforced by server middleware (e.g., Redis rate-limiters).
- **Derived State Pattern:** File counts are NOT stored directly on file objects. Instead, counts are computed dynamically from an **append-only event log** using memoized selectors (`getFileStats`). This prevents state drift between log records and counters.
- **Strict Execution Checks:** Rate limits are re-checked directly inside the download action handler (`validateAccess`) at invocation time. Disabling the UI button is purely decorative; the handler is the single source of enforcement.
- **Log Management:** Log entries store timestamps strictly as ISO 8601 strings (`new Date().toISOString()`) to avoid serialization bugs. Logs are capped at 100 entries (`MAX_LOG_CAP`) to prevent memory leaks during extended client sessions.