import { Ok, Err } from "../result.js";
import {
  getAll,
  findById,
  create,
  updateById,
  removeById,
} from "../repositories/entriesRepository.js";
import { toEntryDto } from "../dtos/entryDto.js";

const validateEntry = ({ title, body }) => {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";
  const trimmedBody = typeof body === "string" ? body.trim() : "";
  if (!trimmedTitle || !trimmedBody) {
    return Err({ status: 400, message: "title and body are required" });
  }
  return Ok({ title: trimmedTitle, body: trimmedBody });
};

export const listEntries = async () => (await getAll()).map(toEntryDto);

export const getEntry = async (id) => {
  const entry = await findById(id);
  if (!entry) return Err({ status: 404, message: "Entry not found" });
  return Ok(toEntryDto(entry));
};

export const createEntry = async (data) => {
  const result = validateEntry(data);
  if (!result.ok) return result;
  return Ok(toEntryDto(await create(result.value)));
};

export const updateEntry = async (id, data) => {
  const existing = await findById(id);
  if (!existing) return Err({ status: 404, message: "Entry not found" });

  const result = validateEntry(data);
  if (!result.ok) return result;
  return Ok(toEntryDto(await updateById(id, result.value)));
};

export const toggleFavorite = async (id) => {
  const existing = await findById(id);
  if (!existing) return Err({ status: 404, message: "Entry not found" });
  return Ok(toEntryDto(await updateById(id, { favorite: !existing.favorite })));
};

export const deleteEntry = async (id) => {
  const existing = await findById(id);
  if (!existing) return Err({ status: 404, message: "Entry not found" });
  await removeById(id);
  return Ok(null);
};
