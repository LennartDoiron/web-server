import { Router } from "express";
import { readFile, writeFile } from "fs/promises";
import { Ok, Err, Some, None } from "../result.js";

const router = Router();
const DATA_FILE = "entries.json";

const asyncHandler = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

let queue = Promise.resolve();
function withLock(fn) {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

const validateEntry = ({ title, body }) => {
  if (!title || !body) return Err("title and body are required");
  return Ok({ title, body });
};

const findEntryById = (entries, id) => {
  const entry = entries[id];
  return entry ? Some(entry) : None;
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const entries = await withLock(async () =>
      JSON.parse(await readFile(DATA_FILE, "utf-8")),
    );
    res.set("Cache-Control", "no-cache");
    res.set("X-Total-Count", entries.length);
    res.status(200).render("entries", { title: "My Notes", entries });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const entries = await withLock(async () =>
      JSON.parse(await readFile(DATA_FILE, "utf-8")),
    );
    const index = Number(req.params.id);
    const entry = Number.isInteger(index) ? entries[index] : undefined;

    if (!entry) {
      res
        .status(404)
        .render("error", { title: "Not found", message: "Entry not found." });
      return;
    }

    res.render("entry", { title: entry.title, entry });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = validateEntry(req.body ?? {});
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    await withLock(async () => {
      const entries = JSON.parse(await readFile(DATA_FILE, "utf-8"));
      entries.push(result.value);
      await writeFile(DATA_FILE, JSON.stringify(entries));
    });
    res.status(201).json(result.value);
  }),
);

router.post(
  "/classic",
  asyncHandler(async (req, res) => {
    const result = validateEntry(req.body ?? {});
    if (!result.ok) {
      res.status(400).send(result.error);
      return;
    }
    await withLock(async () => {
      const entries = JSON.parse(await readFile(DATA_FILE, "utf-8"));
      entries.push(result.value);
      await writeFile(DATA_FILE, JSON.stringify(entries));
    });
    res.redirect("/entries");
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const result = validateEntry(req.body ?? {});
    const found = await withLock(async () => {
      const entries = JSON.parse(await readFile(DATA_FILE, "utf-8"));
      const lookup = findEntryById(entries, id);
      if (lookup.some && result.ok) {
        entries[id] = result.value;
        await writeFile(DATA_FILE, JSON.stringify(entries));
      }
      return lookup;
    });
    if (!found.some) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(200).json(result.value);
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const found = await withLock(async () => {
      const entries = JSON.parse(await readFile(DATA_FILE, "utf-8"));
      const lookup = findEntryById(entries, id);
      if (lookup.some) {
        entries.splice(id, 1);
        await writeFile(DATA_FILE, JSON.stringify(entries));
      }
      return lookup;
    });
    if (!found.some) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    res.status(204).send();
  }),
);

export default router;
