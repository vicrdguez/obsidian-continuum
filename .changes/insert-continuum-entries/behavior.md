# Insert Continuum entries into destination notes Behavior

## Feature: Choose the Destination note

#### Scenario: Refuse insertion without an available Destination note
- Given no remembered Markdown editor is available
- When the writer invokes `Insert focused entry`
- Then no vault file changes
- And the writer is told to focus a destination note first

#### Scenario: Replace a selection or insert at the cursor
- Given the most recently active Markdown editor contains a destination selection or cursor
- When the writer inserts the focused entry
- Then an existing destination selection is replaced
- But with no selection the material is inserted at the cursor

## Feature: Materialize entry Markdown

#### Scenario Outline: Choose entry content at insertion time
- Given the focused entry is <entry-state>
- When the writer inserts it
- Then the materialized Markdown is <content>

Examples:
| entry-state | content |
| an available live entry | its currently resolved source Markdown |
| an unavailable live entry | its last cached Markdown |
| a snapshot entry | its originally captured Markdown |

#### Scenario Outline: Exclude source-only metadata
- Given the focused entry contains <source-markdown>
- When its insertion is planned
- Then the destination receives <inserted-markdown>

Examples:
| source-markdown | inserted-markdown |
| a full note with YAML frontmatter | the note body without frontmatter |
| one identified Block | that Block without its identifying block ID |
| a heading section containing nested block IDs | the section with nested block IDs preserved |

#### Scenario Outline: Apply separation by entry granularity
- Given the destination cursor has surrounding content
- And the entry is <granularity>
- When its insertion is planned
- Then the result <spacing-rule>

Examples:
| granularity | spacing-rule |
| full note | has at least one blank line on each applicable side, adding only missing separation |
| complete Block | has at least one blank line on each applicable side, adding only missing separation |
| partial selection | contains the selected characters inline with no added whitespace |

## Feature: Add optional source provenance

#### Scenario Outline: Place an enabled source comment
- Given source comments are enabled
- And the entry is <granularity>
- When the writer inserts it
- Then the most specific stable source link is written as `%% Source: [[…]] %%`
- And the comment is placed <placement>

Examples:
| granularity | placement |
| full note | on its own line after the content |
| complete Block | on its own line after the content |
| partial selection | immediately inline with no exterior whitespace |

#### Scenario: Omit source comments by default
- Given source comments have never been enabled
- When the writer inserts an entry
- Then no source comment is added

## Feature: Protect and continue destination editing

#### Scenario Outline: Confirm same-source insertion
- Given the Destination note is also the entry's source note
- When the writer chooses <decision> at confirmation
- Then the source note is <result>

Examples:
| decision | result |
| cancel | unchanged |
| confirm | updated with the planned insertion |

#### Scenario: Preserve Continuum state and advance the Destination cursor
- Given an entry is focused in Continuum
- When insertion succeeds
- Then the entry remains present and focused
- And keyboard focus remains in Continuum
- And the Destination cursor moves after all inserted content, comment, and trailing separation
- And a subsequent insertion occurs after the prior insertion

## Feature: Access insertion

#### Scenario: Use equivalent key, command, and menu actions
- Given Continuum is focused
- When the writer presses the configured insertion key, invokes the command, or selects the entry overflow action
- Then each route performs the same insertion behavior
- And the pane-local default is `p`
- And the binding can be changed, disabled, and restored through settings
