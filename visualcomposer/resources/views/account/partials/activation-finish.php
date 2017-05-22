<?php
if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

$optionsHelper = vchelper('Options');
$tokenHelper = vchelper('Token');
?>
Hi from Activation Finish Page!

<?php
var_export(
    [
        'isSiteRegistered' => $tokenHelper->isSiteRegistered(),
        'isSiteAuthorized' => $tokenHelper->isSiteAuthorized(),
        'getToken' => $tokenHelper->getToken(),
        'privateInformation' => [
            'site-id' => $optionsHelper->get('siteId'),
            'site-secret' => $optionsHelper->get('siteSecret'),
            'site-auth-state' => $optionsHelper->get('siteAuthState'),
            'site-auth-token' => $optionsHelper->get('siteAuthToken'),
            'site-auth-token-ttl' => $optionsHelper->get('siteAuthTokenTtl'),
            'site-auth-refresh-token' => $optionsHelper->get('siteAuthRefreshToken'),
        ],
    ]
);

?>

<div class="">
    <a href="<?php echo $tokenHelper->getTokenActivationUrl(); ?>" class="">
        <?php echo __('Activate Visual Composer', 'vcwb') ?>
    </a>
</div>
