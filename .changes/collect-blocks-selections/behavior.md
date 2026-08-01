# Collect blocks and selections Behavior

## Feature: Capture the current Markdown Block

#### Scenario Outline: Capture the complete Block containing the cursor
- Given there is no editor selection
- And the cursor is inside <structure>
- When the writer invokes `Add current block or selection`
- Then the captured content is <boundary>

Examples:
| structure | boundary |
| paragraph | the complete paragraph |
| fenced code block | the complete opening fence, body, and closing fence |
| table | the complete table |
| callout | the complete callout |
| heading | the heading and descendants through the next heading of equal or higher level |
| nested list item | that list item and its descendants without sibling items |

#### Scenario: Selection takes precedence over the cursor Block
- Given the editor has a non-empty arbitrary Markdown selection
- When the writer invokes `Add current block or selection`
- Then one snapshot entry contains the selected characters exactly
- And no unselected content from the cursor Block is included

## Feature: Choose live or snapshot identity

#### Scenario Outline: Existing addressable content becomes live
- Given the captured content is <addressable-content>
- When it is added to Continuum
- Then the entry is Live
- And the source note is unchanged

Examples:
| addressable-content |
| a heading section |
| a Block with an existing block ID |

#### Scenario: Unaddressed Block remains a snapshot by default
- Given automatic block IDs are disabled
- And the cursor Block has no stable address
- When the writer adds the current Block
- Then a snapshot entry preserves its Markdown
- And the source note is unchanged

#### Scenario Outline: Exact Blocks receive automatic IDs after opt-in
- Given automatic block IDs are enabled
- And capture uses <capture-shape>
- And the Block has no stable address
- When the writer adds the Block
- Then a collision-checked six-character lowercase alphanumeric ID is added using valid Obsidian block syntax
- And the new entry is Live at that block ID

Examples:
| capture-shape |
| the cursor with no selection |
| a selection matching the complete Block range character-for-character |

#### Scenario Outline: Inexact selections never modify their sources
- Given automatic block IDs are enabled
- And the selection is <selection-shape>
- When the writer adds the selection
- Then one snapshot preserves the selected characters exactly
- And the source note receives no block ID

Examples:
| selection-shape |
| part of one Block |
| a complete Block missing its trailing range character |
| multiple Blocks |

#### Scenario: Contextual collection is unavailable in Reading view
- Given a Markdown note is active in Reading view
- When Obsidian checks `Add current block or selection`
- Then the command is unavailable
- But `Add current note` remains available

#### Scenario: Deduplicate only live addresses
- Given Continuum contains a live entry and a snapshot entry
- When each source capture is added again
- Then the live source still has one entry and that entry is focused
- And a second snapshot entry is appended

## Feature: Identify captured entries

#### Scenario Outline: Show compact accessible entry identity
- Given an entry is <entry-type>
- When its header is rendered
- Then it shows <icon> with the tooltip and accessible label <label>
- And it shows the most specific stable source context available

Examples:
| entry-type | icon | label |
| Live | link | Live |
| Snapshot | camera | Snapshot |
