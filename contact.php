<?php
header('Content-Type: application/json; charset=utf-8');

// Bloquear acceso directo
if (php_sapi_name() === 'cli') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso no permitido']);
    exit;
}

// Honeypot
if (!empty($_POST['website'])) {
    echo json_encode(['success' => true]);
    exit;
}

// Validar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

function sanitize($str) {
    return htmlspecialchars(strip_tags(trim($str ?? '')), ENT_QUOTES, 'UTF-8');
}

$nombre    = sanitize($_POST['nombre'] ?? '');
$apellidos = sanitize($_POST['apellidos'] ?? '');
$email     = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
$telefono  = sanitize($_POST['telefono'] ?? '');
$servicio  = sanitize($_POST['servicio'] ?? '');
$mensaje   = sanitize($_POST['mensaje'] ?? '');

// Validaciones
if (!$nombre || !$email || !$telefono || !$servicio || !$mensaje) {
    echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Email no válido']);
    exit;
}
if (strlen($mensaje) < 10) {
    echo json_encode(['success' => false, 'message' => 'Mensaje demasiado corto']);
    exit;
}

// Configuración
$to = 'amservicegroup@proton.me';
$subject = "Nuevo presupuesto · {$servicio} · {$nombre}";

$body = "Has recibido una nueva solicitud de presupuesto:\n\n";
$body .= "Nombre: {$nombre} {$apellidos}\n";
$body .= "Email: {$email}\n";
$body .= "Teléfono: {$telefono}\n";
$body .= "Servicio: {$servicio}\n\n";
$body .= "Mensaje:\n{$mensaje}\n\n";
$body .= "--\nEnviado desde el formulario web · " . date('Y-m-d H:i:s');

$headers = [
    'From: noreply@amservicegroup.es',
    "Reply-To: {$email}",
    'X-Mailer: PHP/' . phpversion(),
    'Content-Type: text/plain; charset=UTF-8'
];

@mail($to, $subject, $body, implode("\r\n", $headers));

echo json_encode(['success' => true, 'message' => 'Mensaje enviado correctamente']);
