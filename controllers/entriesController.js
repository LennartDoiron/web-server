import * as entriesService from "../services/entriesService.js";
import { isValidId } from "../repositories/entriesRepository.js";

export const index = async (req, res) => {
  const entries = await entriesService.listEntries();
  res.set("Cache-Control", "no-cache");
  res.set("X-Total-Count", entries.length);
  res.status(200).render("entries", { title: "My Notes", entries });
};

export const show = async (req, res) => {
  const { id } = req.params;
  const result = isValidId(id) ? await entriesService.getEntry(id) : null;
  if (!result?.ok) {
    res
      .status(404)
      .render("error", { title: "Not found", message: "Entry not found." });
    return;
  }
  res.render("entry", { title: result.value.title, entry: result.value });
};

export const create = async (req, res) => {
  const result = await entriesService.createEntry(req.body ?? {});
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(201).json(result.value);
};

export const createClassic = async (req, res) => {
  const result = await entriesService.createEntry(req.body ?? {});
  if (!result.ok) {
    res.status(result.error.status).send(result.error.message);
    return;
  }
  res.redirect("/entries");
};

export const update = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    res.status(400).json({ error: "id must be a valid id" });
    return;
  }
  const result = await entriesService.updateEntry(id, req.body ?? {});
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.value);
};

export const toggleFavorite = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    res.status(400).json({ error: "id must be a valid id" });
    return;
  }
  const result = await entriesService.toggleFavorite(id);
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.value);
};

export const destroy = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    res.status(400).json({ error: "id must be a valid id" });
    return;
  }
  const result = await entriesService.deleteEntry(id);
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(204).send();
};
