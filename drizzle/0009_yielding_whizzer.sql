ALTER TABLE `plans` ADD `car_capacity` integer;
--> statement-breakpoint
-- Enforce the total capacity inside the transaction, including simultaneous requests.
CREATE TRIGGER plans_capacity_insert AFTER INSERT ON plans BEGIN
  SELECT RAISE(ABORT, 'Die Zahl der Mitfahrenden überschreitet die Gesamtzahl der Plätze')
  WHERE EXISTS (SELECT 1 FROM plans driver WHERE driver.car_capacity IS NOT NULL
    AND driver.mode='Auto' AND driver.car_role='Ich fahre selbst'
    AND (SELECT COUNT(*) FROM plans passenger WHERE passenger.car_driver=driver.member_id
      AND passenger.mode='Auto' AND passenger.car_role='Ich möchte mitfahren') > driver.car_capacity);
END;
--> statement-breakpoint
CREATE TRIGGER plans_capacity_update AFTER UPDATE ON plans BEGIN
  SELECT RAISE(ABORT, 'Die Zahl der Mitfahrenden überschreitet die Gesamtzahl der Plätze')
  WHERE EXISTS (SELECT 1 FROM plans driver WHERE driver.car_capacity IS NOT NULL
    AND driver.mode='Auto' AND driver.car_role='Ich fahre selbst'
    AND (SELECT COUNT(*) FROM plans passenger WHERE passenger.car_driver=driver.member_id
      AND passenger.mode='Auto' AND passenger.car_role='Ich möchte mitfahren') > driver.car_capacity);
END;
