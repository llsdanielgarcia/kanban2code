**Stage:** plan
**Tags:** mvp, infra, webview, architecture, testing

**Goal**
Establish foundation for React webviews with proper state management and host communication.

**Scope**

* Define message types for host ↔ webview communication:

  * TaskUpdated, TaskSelected, FilterChanged, etc.
  * Request types: CreateTask, MoveTask, CopyContext.
* Add a versioned envelope `{version, type, payload}` and runtime validation (zod/io-ts).
* Set up React state management with Zustand:

  * Stores for tasks, filters, UI state.
* Create base component library:

  * Button, Modal, Tree, Card (using shadcn/ui).
* Styling:

  * Tailwind CSS utilities + any needed CSS-in-JS.
* Webview initialization pattern:

  * Shared setup for sidebar and board.
* **Testing requirement:**

  * Unit tests for message validation and reducers/store actions.
