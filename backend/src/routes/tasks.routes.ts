import { Router } from "express";
import { requireAuth, getCurrentUser } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

const VALID_STATUSES = ["BACKLOG", "IN_PROGRESS", "DONE", "CANCELLED"] as const;

const router = Router();

router.use(requireAuth);

router.patch("/:id", async (req, res) => {
  const user = getCurrentUser(req);
  const { status } = req.body as { status?: string };
  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    return;
  }
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, project: { ownerId: user.id } },
  });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const updated = await prisma.task.update({
    where: { id: req.params.id },
    data: { status: status as (typeof VALID_STATUSES)[number] },
  });
  res.json(updated);
});

export default router;
