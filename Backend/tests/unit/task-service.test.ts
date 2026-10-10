import test from "node:test";
import assert from "node:assert/strict";
import { TaskService } from "@/lib/services/TaskService";
import { SkylineError } from "@/lib/api/errors";

test("TaskService - Permissions & Workflow Invariants", async (t) => {
  // Test double for Prisma
  const mockTasks: any[] = [];
  const mockStaff: any[] = [
    { id: "staff-1", activityId: "act-1", userId: "volunteer-1", capability: "volunteer" },
  ];

  const fakePrisma: any = {
    activityStaff: {
      findFirst: async ({ where }: any) => {
        return mockStaff.find(
          (s) => s.activityId === where.activityId && s.userId === where.userId
        ) || null;
      },
      findMany: async ({ where }: any) => {
        return mockStaff.filter((s) => s.userId === where.userId);
      },
    },
    task: {
      findMany: async ({ where }: any) => {
        if (!where || Object.keys(where).length === 0) return mockTasks;
        return mockTasks.filter((t) => {
          if (where.activityId && t.activityId !== where.activityId) return false;
          if (where.OR) {
            const matchesAssignee = where.OR.some(
              (o: any) => o.assigneeId && o.assigneeId === t.assigneeId
            );
            const matchesActivity = where.OR.some(
              (o: any) => o.activityId?.in && o.activityId.in.includes(t.activityId)
            );
            return matchesAssignee || matchesActivity;
          }
          return true;
        });
      },
      findUnique: async ({ where }: any) => {
        return mockTasks.find((t) => t.id === where.id) || null;
      },
      create: async ({ data }: any) => {
        const newTask = {
          id: `task-${mockTasks.length + 1}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockTasks.push(newTask);
        return newTask;
      },
      update: async ({ where, data }: any) => {
        const idx = mockTasks.findIndex((t) => t.id === where.id);
        if (idx === -1) throw new Error("Task not found");
        mockTasks[idx] = { ...mockTasks[idx], ...data, updatedAt: new Date() };
        return mockTasks[idx];
      },
    },
  };

  const service = new TaskService();
  // Patch prisma client on service
  (service as any).prisma = fakePrisma;
  // Replace global prisma proxy for this test execution
  const originalPrisma = (globalThis as any).prismaGlobal;
  (globalThis as any).prismaGlobal = fakePrisma;

  await t.test("officer can create tasks for any activity", async () => {
    const task = await service.createTask(
      { id: "officer-1", isOfficer: true },
      {
        activityId: "act-1",
        title: "Setup Registration Desk",
        description: "Arrange badges and QR scanners",
      }
    );
    assert.equal(task.title, "Setup Registration Desk");
    assert.equal(task.status, "open");
  });

  await t.test("activity staff can create tasks for their assigned activity", async () => {
    const task = await service.createTask(
      { id: "volunteer-1", isOfficer: false },
      {
        activityId: "act-1",
        title: "Coordinate stage lighting",
      }
    );
    assert.equal(task.title, "Coordinate stage lighting");
  });

  await t.test("unauthorized student cannot create tasks for an activity", async () => {
    await assert.rejects(
      async () => {
        await service.createTask(
          { id: "random-student", isOfficer: false },
          {
            activityId: "act-1",
            title: "Unauthorized Task",
          }
        );
      },
      (err: any) => {
        assert(err instanceof SkylineError);
        assert.equal(err.code, "FORBIDDEN");
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  await t.test("assignee can transition task status from open to done", async () => {
    // Assign task-1 to volunteer-2
    await service.assignTask({ id: "officer-1", isOfficer: true }, "task-1", "volunteer-2");

    const updated = await service.updateTask(
      { id: "volunteer-2", isOfficer: false },
      "task-1",
      { status: "done" }
    );
    assert.equal(updated.status, "done");
  });

  await t.test("assignee without officer privileges cannot edit task title", async () => {
    await assert.rejects(
      async () => {
        await service.updateTask(
          { id: "volunteer-2", isOfficer: false },
          "task-1",
          { title: "Hacked title", status: "in_progress" }
        );
      },
      (err: any) => {
        assert(err instanceof SkylineError);
        assert.equal(err.code, "FORBIDDEN");
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  (globalThis as any).prismaGlobal = originalPrisma;
});
