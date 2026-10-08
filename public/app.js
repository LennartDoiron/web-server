const form = document.querySelector("#entry-form");
const list = document.querySelector("#entries");

const buildItem = (entry) => {
  const id = list.children.length;
  const item = document.createElement("li");
  item.dataset.id = id;
  item.dataset.title = entry.title;
  item.dataset.body = entry.body;

  const text = document.createElement("span");
  const title = document.createElement("strong");
  text.className = "entry-display";
  const link = document.createElement("a");
  link.href = `/entries/${id}`;
  link.textContent = entry.title;
  title.append(link, ":");
  text.append(title, ` ${entry.body}`);

  const button = document.createElement("button");
  button.className = "delete-btn";
  button.type = "button";
  button.textContent = "Delete";

  const editButton = document.createElement("button");
  editButton.className = "edit-btn";
  editButton.type = "button";
  editButton.textContent = "Edit";

  item.append(text, editButton, button);
  return item;
};

const renumber = () => {
  [...list.children].forEach((item, index) => {
    item.dataset.id = index;
    const link = item.querySelector("a");
    if (link) link.href = `/entries/${index}`;
  });
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const entry = Object.fromEntries(data);

  const response = await fetch("/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    const { error } = await response.json();
    alert(error);
    return;
  }

  const saved = await response.json();
  list.append(buildItem(saved));
  document.querySelector("#no-entries")?.remove();

  form.reset();
});

const fillDisplay = (display, entry, id) => {
  const title = document.createElement("strong");
  const link = document.createElement("a");
  link.href = `/entries/${id}`;
  link.textContent = entry.title;
  title.append(link, ":");
  display.replaceChildren(title, ` ${entry.body}`);
};

const makeInput = (name, value) => {
  const input = document.createElement("input");
  input.type = "text";
  input.name = name;
  input.value = value;
  return input;
};

const startEdit = (item) => {
  const display = item.querySelector(".entry-display");
  const buttons = item.querySelectorAll(".edit-btn, .delete-btn");

  const editForm = document.createElement("form");
  editForm.className = "edit-form";
  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "Save";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "cancel-btn";
  cancel.textContent = "Cancel";
  editForm.append(
    makeInput("title", item.dataset.title),
    makeInput("body", item.dataset.body),
    save,
    cancel,
  );

  display.replaceWith(editForm);
  buttons.forEach((button) => {
    button.hidden = true;
  });

  const close = () => {
    fillDisplay(display, item.dataset, item.dataset.id);
    editForm.replaceWith(display);
    buttons.forEach((button) => {
      button.hidden = false;
    });
  };

  cancel.addEventListener("click", close);

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const entry = Object.fromEntries(new FormData(editForm));

    save.disabled = true;
    try {
      const response = await fetch(`/entries/${item.dataset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
        signal: AbortSignal.timeout(5000),
      });

      // Home Exercise: the entry was deleted elsewhere, so remove its stale form.
      if (response.status === 404) {
        item.remove();
        renumber();
        return;
      }

      if (!response.ok) {
        const { error } = await response.json();
        alert(error);
        return;
      }

      const saved = await response.json();
      item.dataset.title = saved.title;
      item.dataset.body = saved.body;
      close();
    } catch {
      alert(
        "Your changes were not saved: the server did not answer properly. Please try again.",
      );
    } finally {
      save.disabled = false;
    }
  });
};

list.addEventListener("click", async (event) => {
  if (event.target.matches(".edit-btn")) {
    startEdit(event.target.closest("li"));
    return;
  }

  if (!event.target.matches(".delete-btn")) return;

  const button = event.target;
  const item = button.closest("li");
  const id = item.dataset.id;

  button.disabled = true;
  try {
    const response = await fetch(`/entries/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const { error } = await response.json();
      alert(error);
      button.disabled = false;
      return;
    }
    item.remove();
    renumber();
  } catch {
    button.disabled = false;
  }
});
