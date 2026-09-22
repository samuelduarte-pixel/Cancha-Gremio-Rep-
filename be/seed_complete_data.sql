-- Insertar usuarios
INSERT INTO users (name, email, phone, password, role, is_active)
VALUES 
  ('Juan García', 'juan@example.com', '3001234567', 'hashed_password_123', 'CLIENT', true),
  ('María López', 'maria@example.com', '3009876543', 'hashed_password_456', 'CLIENT', true),
  ('Carlos Ramírez', 'carlos@example.com', '3005554444', 'hashed_password_789', 'ADMIN', true);

-- Insertar canchas/campos
INSERT INTO fields (name, description, price_per_hour, surface_type, capacity, length_meters, width_meters)
VALUES 
  ('Cancha Premium', 'Cancha sintética de primer nivel', 50000, 'SYNTHETIC', 10, 40, 20),
  ('Cancha Clásica', 'Cancha tradicional de cemento', 30000, 'CEMENT', 8, 35, 18),
  ('Cancha Natural', 'Cancha con pasto natural', 40000, 'NATURAL', 10, 40, 20);

-- Insertar reservaciones vinculadas
INSERT INTO reservations (user_id, field_id, client_name, client_email, client_phone, start_time, end_time, total_price, status)
VALUES 
  (1, 1, 'Juan García', 'juan@example.com', '3001234567', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 50000, 'confirmed'),
  (2, 2, 'María López', 'maria@example.com', '3009876543', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1.5 hours', 45000, 'pending'),
  (3, 3, 'Carlos Ramírez', 'carlos@example.com', '3005554444', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '2 hours', 80000, 'confirmed');
