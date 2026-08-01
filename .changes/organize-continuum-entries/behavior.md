# Organize Continuum entries safely Behavior

## Feature: Reorder entries

#### Scenario Outline: Move the focused entry
- Given the Continuum order is `A, B, C`
- And entry B is focused
- When the writer moves it <direction>
- Then the order becomes <result>
- And entry B remains focused
- And the new order persists after restart

Examples:
| direction | result |
| up | B, A, C |
| down | A, C, B |

#### Scenario: Stop movement at collection boundaries
- Given the first or last entry is focused
- When the writer moves it beyond that boundary
- Then the order is unchanged
- And the same entry remains focused

## Feature: Remove and restore entries

#### Scenario Outline: Focus a neighbor after removal
- Given the Continuum order is <starting-order>
- And entry B is focused
- When the writer removes it
- Then the order is <result>
- And <focused-entry> is focused

Examples:
| starting-order | result | focused-entry |
| A, B, C | A, C | C |
| A, B | A | A |

#### Scenario: Undo the most recent removal
- Given an entry with source, content, type, and fold state was removed from the middle
- When the writer invokes undo before another removal or restart
- Then the entry is restored at its former position with all prior state
- And the restored entry is focused

#### Scenario: A later removal replaces the undo
- Given entry A was removed
- And entry B was removed afterward
- When the writer invokes undo
- Then entry B is restored
- But entry A remains removed

## Feature: Clear the Continuum

#### Scenario: Cancel clearing every entry
- Given the Continuum contains entries
- When the writer invokes clear and rejects the confirmation
- Then every entry and the current focus remain unchanged

#### Scenario: Confirm and undo clearing every entry
- Given the Continuum contains ordered entries with fold and focus state
- When the writer confirms clearing
- Then the Continuum is empty
- When the writer invokes undo before restart or another removal
- Then the complete prior collection and state are restored

#### Scenario: Never remove source block IDs
- Given a live entry uses a block ID that Continuum previously added to its source note
- When that entry is removed or the Continuum is cleared
- Then only plugin collection state changes
- And the source note and block ID remain unchanged

## Feature: Access organization actions

#### Scenario: Use equivalent keyboard, command, and menu actions
- Given Continuum is focused
- When the writer uses configured keys, assignable commands, or entry and toolbar overflow menus
- Then each route invokes the same move, remove, undo, or clear behavior
- And the defaults are `Shift+J`, `Shift+K`, `x`, and `u`
