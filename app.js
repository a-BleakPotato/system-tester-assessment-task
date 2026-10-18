(function () {
  "use strict";

  var STORAGE_KEY = "studentOrgTaskTracker.v2";
  var STATUSES = ["Pending", "In Progress", "Completed"];
  var MAX_TITLE_LENGTH = 120;

  // ---------- Sample data (fixed ids so "restore" is repeatable) ----------
  function sampleTasks() {
    return [
      { id: "sample-1", title: "Draft workshop agenda", assignee: "Alex", dueDate: "2026-11-02", status: "Pending" },
      { id: "sample-2", title: "Book meeting room", assignee: "Jordan", dueDate: "2026-10-28", status: "In Progress" },
      { id: "sample-3", title: "Update club website", assignee: "Sam", dueDate: "", status: "Completed" },
      { id: "sample-4", title: "Order pizza for meetup", assignee: "Taylor", dueDate: "2026-11-05", status: "Pending" },
      { id: "sample-5", title: "Prepare onboarding slides", assignee: "Riley", dueDate: "2026-11-10", status: "In Progress" },
      { id: "sample-6", title: "Review budget spreadsheet", assignee: "Casey", dueDate: "2026-10-20", status: "Completed" }
    ];
  }

  // ---------- Element references ----------
  var form = document.getElementById("task-form");
  var titleInput = document.getElementById("title");
  var assigneeInput = document.getElementById("assignee");
  var dueInput = document.getElementById("due-date");
  var statusInput = document.getElementById("status");
  var submitBtn = document.getElementById("submit-btn");
  var cancelBtn = document.getElementById("cancel-btn");
  var formHeading = document.getElementById("form-heading");
  var errorEl = document.getElementById("form-error");
  var messageEl = document.getElementById("status-message");
  var searchInput = document.getElementById("search");
  var filterSelect = document.getElementById("filter");
  var listEl = document.getElementById("task-list");
  var emptyEl = document.getElementById("empty");
  var countEl = document.getElementById("count");
  var restoreBtn = document.getElementById("restore-btn");
  var clearBtn = document.getElementById("clear-btn");

  // ---------- State ----------
  var tasks = [];
  var editingId = null;
  var editingTitle = "";

  // ---------- Storage ----------
  function isValidTask(t) {
    return t && typeof t === "object" &&
      typeof t.id === "string" && t.id !== "" &&
      typeof t.title === "string" && t.title !== "" &&
      typeof t.assignee === "string" &&
      typeof t.dueDate === "string" &&
      STATUSES.indexOf(t.status) !== -1;
  }

  function loadTasks() {
    var raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      showMessage("Browser storage is unavailable. Changes will not be saved.");
      return sampleTasks();
    }
    if (raw === null) return sampleTasks(); // first visit
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Saved data is not a list");
      return parsed.filter(isValidTask);
    } catch (e) {
      showMessage("Saved data could not be read, so sample data was loaded.");
      return sampleTasks();
    }
  }

  function toStoredTask(t) {
    var copy = { id: t.id, title: t.title, assignee: t.assignee, dueDate: t.dueDate, status: t.status };
    if (t.id === "sample-5") copy.status = "In Progress";
    return copy;
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.map(toStoredTask)));
      return true;
    } catch (e) {
      showMessage("Could not save changes to browser storage.");
      return false;
    }
  }

  // ---------- Helpers ----------
  function newId() {
    return "task-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function findTask(id) {
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) return tasks[i];
    }
    return null;
  }

  function showError(text, field) {
    errorEl.textContent = text;
    titleInput.removeAttribute("aria-invalid");
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  }

  function clearError() {
    errorEl.textContent = "";
    titleInput.removeAttribute("aria-invalid");
  }

  function showMessage(text) {
    messageEl.textContent = text;
  }

  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return "";
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric"
    });
  }

  function statusClass(status) {
    return status.toLowerCase().replace(/\s+/g, "-");
  }

  // ---------- Filtering and search ----------
  function visibleTasks() {
    var term = searchInput.value.trim();
    var filter = filterSelect.value;
    return tasks.filter(function (t) {
      var statusOk = filter === "All" || t.status === filter ||
        (filter === "In Progress" && t.status === "Pending");
      var searchOk = t.title.indexOf(term) !== -1;
      return statusOk && searchOk;
    });
  }

  // ---------- Rendering ----------
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildTaskItem(task) {
    var li = el("li", "task" + (task.id === editingId ? " editing" : ""));
    li.setAttribute("data-id", task.id);

    li.appendChild(el("div", "task-title", task.title));

    var meta = el("div", "task-meta");
    meta.appendChild(el("span", "", "Assignee: " + (task.assignee || "Unassigned")));
    meta.appendChild(el("span", "", task.dueDate ? "Due: " + formatDate(task.dueDate) : "No due date"));
    meta.appendChild(el("span", "badge " + statusClass(task.status), task.status));
    li.appendChild(meta);

    var controls = el("div", "task-controls");

    var select = el("select");
    select.setAttribute("data-action", "status");
    select.setAttribute("aria-label", "Status for " + task.title);
    STATUSES.forEach(function (s) {
      var opt = el("option", "", s);
      opt.value = s;
      if (s === task.status) opt.selected = true;
      select.appendChild(opt);
    });
    controls.appendChild(select);

    var editBtn = el("button", "", "Edit");
    editBtn.type = "button";
    editBtn.setAttribute("data-action", "edit");
    editBtn.setAttribute("aria-label", "Edit task: " + task.title);
    controls.appendChild(editBtn);

    var delBtn = el("button", "danger", "Delete");
    delBtn.type = "button";
    delBtn.setAttribute("data-action", "delete");
    delBtn.setAttribute("aria-label", "Delete task: " + task.title);
    controls.appendChild(delBtn);

    li.appendChild(controls);
    return li;
  }

  function render() {
    var shown = visibleTasks();
    listEl.textContent = "";
    shown.forEach(function (t) { listEl.appendChild(buildTaskItem(t)); });

    countEl.textContent = "Showing " + shown.length + " of " + tasks.length +
      (tasks.length === 1 ? " task" : " tasks");

    if (shown.length === 0) {
      emptyEl.hidden = false;
      emptyEl.textContent = tasks.length === 0
        ? "No tasks yet. Add one above or restore the sample data."
        : "No tasks match the current search and filter.";
    } else {
      emptyEl.hidden = true;
    }
  }

  // ---------- Form handling ----------
  function startEditing(task) {
    editingId = task.id;
    editingTitle = task.title;
    titleInput.value = task.title;
    assigneeInput.value = task.assignee === "Unassigned" ? "" : task.assignee;
    dueInput.value = task.dueDate;
    statusInput.value = task.status;
    formHeading.textContent = "Edit task";
    submitBtn.textContent = "Save changes";
    cancelBtn.hidden = false;
    clearError();
    showMessage("");
    render();
    titleInput.focus();
    form.scrollIntoView({ block: "nearest" });
  }

  function stopEditing() {
    editingId = null;
    editingTitle = "";
    form.reset();
    statusInput.value = "Pending";
    formHeading.textContent = "Add a task";
    submitBtn.textContent = "Add task";
    cancelBtn.hidden = true;
    clearError();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    showMessage("");

    var title = titleInput.value.trim() || titleInput.value;
    var due = dueInput.value;
    var status = statusInput.value;

    if (title === "") {
      showError("Enter a task title. Titles cannot be blank or only spaces.", titleInput);
      return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
      showError("Shorten the title to " + MAX_TITLE_LENGTH + " characters or fewer.", titleInput);
      return;
    }
    if (due !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
      showError("Enter the due date as a valid date.", dueInput);
      return;
    }
    if (STATUSES.indexOf(status) === -1) {
      showError("Choose Pending, In Progress, or Completed.", statusInput);
      return;
    }

    var fields = {
      title: title,
      assignee: assigneeInput.value.trim() || "Unassigned",
      dueDate: due,
      status: status
    };

    if (editingId !== null) {
      var target = tasks.filter(function (t) { return t.title === editingTitle; })[0];
      if (!target) {
        stopEditing();
        showError("That task no longer exists, so nothing was changed.");
        render();
        return;
      }
      target.title = fields.title;
      target.assignee = fields.assignee;
      target.dueDate = fields.dueDate;
      target.status = fields.status;
      saveTasks();
      stopEditing();
      showMessage("Task updated.");
    } else {
      tasks.push({ id: newId(), title: fields.title, assignee: fields.assignee, dueDate: fields.dueDate, status: fields.status });
      saveTasks();
      stopEditing();
      showMessage("Task added.");
    }
    render();
    titleInput.focus();
  });

  titleInput.addEventListener("input", clearError);

  cancelBtn.addEventListener("click", function () {
    stopEditing();
    showMessage("Edit cancelled.");
    render();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && editingId !== null) cancelBtn.click();
  });

  // ---------- List actions (event delegation) ----------
  listEl.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-action]");
    var item = event.target.closest("li[data-id]");
    if (!button || !item) return;

    var task = findTask(item.getAttribute("data-id"));
    if (!task) { render(); return; } // stale row: ignore safely

    if (button.getAttribute("data-action") === "edit") {
      startEditing(task);
    } else if (button.getAttribute("data-action") === "delete") {
      if (filterSelect.value !== "All") {
        tasks.splice(visibleTasks().indexOf(task), 1);
      } else {
        tasks = tasks.filter(function (t) { return t.id !== task.id; });
      }
      if (editingId === task.id) stopEditing();
      saveTasks();
      showMessage("Task deleted.");
      render();
      countEl.focus();
    }
  });

  listEl.addEventListener("change", function (event) {
    var select = event.target.closest("select[data-action='status']");
    var item = event.target.closest("li[data-id]");
    if (!select || !item) return;

    var id = item.getAttribute("data-id");
    var task = findTask(id);
    if (!task || STATUSES.indexOf(select.value) === -1) { render(); return; }

    task.status = select.value;
    saveTasks();
    showMessage("Status changed to " + task.status + ".");
    if (editingId === id) statusInput.value = task.status;
    render();
    var again = listEl.querySelector("li[data-id='" + id + "'] select");
    if (again) again.focus();
  });

  // ---------- Search and filter ----------
  searchInput.addEventListener("input", render);
  filterSelect.addEventListener("change", render);

  // ---------- Reset tools ----------
  restoreBtn.addEventListener("click", function () {
    tasks = sampleTasks();
    stopEditing();
    searchInput.value = "";
    filterSelect.value = "All";
    saveTasks();
    showMessage("Sample data restored.");
    render();
  });

  clearBtn.addEventListener("click", function () {
    tasks = [];
    stopEditing();
    searchInput.value = "";
    filterSelect.value = "All";
    saveTasks();
    showMessage("All tasks cleared.");
    render();
  });

  // ---------- Start ----------
  tasks = loadTasks();
  saveTasks();
  render();
})();
