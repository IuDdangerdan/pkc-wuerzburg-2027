ALTER TABLE `plans` ADD `private_place` text DEFAULT '' NOT NULL;
--> statement-breakpoint
-- Eine Zimmerzuordnung pro Person, auch bei unterschiedlichen Reisedaten.
CREATE TRIGGER rooms_single_insert BEFORE INSERT ON rooms BEGIN
  SELECT RAISE(ABORT, 'Pro Person ist nur eine Unterkunft möglich')
  WHERE EXISTS (SELECT 1 FROM rooms other, json_each(other.member_ids) occupant, json_each(NEW.member_ids) chosen
    WHERE other.id<>NEW.id AND occupant.value=chosen.value);
  SELECT RAISE(ABORT, 'Private Unterkunft und Zimmerzuordnung schließen sich aus')
  WHERE EXISTS (SELECT 1 FROM plans p, json_each(NEW.member_ids) chosen
    WHERE p.member_id=chosen.value AND p.status='Privat organisiert');
END;
--> statement-breakpoint
-- Eine Zimmerzuordnung pro Person, auch bei unterschiedlichen Reisedaten.
CREATE TRIGGER rooms_single_update BEFORE UPDATE ON rooms BEGIN
  SELECT RAISE(ABORT, 'Pro Person ist nur eine Unterkunft möglich')
  WHERE EXISTS (SELECT 1 FROM rooms other, json_each(other.member_ids) occupant, json_each(NEW.member_ids) chosen
    WHERE other.id<>NEW.id AND occupant.value=chosen.value);
  SELECT RAISE(ABORT, 'Private Unterkunft und Zimmerzuordnung schließen sich aus')
  WHERE EXISTS (SELECT 1 FROM plans p, json_each(NEW.member_ids) chosen
    WHERE p.member_id=chosen.value AND p.status='Privat organisiert');
END;
--> statement-breakpoint
CREATE TRIGGER plans_private_insert BEFORE INSERT ON plans WHEN NEW.status='Privat organisiert' BEGIN
  SELECT RAISE(ABORT, 'Private Unterkunft und Zimmerzuordnung schließen sich aus')
  WHERE EXISTS (SELECT 1 FROM rooms r, json_each(r.member_ids) occupant WHERE occupant.value=NEW.member_id);
END;
--> statement-breakpoint
CREATE TRIGGER plans_private_update BEFORE UPDATE ON plans WHEN NEW.status='Privat organisiert' BEGIN
  SELECT RAISE(ABORT, 'Private Unterkunft und Zimmerzuordnung schließen sich aus')
  WHERE EXISTS (SELECT 1 FROM rooms r, json_each(r.member_ids) occupant WHERE occupant.value=NEW.member_id);
END;
