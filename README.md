# Student Organization Task Tracker

A small browser-only task tracker built with HTML, CSS, and vanilla JavaScript. No backend, database, login, build tools, or libraries. Data is saved in your browser's `localStorage`.

## How to run

1. Keep `index.html`, `styles.css`, and `app.js` in the same folder.
2. Double-click `index.html` (or open it from your browser's File menu).

No server or install is needed.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, form, filter/search controls, task list |
| `styles.css` | Styling |
| `app.js` | Application logic and localStorage persistence |
| `README.md` | This file |

## Intended behavior (requirements)

1. Create a task with a title, assignee, optional due date, and status.
2. Reject blank or whitespace-only titles with a clear validation message.
3. Display tasks in a readable list.
4. Edit only the selected task.
5. Delete only the selected task.
6. Support Pending, In Progress, and Completed statuses.
7. Filter correctly by status, including an All option.
8. Search task titles without case sensitivity.
9. Persist task creation, editing, deletion, and status changes in localStorage across refreshes.
10. Handle invalid actions without crashing or corrupting other tasks.
11. Provide a way to restore sample data or reset the application (**Restore sample data** and **Clear all tasks**).

A blank assignee is saved as "Unassigned". All sample data is fictional.
