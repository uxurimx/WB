
#backup
pg_dump "postgresql://neondb_owner:npg_0NZ5GatXuEHn@ep-jolly-poetry-anlowc15-pooler.c-6.us-east-1.aws.neon.tech/neondb" > wb_5jun2026.sql


# restore:
psql "postgresql://neondb_owner:npg_zMa8xVGubod7@ep-dark-breeze-aphl70e9-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require" < wb_5jun2026.sql


