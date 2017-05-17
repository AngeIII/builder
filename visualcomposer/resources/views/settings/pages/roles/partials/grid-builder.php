<?php

if (!defined('ABSPATH')) {
    die('-1');
}

echo vcview(
    'settings/pages/roles/partials/part',
    [
        'part' => $part,
        'role' => $role,
        'paramsPrefix' => 'vc_roles[' . $role . '][' . $part . ']',
        'controller' => vchelper('AccessRole')->who($role)->part($part),
        'options' => [
            [true, __('Enabled', 'vcwb')],
            [true, __('Disabled', 'vcwb')],
        ],
        'mainLabel' => __('Grid Builder', 'vcwb'),
        'customLabel' => __('Grid Builder', 'vcwb'),
        'description' => __('Control user access to Grid Builder and Grid Builder Elements.', 'vcwb'),
    ]
);
