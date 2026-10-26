export function logAction(client, adminId, action, entity, entityId, detail) {
  return client.auditLog.create({
    data: {
      adminId,
      action,
      entity,
      entityId: entityId ?? null,
      detail: detail ?? undefined,
    },
  });
}
