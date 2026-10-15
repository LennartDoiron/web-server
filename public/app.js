const form = document.querySelector("#entry-form");
const list = document.querySelector("#entries");

const timedFetch = (url, options = {}) =>
  fetch(url, { ...options, signal: AbortSignal.timeout(5000) });

const fetchJSON = async (url, options) => {
  let response;
  try {
    response = await timedFetch(url, options);
  } catch (error) {
    throw new Error(
      error.name === "TimeoutError"
        ? "The server did not answer within five seconds."
        : "Could not reach the server.",
    );
  }

  let body = {};
  try {
    body = await response.json();
  } catch {}

  if (!response.ok) {
    const error = new Error(
      body.error || `The server answered ${response.status}.`,
    );
    error.status = response.status;
    throw error;
  }
  return body;
};

const buildItem = (entry) => {
  const item = document.createElement("li");
  item.dataset.id = entry.id;
  item.dataset.title = entry.title;
  item.dataset.body = entry.body;

  const text = document.createElement("span");
  const title = document.createElement("strong");
  text.className = "entry-display";
  const link = document.createElement("a");
  link.href = `/entries/${entry.id}`;
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

  const favoriteButton = document.createElement("button");
  favoriteButton.className = "favorite-btn";
  favoriteButton.type = "button";
  favoriteButton.textContent = entry.favorite ? "★" : "☆";

  item.append(text, favoriteButton, editButton, button);
  return item;
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const entry = Object.fromEntries(data);
  const button = form.querySelector("button");

  button.disabled = true;
  try {
    const saved = await fetchJSON("/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    list.append(buildItem(saved));
    document.querySelector("#no-entries")?.remove();
    form.reset();
  } catch (error) {
    alert(`Your entry was not saved. ${error.message}`);
  } finally {
    button.disabled = false;
  }
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
      const saved = await fetchJSON(`/entries/${item.dataset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      item.dataset.title = saved.title;
      item.dataset.body = saved.body;
      close();
    } catch (error) {
      if (error.status === 404) {
        item.remove();
        return;
      }
      alert(`Your changes were not saved. ${error.message}`);
    } finally {
      save.disabled = false;
    }
  });
};

list.addEventListener("click", async (event) => {
  if (event.target.matches(".favorite-btn")) {
    const favoriteButton = event.target;
    const id = favoriteButton.closest("li").dataset.id;
    try {
      const saved = await fetchJSON(`/entries/${id}/favorite`, {
        method: "PATCH",
      });
      favoriteButton.textContent = saved.favorite ? "★" : "☆";
    } catch (error) {
      alert(`That entry was not updated. ${error.message}`);
    }
    return;
  }

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
    await fetchJSON(`/entries/${id}`, { method: "DELETE" });
    item.remove();
  } catch (error) {
    alert(`That entry was not deleted. ${error.message}`);
    button.disabled = false;
  }
});
