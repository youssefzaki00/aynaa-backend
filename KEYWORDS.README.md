GET /keywords?lastSync&categoryId,user,admin
  - lastSync: returns keywords created/updated after timestamp + deletedKeywordIds for soft-deleted keywords
POST /keywords admin
PATCH /keywords admin
DELETE /keywords admin (soft delete — sets deletedAt)
