<?php
// includes/helpers.php

function json_response($data = null, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    if ($data !== null) {
        echo json_encode($data);
    }
    exit;
}

function get_json_input() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}
?>