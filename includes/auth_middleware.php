<?php
// includes/auth_middleware.php

function auth_middleware($allowed_roles = []) {
    $headers = apache_request_headers();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '');

    if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        json_response(['error' => 'Token no proporcionado o inválido'], 401);
        exit;
    }

    $token = $matches[1];
    $decoded = verify_jwt($token);

    if (!$decoded) {
        json_response(['error' => 'Token inválido o expirado'], 401);
        exit;
    }

    if (!empty($allowed_roles) && !in_array($decoded['rol'], $allowed_roles)) {
        json_response(['error' => 'No tienes permisos para acceder a este recurso'], 403);
        exit;
    }

    return $decoded;
}

function apache_request_headers_fallback() {
    $arh = array();
    $rx_http = '/\AHTTP_/';
    foreach($_SERVER as $key => $val) {
        if(preg_match($rx_http, $key)) {
            $arh_key = preg_replace($rx_http, '', $key);
            $rx_matches = array();
            $rx_matches = explode('_', $arh_key);
            if( count($rx_matches) > 0 and strlen($arh_key) > 2 ) {
                foreach($rx_matches as $ak_key => $ak_val) $rx_matches[$ak_key] = ucfirst(strtolower($ak_val));
                $arh_key = implode('-', $rx_matches);
            }
            $arh[$arh_key] = $val;
        }
    }
    return( $arh );
}
if(!function_exists('apache_request_headers')) {
    function apache_request_headers() {
        return apache_request_headers_fallback();
    }
}
?>