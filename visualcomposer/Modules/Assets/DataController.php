<?php

namespace VisualComposer\Modules\Assets;

if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

use VisualComposer\Framework\Container;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Options;
use VisualComposer\Helpers\Traits\EventsFilters;

class DataController extends Container implements Module
{
    use EventsFilters;

    public function __construct()
    {
        /** @see \VisualComposer\Modules\Assets\DataController::setData */
        $this->addFilter(
            'vcv:dataAjax:setData',
            'setData'
        );

        /** @see \VisualComposer\Modules\Assets\DataController::getData */
        $this->addFilter(
            'vcv:dataAjax:getData',
            'getData'
        );
    }

    protected function getData($response, $payload, Options $optionsHelper)
    {
        $sourceId = $payload['sourceId'];
        $postCustomCss = get_post_meta($sourceId, 'vcvSettingsSourceCustomCss', true);
        $response['cssSettings'] = [
            'custom' => $postCustomCss ? $postCustomCss : '',
            'global' => $optionsHelper->get('settingsGlobalCss', ''),
        ];
        $response['globalElements'] = $optionsHelper->get('globalElements', '');

        return $response;
    }

    protected function setData($response, $payload)
    {
        $sourceId = $payload['sourceId'];
        $this->updateSourceAssets($sourceId);
        $this->updateGlobalAssets($sourceId);

        return $response;
    }

    protected function updateSourceAssets($sourceId)
    {
        $requestHelper = vchelper('Request');
        update_post_meta($sourceId, 'vcvSourceAssetsFiles', $requestHelper->inputJson('vcv-source-assets-files'));
        update_post_meta($sourceId, 'vcvSourceCss', $requestHelper->input('vcv-source-css'));
        update_post_meta(
            $sourceId,
            'vcvSettingsSourceCustomCss',
            $requestHelper->input('vcv-settings-source-custom-css')
        );
    }

    protected function updateGlobalAssets($sourceId = false)
    {
        $optionsHelper = vchelper('Options');
        $requestHelper = vchelper('Request');
        $tf = $requestHelper->input('vcv-tf');
        if ($tf === 'noGlobalCss') {
            // Base css
            $elementsCssData =  $requestHelper->inputJson('vcv-elements-css-data', '');
            $globalElementsCssData = $optionsHelper->get('globalElementsCssData', []);
            $globalElementsCssData[$sourceId] = $elementsCssData;
            $optionsHelper->set('globalElementsCssData', $globalElementsCssData);
            // Other data
            $optionsHelper->set('globalElementsCss', $requestHelper->input('vcv-global-elements-css'));
            $optionsHelper->set('settingsGlobalCss', $requestHelper->input('vcv-settings-global-css'));

            return;
        }
        $optionsHelper->set('globalElements', $requestHelper->inputJson('vcv-global-elements', ''));
        $optionsHelper->set('globalElementsCss', $requestHelper->input('vcv-global-elements-css'));
        $optionsHelper->set('settingsGlobalCss', $requestHelper->input('vcv-settings-global-css'));
    }
}
