<?php

namespace VisualComposer\Modules\Assets;

if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

use VisualComposer\Framework\Container;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Assets;
use VisualComposer\Helpers\Options;
use VisualComposer\Helpers\Traits\EventsFilters;
use VisualComposer\Helpers\Traits\WpFiltersActions;

class FileController extends Container implements Module
{
    use EventsFilters;
    use WpFiltersActions;

    public function __construct()
    {
        /** @see \VisualComposer\Modules\Assets\FileController::setData */
        $this->addFilter(
            'vcv:dataAjax:setData',
            'generateGlobalElementsCssFile'
        );

        /** @see \VisualComposer\Modules\Assets\FileController::setData */
        $this->addFilter(
            'vcv:dataAjax:setData',
            'generateSourceCssFile'
        );

        /** @see \VisualComposer\Modules\Assets\FileController::deleteSourceAssetsFile */
        $this->wpAddAction(
            'before_delete_post',
            'deleteSourceAssetsFile'
        );
    }

    /**
     * Generate (save to fs and update db) styles bundle.
     *
     * @param $response
     * @param $payload
     * @param \VisualComposer\Helpers\Options $optionsHelper
     *
     * @param \VisualComposer\Helpers\Assets $assetsHelper
     *
     * @return bool|string URL to generated bundle.
     */
    protected function generateGlobalElementsCssFile($response, $payload, Options $optionsHelper, Assets $assetsHelper)
    {
        $globalElementsCssData = $optionsHelper->get('globalElementsCssData', []);
        $globalElementsBaseCss = [];
        $globalElementsAttributesCss = [];
        $globalElementsMixinsCss = [];
        foreach ($globalElementsCssData as $postElements) {
            foreach ($postElements as $element) {
                //if (!isset($globalElementsBaseCss[ $element['tag'] ])) {
                $baseCssHash = wp_hash($element['baseCss']);
                $globalElementsBaseCss[ $baseCssHash ] = $element['baseCss'];
                //}
                $mixinsHash = wp_hash($element['mixinsCss']);
                $globalElementsMixinsCss[$mixinsHash] = $element['mixinsCss'];
                $attributesHash = wp_hash($element['attributesCss']);
                $globalElementsAttributesCss[$attributesHash] = $element['attributesCss'];
            }
        }

        $globalElementsBaseCssContent = join('', array_values($globalElementsBaseCss));
        $globalElementsMixinsCssContent = join('', array_values($globalElementsMixinsCss));
        $globalElementsAttributesCssContent = join('', array_values($globalElementsAttributesCss));

        $globalCss = $optionsHelper->get('globalElementsCss', '');

        $globalElementsCss = $globalElementsBaseCssContent . $globalElementsAttributesCssContent
            . $globalElementsMixinsCssContent . $globalCss;
        $bundleUrl = $assetsHelper->updateBundleFile($globalElementsCss, 'global-elements.css');
        $optionsHelper->set('globalElementsCssFileUrl', $bundleUrl);
        $response['globalBundleCssFileUrl'] = $bundleUrl;

        return $response;
    }

    /**
     *
     * Generate (save to fs and update db) post styles bundle.
     *
     * @param $response
     * @param $payload
     * @param \VisualComposer\Helpers\Assets $assetsHelper
     *
     * @return bool|string URL to generated bundle.
     *
     */
    protected function generateSourceCssFile($response, $payload, Assets $assetsHelper)
    {
        $sourceId = $payload['sourceId'];
        $sourceCss = get_post_meta($sourceId, 'vcvSourceCss', true);
        $bundleUrl = $assetsHelper->updateBundleFile($sourceCss, $sourceId . '.source.css');
        update_post_meta($sourceId, 'vcvSourceCssFileUrl', $bundleUrl);
        $response['sourceBundleCssFileUrl'] = $bundleUrl;

        return $response;
    }

    protected function deleteSourceAssetsFile($sourceId, Assets $assetsHelper)
    {
        $extension = $sourceId . '.source.css';
        $assetsHelper->deleteAssetsBundles($extension);

        return true;
    }
}
