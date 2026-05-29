import { createCrudHandlers } from "@/lib/api-crud";

export const runtime = "nodejs";

export const { GET, POST, PUT, DELETE } = createCrudHandlers("class_activities");
