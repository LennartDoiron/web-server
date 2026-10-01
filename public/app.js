const form = document.querySelector("#entry-form");
const list = document.querySelector("#entries");

const buildItem = (entry) => {
  const id = list.children.length;
  const item = document.createElement("li");
  item.dataset.id = id;

  const text = document.createElement("span");
  const title = document.createElement("strong");
  const link = document.createElement("a");
  link.href = `/entries/${id}`;
  link.textContent = entry.title;
  title.append(link, ":");
  text.append(title, ` ${entry.body}`);

  const button = document.createElement("button");
  button.className = "delete-btn";
  button.type = "button";
  button.textContent = "Delete";

  item.append(text, button);
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

list.addEventListener("click", async (event) => {
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
