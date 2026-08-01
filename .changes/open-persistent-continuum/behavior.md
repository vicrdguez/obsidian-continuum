# Open and collect notes in a persistent Continuum Behavior

## Feature: Open the Continuum

#### Scenario: Open Continuum in the remembered workspace area
- Given Continuum has never been placed in this vault
- When the writer invokes `Focus Continuum`
- Then the infinity-icon view opens in the right sidebar with keyboard focus
- And after the writer moves, closes, and reopens it, it opens in the last broad workspace area

#### Scenario: Respect a closed Continuum across restart
- Given the writer closed the Continuum view
- When Obsidian restarts
- Then Continuum remains closed
- But invoking `Focus Continuum` opens it again

## Feature: Collect a full note

#### Scenario Outline: Add the active note from any Markdown mode
- Given a Markdown note is active in <mode>
- When the writer invokes `Add current note`
- Then one live entry is appended and focused in Continuum
- And Continuum is revealed without taking keyboard focus from the note

Examples:
| mode |
| Source mode |
| Live Preview |
| Reading view |

#### Scenario: Render a full note as read-only content
- Given a collected note has YAML properties, Markdown body content, and a task checkbox
- When its entry is rendered
- Then the body content is visible without the YAML properties
- And activating the rendered checkbox does not change the entry or source note
- And ordinary rendered text remains pointer-selectable

#### Scenario: Focus an existing entry instead of duplicating a note
- Given a live entry already references the active note
- When the writer invokes `Add current note`
- Then the Continuum still contains one entry for that note
- And that existing entry becomes focused

#### Scenario: Restore the persistent Continuum
- Given the Continuum contains ordered note entries with one focused entry
- When the plugin reloads from its saved data
- Then the same entries are restored in the same order
- And the same entry is focused

#### Scenario: Open a note entry source
- Given a note entry is focused and Continuum is open
- When the writer activates its source
- Then the note opens in Live Preview in the most recently active Markdown leaf
- And the Continuum view remains open
