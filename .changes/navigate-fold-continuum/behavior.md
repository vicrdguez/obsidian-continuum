# Navigate and fold with configurable pane keys Behavior

## Feature: Focus and navigate entries

#### Scenario: Restore the last-focused entry
- Given a persisted Continuum has a last-focused entry
- When the writer invokes `Focus Continuum`
- Then the pane receives keyboard focus on that entry
- But if that entry no longer exists, the newest entry receives focus

#### Scenario: Navigate one entry at a time
- Given the middle entry is focused
- When the writer presses the configured next or previous key
- Then the adjacent entry in that direction becomes focused
- And equivalent Obsidian commands produce the same result

#### Scenario: Stop navigation at collection boundaries
- Given the first or last entry is focused
- When the writer navigates beyond that boundary
- Then focus stays on the boundary entry
- And navigation does not wrap

#### Scenario: Manual scrolling does not retarget keyboard actions
- Given an entry is focused
- When the writer manually scrolls another entry into view
- Then the original entry remains focused
- But clicking another entry focuses the clicked entry

## Feature: Align focused entries

#### Scenario Outline: Adapt alignment to rendered entry height
- Given the viewport height is 1000 pixels
- And the alignment threshold is 80 percent
- And the focused entry height is <height> pixels
- When navigation scrolls it into view
- Then it is aligned <alignment>

Examples:
| height | alignment |
| 799 | centered |
| 800 | top |
| 1200 | top |

#### Scenario: Configure the alignment threshold
- Given the alignment threshold setting is shown
- When the writer selects a valid value from 50 through 100 in a 5-percent step
- Then subsequent navigation uses that value
- And 80 percent is used by default

## Feature: Fold entries

#### Scenario: Toggle and persist one entry fold
- Given a new expanded entry is focused
- When the writer presses the configured fold key
- Then only that entry is folded
- And its fold state is restored after restart
- And `Tab` remains available for normal control and link traversal

#### Scenario Outline: Toggle every entry fold
- Given the collection is <starting-state>
- When the writer invokes the fold-all action
- Then every entry is <result>

Examples:
| starting-state | result |
| mixed or entirely expanded | folded |
| entirely folded | expanded |

## Feature: Configure pane-local keys

#### Scenario: Replace or disable a pane-local binding
- Given a valid default pane-local binding
- When the writer captures a different single key or modifier combination
- Then the new binding invokes the action only while Continuum is focused
- And clearing the field disables that pane-local binding

#### Scenario Outline: Reject an unsafe keymap
- Given one action already uses a binding
- When the writer assigns <invalid-binding> to another action
- Then the setting is rejected with a clear validation message
- And the previous valid keymap remains active

Examples:
| invalid-binding |
| the same binding |
| Tab |

#### Scenario: Restore default pane-local bindings
- Given one or more pane-local bindings were changed or disabled
- When the writer selects `Restore defaults`
- Then navigation uses `j` and `k`
- And source opening uses `Enter`
- And folding uses `Space`

## Feature: Show collection orientation

#### Scenario: Show count and fold-all in the toolbar
- Given Continuum contains three entries
- When the pane toolbar is rendered
- Then it displays an entry count of three
- And it exposes one fold-all action
