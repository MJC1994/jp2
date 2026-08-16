# Plan your journey — Leaving from and Going to

This describes how origin and destination station selection works between **Plan & Buy** and the **Plan your journey** sheet.

## The two screens

**Plan & Buy** is the trip planner. It shows two station fields:

- **Leaving from…** (origin)
- **Going to…** (destination)

Empty fields use the placeholder copy above, in grey. Once a station is chosen, the field shows the station name in black.

**Plan your journey** is the full-screen station picker that opens from those fields. It has the same two inputs, a results list, and a custom keyboard. Choosing stations here writes them back onto Plan & Buy.

Tapping **Leaving from** or **Going to** on Plan & Buy always opens Plan your journey. It does not edit the name in place on the planner.

---

## Opening from Plan & Buy

Which field you tap decides which input is focused, and which value is cleared for a fresh search.

### Tap Leaving from

1. Plan your journey opens with the keyboard already showing.
2. **Leaving from** is focused.
3. That field starts **empty**, even if Plan & Buy already had an origin. The user is starting a new origin search.
4. **Going to** keeps whatever destination is already on the planner (or stays empty).
5. Until the user types, the list shows **Your Stations**, **Nearest Stations**, and **Recent Stations** — not search results.

### Tap Going to

1. Plan your journey opens with the keyboard already showing.
2. **Going to** is focused.
3. That field starts **empty**, even if Plan & Buy already had a destination.
4. **Leaving from** keeps whatever origin is already on the planner (or stays empty).
5. The idle list is the same as above until the user types.

The field you did **not** tap is the one that carries over. The field you tapped is cleared so it is ready to search.

---

## Editing a field on Plan your journey

Only one field is focused at a time. The focused field has a blue inset border. A clear **×** appears on the focused field when it has text.

### Focusing a field

Tapping **Leaving from** or **Going to** on the sheet:

- Moves focus to that field
- Shows the keyboard if it was hidden
- Turns off search mode, so the idle lists come back
- Selects the current text if the field already has a value, so the next keystroke replaces it

### Typing

The custom keyboard types into the focused field. As soon as the user types (or deletes) in that field:

- The field is in **search mode**
- The idle lists are replaced by live rail-station results (up to 12)
- Results match a station name or a 3-letter CRS code
- An empty match set shows **No stations found**

Clearing the field with **×** empties it, keeps focus, and returns to the idle lists. The keyboard stays open.

Scrolling the results list dismisses the keyboard. Tapping the field again brings it back.

### Same-station error

Origin and destination cannot be the same. If both fields hold the same station name:

- **Going to** shows a red error border
- The message **Origin and destination cannot be the same** appears under it
- The picker does not close until the two values differ

---

## Choosing a station

A station can be chosen from search results, Recent Stations, or a saved Home / Work row. What happens next depends on which field is focused.

### While Leaving from is focused

1. The origin field is filled with the station name and written back to Plan & Buy.
2. If that station matches the current destination, focus moves to **Going to** (text selected) and the same-station error shows. The sheet stays open.
3. If a destination is already filled **and** the user already chose a destination earlier in this picker session, the sheet closes and returns to Plan & Buy.
4. Otherwise focus moves to **Going to**. If a destination is already filled (for example it was carried over from Plan & Buy), that text is selected so it can be kept or replaced.

So a first-time origin search always continues to destination. Changing origin when a destination was already on Plan & Buy also continues to destination, rather than closing immediately.

### While Going to is focused

1. The destination field is filled with the station name and written back to Plan & Buy.
2. If that station matches the current origin, the sheet stays open with the same-station error.
3. If origin is already filled, the sheet closes and returns to Plan & Buy.
4. If origin is still empty, focus moves to **Leaving from** so the user can finish the pair.

Typical first journey: pick origin → picker jumps to destination → pick destination → picker closes.

Typical change from Plan & Buy: tap **Going to**, pick a new station, picker closes because origin is already set.

---

## Keyboard: Search CTA

The custom keyboard on Plan your journey uses a **search** key on the bottom-right, in place of a Return / Go / Done key.

The label is **search**. It is the primary action for the focused field.

### What Search does

**If the user is mid-search and there is at least one result**

Search applies the **top result** to the focused field, as if they had tapped that row. The same origin / destination follow-on rules above then run (move to the other field, close, or show the same-station error).

**If they are not in a live search**

- If both **Leaving from** and **Going to** have a value and they are not the same station, Search closes the sheet and returns to Plan & Buy.
- Otherwise Search does nothing. It will not close on an incomplete pair, and it will not close while the two stations match.

This is why Search exists: it both confirms the best match for the current query, and it lets the user dismiss the sheet once both stations are valid without tapping a result row again.

Other keyboard behaviour that supports this:

- Letters, space, and delete edit the focused field
- Shift capitalises the next letter, then turns off
- The **123** key is present but does not switch layout in this prototype
- `enterKeyHint="search"` is set on the inputs so the action is search, not return

---

## Closing Plan your journey

The sheet returns to Plan & Buy when:

- Both stations are chosen through the flow above
- Search closes a valid complete pair
- The user taps the back chevron
- The user swipes the sheet down past the dismiss threshold
- The user presses Escape

Closing without a new pick leaves Plan & Buy as it was, except for any origin or destination already committed during this session (each successful pick is written back immediately).

Swap on Plan & Buy exchanges origin and destination without opening Plan your journey.
