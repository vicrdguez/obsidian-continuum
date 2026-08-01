# Continuum

Continuum is a place for gathering related vault content into one ordered reading flow while preparing new writing.

## Language

**Continuum**:
The vault's single persistent, ordered collection of **Entries**, presented as one reading flow.
_Avoid_: Workbench, collection

**Entry**:
One item in the **Continuum**. An entry is either a **Live entry** or a **Snapshot entry**.
_Avoid_: Item, card

**Live entry**:
An **Entry** whose displayed and inserted content follows its **Source**. Full notes and **Addressable content** can be live entries.
_Avoid_: Embed, snapshot

**Snapshot entry**:
An **Entry** that preserves unaddressed captured content exactly as it was when added, even if its **Source** later changes.
_Avoid_: Live entry, copy

**Block**:
The smallest complete Markdown unit around the cursor: a paragraph, fenced code block, table, callout, heading section through the next heading of equal or higher level, or the current list item with all of its nested children.
_Avoid_: Line, selection

**Addressable content**:
Content with a stable vault address, such as a heading or a **Block** with an ID. A selection can become addressable when the user has explicitly allowed Continuum to add block IDs to source notes.
_Avoid_: Selection, snapshot

**Source**:
The vault location from which an **Entry** was added and to which the user can return.
_Avoid_: Origin, target

**Destination note**:
The most recently active Markdown note, at whose current cursor the focused **Entry** can be inserted.
_Avoid_: Active note, target note

**Source comment**:
An optional hidden provenance marker placed after inserted content that links it back to the **Source**.
_Avoid_: Citation, attribution

## Example dialogue

> **Writer:** I added the whole research note as a live entry, so it now shows my latest edits.
>
> **Editor:** What about the sentence you selected from the interview note?
>
> **Writer:** That is a snapshot entry, so it still contains exactly what I captured. If I add an addressable block instead, the entry stays live.
>
> **Editor:** Where will it go when you insert it?
>
> **Writer:** Into my destination note at its cursor, with an optional source comment linking back to the source.
