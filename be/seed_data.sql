-- Insertar datos de prueba en la tabla reservations
INSERT INTO reservations (field_id, client_name, client_email, client_phone, start_time, end_time, total_price, status)
VALUES 
  (1, 'Juan García', 'juan@example.com', '3001234567', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 50000, 'confirmed'),
  (2, 'María López', 'maria@example.com', '3009876543', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1.5 hours', 45000, 'pending'),
  (3, 'Carlos Ramírez', 'carlos@example.com', '3005554444', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '2 hours', 80000, 'confirmed');