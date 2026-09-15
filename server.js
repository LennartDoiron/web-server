import express from "express";

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Hello, web!");
});

app.get("");

app.get("/about", (req, res) => {
  res.send("This is a web programming course.");
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
