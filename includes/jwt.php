<?php
// includes/jwt.php

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}

function generate_jwt($user_id, $rol) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $user_id,
        'rol' => $rol,
        'exp' => time() + 3600 // Expira en 1 hora
    ]);

    $base64UrlHeader = base64url_encode($header);
    $base64UrlPayload = base64url_encode($payload);

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = base64url_encode($signature);

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verify_jwt($token) {
    $parts = explode('.', $token);
    if (count($parts) != 3) {
        return false;
    }

    $header = $parts[0];
    $payload = $parts[1];
    $signatureProvided = $parts[2];

    $payloadDecoded = json_decode(base64url_decode($payload), true);
    if (!$payloadDecoded) {
        return false;
    }

    if (isset($payloadDecoded['exp']) && $payloadDecoded['exp'] < time()) {
        return false; // Expirado
    }

    $signatureExpected = hash_hmac('sha256', $header . "." . $payload, JWT_SECRET, true);
    $base64UrlSignatureExpected = base64url_encode($signatureExpected);

    if (hash_equals($base64UrlSignatureExpected, $signatureProvided)) {
        return $payloadDecoded;
    }

    return false;
}
?>