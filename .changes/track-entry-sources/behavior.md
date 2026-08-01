# Keep entries connected to their sources Behavior

## Feature: Resolve changing entry sources

#### Scenario: Refresh only live entry content
- Given a live entry and a snapshot were captured from the same source content
- When that source content changes
- Then the live entry displays and exposes the current Markdown
- But the snapshot still displays and exposes its originally captured characters

#### Scenario: Follow a source-note rename
- Given live and snapshot entries reference a source note
- When the note is renamed or moved
- Then every entry references the new vault path
- And entry order, type, captured content, and focus remain unchanged

#### Scenario Outline: Preserve an entry whose source is unavailable
- Given an entry previously resolved <source-kind>
- When that source is no longer available
- Then the entry remains in Continuum with its last available content
- And its type remains unchanged
- And its header shows `Source missing`
- And source activation is disabled

Examples:
| source-kind |
| a note |
| a heading section |
| an identified block |

## Feature: Return to source

#### Scenario: Select the nearest exact snapshot match
- Given snapshot text now occurs more than once in its source note
- And the snapshot retains its original source offset
- When the writer opens its source
- Then the exact occurrence nearest the original offset is selected in Live Preview
- And Continuum remains open

#### Scenario: Open the source note when snapshot text is absent
- Given a snapshot source note still exists
- But its exact captured text no longer exists
- When the writer opens its source
- Then the source note opens in Live Preview without selecting replacement text
- And no fuzzy match is attempted

#### Scenario Outline: Select a live source address
- Given a live entry references <source-address>
- When the writer opens its source
- Then the address opens in Live Preview in the most recently active Markdown leaf
- And the precise source range is selected when applicable
- And Continuum remains open

Examples:
| source-address |
| a full note |
| a heading section |
| an identified block |

#### Scenario: Open an internal entry link consistently
- Given rendered entry content contains an internal Obsidian link
- When the writer activates that link
- Then its note opens in Live Preview in the same destination Markdown leaf used for source navigation
- And Continuum remains open

## Feature: Identify source context

#### Scenario: Disambiguate duplicate note names
- Given two vault notes share the same basename
- And an entry references one of them below a heading
- When its source header is rendered
- Then the visible source uses the disambiguating vault path and heading
- And the full vault path is available on hover
