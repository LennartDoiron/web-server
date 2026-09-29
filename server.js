import express from "express";
import apiRouter from "./routes/api.js";
import { readFile, writeFile } from "fs/promises";

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.static("public"));

app.use(express.json());

const projects = [
  { name: "Weather app", tag: "javascript" },
  { name: "Portfolio site", tag: "express" },
  { name: "Budget tracker", tag: "python" },
];

const events = [
  { title: "Career fair", date: "2026-09-24" },
  { title: "Hackathon kickoff", date: "2026-10-03" },
  { title: "Resume workshop", date: null },
];

//Unit 1

app.get("/", (req, res) => {
  res.send("Hello, web!");
});

app.get("/about", (req, res) => {
  res.render("about", { title: "About" });
});
//Unit 2

app.get("/hello/:name", (req, res) => {
  const { name } = req.params;
  res.send(`Hello, ${name}!`);
});

app.get("/repeat/:word", (req, res) => {
  const { word } = req.params;
  res.send(`${word} ${word} ${word}`);
});

app.get("/count", (req, res) => {
  const from = parseInt(req.query.from) || 1;
  const to = parseInt(req.query.to) || 10;
  res.send(`Counting from ${from} to ${to}.`);
});

app.get("/projects", (req, res) => {
  const { tag, sort } = req.query;

  let result = projects;

  if (tag) {
    result = result.filter((project) => project.tag === tag);
  }

  if (sort === "name") {
    result = [...result].sort((a, b) => a.name.localeCompare(b.name));
  }

  res.json({
    tag: tag ?? null,
    sort: sort === "name" ? "name" : null,
    count: result.length,
    projects: result,
  });
});

//Unit 3

app.get("/events", (req, res) => {
  res.render("events", { title: "Events", events });
});

app.get("/entries", async (req, res) => {
  const data = await readFile("entries.json", "utf-8");
  const entries = JSON.parse(data);
  res.set("Cache-Control", "public, max-age=60");
  res.set("X-Total-Count", entries.length);
  res.status(200).render("entries", { title: "My Notes", entries });
});

app.get("/entries/:id", async (req, res) => {
  const data = await readFile("entries.json", "utf-8");
  const entries = JSON.parse(data);
  const index = Number(req.params.id);
  const entry = Number.isInteger(index) ? entries[index] : undefined;

  if (!entry) {
    res
      .status(404)
      .render("error", { title: "Not found", message: "Entry not found." });
    return;
  }

  res.render("entry", { title: entry.title, entry });
});

//Unit 5

app.post("/entries", async (req, res) => {
  const { title, body } = req.body ?? {};
  if (!title || !body) {
    res.status(400).json({ error: "title and body are required" });
    return;
  }
  const data = await readFile("entries.json", "utf-8");
  const entries = JSON.parse(data);
  const newEntry = { title, body };
  entries.push(newEntry);
  await writeFile("entries.json", JSON.stringify(entries));
  res.status(201).json(newEntry);
});

app.delete("/entries/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const data = await readFile("entries.json", "utf-8");
  const entries = JSON.parse(data);
  if (Number.isNaN(id) || id < 0 || id >= entries.length) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  entries.splice(id, 1);
  await writeFile("entries.json", JSON.stringify(entries));
  res.status(204).send();
});

const wishlist = [];

app.post("/wishlist", (req, res) => {
  const { item, note } = req.body ?? {};
  if (!item) {
    res.status(400).json({ error: "item is required" });
    return;
  }
  const newItem = { item, note: note ?? null };
  wishlist.push(newItem);
  res.status(201).json(newItem);
});

app.get("/wishlist", (req, res) => {
  res.json(wishlist);
});

app.get("/three-posts", async (req, res) => {
  const ids = [1, 2, 3];
  const titles = [];
  for (const id of ids) {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/posts/${id}`,
    );
    const post = await response.json();
    titles.push(post.title);
  }
  res.status(200).json({ titles });
});

//The rest

app.use("/api", apiRouter);

app.use((req, res) => {
  res
    .status(404)
    .render("error", { title: "Not found", message: "Page not found." });
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
