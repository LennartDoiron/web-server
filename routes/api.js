import { Router } from "express";

const router = Router();

router.get("/info", (req, res) => {
  res.json({
    site: "Portfolio",
    course: "COMPSCI 326",
    version: "1.0.0",
  });
});

router.get("/status", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

router.get("/error", (req, res) => {
  res.status(400).send("Bad request.");
});

export default router;
