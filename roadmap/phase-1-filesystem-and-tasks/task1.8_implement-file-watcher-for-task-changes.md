**Stage:** plan
**Tags:** mvp, filesystem, watcher, events, testing

**Goal**
Keep UI in sync with filesystem changes and enable real-time updates.

**Scope**

* Implement `FileSystemWatcher` for `.kanban2code`:

  * Creation, modification, deletion.
  * Renames/moves.
  * Ignore non-task paths and non-`.md` files.
* Debounce rapid changes (e.g. 300ms).
* Emit events:

  * Task created / updated / deleted / moved.
* Handle external edits (Git, external tools).
* Integrate with task loading service to refresh data.
* **Testing requirement:**

  * Unit tests with mocked watchers to ensure debounce and event emission logic is correct.
