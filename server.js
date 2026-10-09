import express from "express";
import morgan from "morgan";
import apiRouter from "./routes/api.js";
import entriesRouter from "./routes/entries.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.static("public"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(morgan("dev"));

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

app.get("/", (req, res) => {
  res.send("Hello, web!");
});

app.get("/about", (req, res) => {
  res.render("about", { title: "About" });
});

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

app.get("/events", (req, res) => {
  res.render("events", { title: "Events", events });
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
  const responses = await Promise.all(
    ids.map((id) => fetch(`https://jsonplaceholder.typicode.com/posts/${id}`)),
  );
  const posts = await Promise.all(responses.map((response) => response.json()));
  const titles = posts.map((post) => post.title);
  res.status(200).json({ titles });
});

app.use("/entries", entriesRouter);

app.use("/api", apiRouter);

app.use((req, res) => {
  res
    .status(404)
    .render("error", { title: "Not found", message: "Page not found." });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong.");
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
// work in progress
