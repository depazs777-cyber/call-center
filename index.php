<?php
// index.php

// Enable CORS if needed (e.g. for local development or separate frontend domains)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit; // Handle preflight requests
}

$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// For built-in PHP server handling
if (php_sapi_name() === 'cli-server') {
    $base_path = '';
} else {
    // Base path handling dynamically
    $base_path = dirname($_SERVER['SCRIPT_NAME']);
    if ($base_path === '/' || $base_path === '\\') {
        $base_path = '';
    }
}

// Remove base path from request URI if it exists
if (!empty($base_path) && strpos($request_uri, $base_path) === 0) {
    $request_uri = substr($request_uri, strlen($base_path));
}

// Ensure $request_uri starts with a slash
if (empty($request_uri)) {
    $request_uri = '/';
}

// Redirect root or index.php directly to public/index.html
if ($request_uri === '/' || $request_uri === '/index.php') {
    require_once __DIR__ . '/public/index.html';
    exit;
}

// Route API requests
if (preg_match('/^\/api\/(.*)$/', $request_uri, $matches)) {
    $api_route = $matches[1];

    // Auth route handled separately above or in its file
    if ($api_route === 'login') {
        require_once __DIR__ . '/api/auth.php';
        exit;
    }

    // Determine the API file based on the route
    $api_file = __DIR__ . '/api/' . explode('/', $api_route)[0] . '.php';

    if (file_exists($api_file)) {
        require_once $api_file;
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found: ' . $api_route]);
    }
    exit;
}

// Serve frontend assets or main index.html for SPA
$public_path = __DIR__ . $request_uri;

// Serve static files from /public directly if they exist
if (file_exists($public_path) && is_file($public_path)) {
    // Basic MIME type handling
    $ext = pathinfo($public_path, PATHINFO_EXTENSION);
    $mime_types = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'svg' => 'image/svg+xml'
    ];
    if (array_key_exists($ext, $mime_types)) {
        header('Content-Type: ' . $mime_types[$ext]);
    }
    readfile($public_path);
    exit;
}

// Serve uploaded files if requested
if (preg_match('/^\/uploads\/(.*)$/', $request_uri, $matches)) {
    $upload_path = __DIR__ . '/uploads/' . $matches[1];
    if (file_exists($upload_path) && is_file($upload_path)) {
        // Simple security: prevent directory traversal
        if (strpos(realpath($upload_path), realpath(__DIR__ . '/uploads')) === 0) {
            $ext = pathinfo($upload_path, PATHINFO_EXTENSION);
            $mime_types = [
                'webm' => 'audio/webm',
                'mp3' => 'audio/mpeg',
                'pdf' => 'application/pdf',
                'txt' => 'text/plain'
            ];
            if (array_key_exists($ext, $mime_types)) {
                header('Content-Type: ' . $mime_types[$ext]);
            } else {
                header('Content-Type: application/octet-stream');
            }
            readfile($upload_path);
            exit;
        }
    }
    http_response_code(404);
    echo 'File not found';
    exit;
}

// SPA fallback: serve index.html for any other route
require_once __DIR__ . '/public/index.html';
?>