# Quarantine — not shipped, kept on purpose

This folder was called `_to_delete/`, which read like leftover mess a repository
had failed to clean up. It is the opposite: a deliberate hold, with a test
behind it. Renamed so the name says what the folder is for.

`testimonials-section.tsx.unused` — nine testimonials with invented people:
Sarah Chen (Brokerage Partner), Marcus Rodriguez (Sales Director), Emily Watson,
David Park, Priya Sharma, James Liu, Anna Kowalski, Michael Foster, Rachel Green
— each with a quote, a handle and an avatar, praising products by name
("Occalizer turned our spend into a dial", "Lead Direction removed guesswork").

Nothing imported it, so nothing rendered it. That is the only reason it was
never a problem: a single `import { TestimonialsSection }` would have put nine
fabricated customer endorsements on a live marketing page.

Moved rather than deleted so the copy survives if any of these quotes turns out
to be a real customer's words that lost its attribution. The `.unused` extension
keeps it out of the TypeScript program, and tests/honest-copy.test.ts fails if a
file under components/ or app/ grows an attributed endorsement again.

If nobody claims it, delete the folder.
