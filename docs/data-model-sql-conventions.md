# Data model and SQL style conventions

Based on [SQL Style Guide](https://www.sqlstyle.guide/#naming-conventions) and Django/Python naming conventions, this document attempts to capture our conventions
for data model naming and usage.

- Following [Python naming conventions](https://www.python.org/dev/peps/pep-0008/#naming-conventions) is preferred.
  That means snake_case for model attributes (columns) and CapCase for classes (which are translated to snake_case when Django generates SQL).
- All names should be less than 64 characters (the MySQL limit)
- Avoid abbreviations when possible, but if you use them, use them consistently
- Prefer lowercase, as letter sequences are easier to read
- Table names are plural
- Column names are singular
- Do not duplicate the table name as a column name prefix
- Internal primary key column is always named `id` per [Django convention](https://docs.djangoproject.com/en/3.2/topics/db/models/#automatic-primary-key-fields)
- If a table requires an externally visible unique identifier, prefer [UUID](https://docs.djangoproject.com/en/3.2/ref/models/fields/#uuidfield) with a unique index constraint
- If a column has a foreign key constraint, it should be named with a `_id` suffix. Django definition does **not** include the `_id` suffix. E.g. `swa = models.ForeignKey()` will result
  in SQL column named `swa_id`.
- If a column is a timestamp type, use the suffix `_at` with a root word indicating the action (e.g. `created_at`, `deleted_at`, etc).
- If a column refers to an external system identifier (**not** a FK), use the `_xid` suffix
- When explicitly named, index names should use the `_idx` suffix and include as many of the indexed column names as possible within name length constraints (64 characters)
