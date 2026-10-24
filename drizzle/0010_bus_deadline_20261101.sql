-- Update the bus deadline in existing CMS data as well.
-- Preserve other settings and their edit history.
UPDATE content_settings
SET history = (
  SELECT json_group_array(json(entry)) FROM (
    SELECT json_object('data', json(content_settings.data), 'date', content_settings.updated) AS entry
    UNION ALL
    SELECT value AS entry FROM json_each(content_settings.history)
    LIMIT 30
  )
),
data = json_set(data, '$.busDeadline', '2026-11-01'),
updated = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'main' AND json_extract(data, '$.busDeadline') = '2026-10-25';
--> statement-breakpoint
-- Correct current bus news without triggering new notifications.
UPDATE updates
SET body = replace(body, '25.10.2026', '01.11.2026')
WHERE archived = 0 AND body LIKE '%Bus%' AND instr(body, '25.10.2026') > 0;
