<?php

namespace VisualComposer\Modules\Editors\AssetsManager;

use VisualComposer\Application;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Options;
use VisualComposer\Helpers\File;
use VisualComposer\Helpers\Filters as FilterDispatcher;
use VisualComposer\Helpers\Request;
use VisualComposer\Framework\Container;

/**
 * Class Controller.
 */
class Controller extends Container implements Module
{
    /**
     * @var \VisualComposer\Helpers\Filters
     */
    protected $filter;

    /**
     * @var \VisualComposer\Helpers\Request
     */
    protected $request;

    /**
     * @var \VisualComposer\Helpers\Options
     */
    protected $options;

    /**
     * @var \VisualComposer\Helpers\File
     */
    protected $file;

    /**
     * Controller constructor.
     *
     * @param \VisualComposer\Helpers\Filters $filterHelper
     * @param \VisualComposer\Helpers\Request $request
     * @param \VisualComposer\Helpers\Options $optionsHelper
     * @param \VisualComposer\Helpers\File $fileHelper
     */
    public function __construct(
        FilterDispatcher $filterHelper,
        Request $request,
        Options $optionsHelper,
        File $fileHelper
    ) {
        $this->filter = $filterHelper;
        $this->request = $request;
        $this->options = $optionsHelper;
        $this->file = $fileHelper;

        $this->filter->listen(
            'vcv:postAjax:setPostData',
            function ($response, $payload) {
                /** @see \VisualComposer\Modules\Editors\AssetsManager\Controller::setPostDataHook */
                $data = $this->call('setPostDataHook', [$payload['sourceId']]);
                if ($data) {
                    $response['data'] = $data;
                } else {
                    $response['status'] = false;
                }
                return $response;
            }
        );
        // Save compiled less into one css bundle.
        $this->filter->listen(
            'vcv:ajax:saveCssBundle:adminNonce',
            function ($response, $payload) {
                /** @see \VisualComposer\Modules\Editors\AssetsManager\Controller::saveCssBundleHook */
                $data = $this->call('saveCssBundleHook', [$payload['sourceId']]);
                if ($data) {
                    $response['data'] = $data;
                } else {
                    $response['status'] = false;
                }

                return $response;
            }
        );
        $this->filter->listen(
            'vcv:ajax:getData:adminNonce',
            function ($response, $payload) {
                $response['globalElements'] = $this->options->get('global-elements', []);
                return $response;
            }
        );

        add_action(
            'before_delete_post',
            function ($postId) {
                /** @see \VisualComposer\Modules\Editors\AssetsManager\Controller::deletePostAssetsHook */
                return $this->call('deletePostAssetsHook', [$postId]);
            }
        );
    }

    /**
     * @param $postId
     *
     * @return array
     */
    private function setPostDataHook($postId)
    {
        $this->updatePostAssets(
            $postId,
            'scripts',
            $this->request->input('vcv-scripts', [])
        );
        $this->updatePostAssets(
            $postId,
            'styles',
            $this->request->input('vcv-styles', [])
        );
        $this->updateGlobalAssets(
            'global-elements',
            rawurldecode($this->request->input('vcv-global-elements', ''))
        );
        $this->updateGlobalAssets(
            'global-styles',
            $this->request->input('vcv-global-styles', '')
        );
        $scriptsBundles = $this->generateScriptsBundle();
        // $styleBundles = $this->getStyleBundles();
        $globalStylesFile = $this->generateStylesGlobalFile();
        return [
            'scriptBundles' => $scriptsBundles,
            // 'styleBundles' => $styleBundles,
            'globalStylesFile' => $globalStylesFile
        ];
    }

    /**
     * Called every time post is permanently deleted.
     * Remove list of associated assets.
     *
     * @param int $postId Post ID
     *
     * @return $this
     */
    private function deletePostAssetsHook($postId)
    {
        foreach ([
            'scripts',
            'styles',
        ] as $assetType) {
            $assets = $this->options->get($assetType, []);

            if (!is_array($assets) || !isset($assets[ $postId ])) {
                continue;
            }

            unset($assets[ $postId ]);

            $this->options->set($assetType, $assets);
        }

        return true;
    }

    /**
     * Save compiled less into one css bundle.
     */
    private function saveCssBundleHook()
    {
        $contents = $this->request->input('vcv-contents');

        $bundleUrl = $this->generateStylesBundle($contents);

        if ($bundleUrl) {
            return ['filename' => $bundleUrl];
        }

        return false;
    }

    /**
     * Generate (save to fs and update db) scripts bundle.
     * Old files are deleted.
     *
     * @return bool|string URL to generated bundle.
     */
    private function generateScriptsBundle()
    {
        $assets = $this->options->get('scripts', []);

        $files = [];
        if (is_array($assets)) {
            foreach ($assets as $postId => $elements) {
                if (is_array($elements)) {
                    foreach ($elements as $element => $elementAssets) {
                        $files = array_merge($files, $elementAssets);
                    }
                }
            }
        }
        $files = array_unique($files);

        if (!empty($files)) {
            $uploadDir = wp_upload_dir();
            $concatenatedFilename = md5(implode(',', $files)) . '.js';
            $bundleUrl = $uploadDir['baseurl'] . '/' . VCV_PLUGIN_DIRNAME . '/asset-bundles' . '/'
                . $concatenatedFilename;

            $destinationDir = $uploadDir['basedir'] . '/' . VCV_PLUGIN_DIRNAME . '/asset-bundles';
            $bundle = $destinationDir . '/' . $concatenatedFilename;
            /** @var $app Application */
            $app = vcapp();
            if (!is_file($bundle)) {
                $contents = '';
                foreach ($files as $file) {
                    $filepath = $app->path('public/sources/elements/' . $file);
                    $contents .= $this->file->getContents($filepath) . "\n";
                }

                $this->deleteAssetsBundles('js');
                if (!$this->file->setContents($bundle, $contents)) {
                    return false;
                }
            }
        } else {
            $this->deleteAssetsBundles('js');
            $bundleUrl = '';
        }

        $this->options->set('scriptsBundle', $bundleUrl);

        return $bundleUrl;
    }

    /**
     * Generate (save to fs and update db) scripts bundle.
     * Old files are deleted.
     *
     * @param string $contents CSS contents to save.
     *
     * @return bool|string URL to generated bundle.
     */
    private function generateStylesBundle($contents)
    {
        if ($contents) {
            $uploadDir = wp_upload_dir();
            $concatenatedFilename = md5($contents) . '.css';
            $bundleUrl = $uploadDir['baseurl'] . '/' . VCV_PLUGIN_DIRNAME . '/assets-bundles' . '/'
                . $concatenatedFilename;

            $destinationDir = $uploadDir['basedir'] . '/' . VCV_PLUGIN_DIRNAME . '/assets-bundles';
            $bundle = $destinationDir . '/' . $concatenatedFilename;

            if (!is_file($bundle)) {
                $this->deleteAssetsBundles('css');
                if (!$this->file->setContents($bundle, $contents)) {
                    return false;
                }
            }
        } else {
            $this->deleteAssetsBundles('css');
            $bundleUrl = '';
        }

        $this->options->set('stylesBundle', $bundleUrl);

        return $bundleUrl;
    }

    /**
     * @return array
     */
    private function getStyleBundles()
    {
        $assets = $this->options->get('styles', []);

        $list = [];
        if (is_array($assets)) {
            foreach ($assets as $postId => $elements) {
                $list = array_merge($list, (array)$elements);
            }
        }

        $bundles = [];
        /** @var Application $app */
        $app = vcapp();
        foreach ($list as $element => $files) {
            $contents = '';
            if (is_array($files)) {
                foreach ($files as $file) {
                    $filepath = $app->path('public/sources/elements/' . $file);
                    $contents .= $this->file->getContents($filepath) . "\n";
                }
            }

            $bundles[] = [
                'filename' => $element . '.less',
                'contents' => $contents,
            ];
        }

        return $bundles;
    }

    /**
     * Generate (save to fs and update db) styles bundle.
     *
     * @return bool|string URL to generated bundle.
     */
    private function generateStylesGlobalFile()
    {
        $styles = $this->options->get('global-styles', '');
        $bundleUrl = $this->createBundleFile($styles, 'css');
        $this->options->set('stylesGlobalFile', $bundleUrl);
        // remove file
        return $bundleUrl;
    }

    /**
     * Create file with content in filesystem
     *
     * @param $content
     * @param $extension
     *
     * @return bool|string
     */
    private function createBundleFile($content, $extension)
    {
        $bundleUrl = false;
        if ($content) {
            $concatenatedFilename = md5($content) . '.' . $extension;
            $bundle = $this->getFilePath($concatenatedFilename);
            $bundleUrl = $this->getFileUrl($concatenatedFilename);
            if (!is_file($bundle)) {
                if (!$this->file->setContents($bundle, $content)) {
                    return false;
                }
            }
        }

        return $bundleUrl;
    }
    /**
     * @param int $postId
     * @param string $assetType scripts|styles.
     * @param string[] $postAssets
     *
     * @return array|mixed
     */
    private function updatePostAssets($postId, $assetType, $postAssets)
    {
        $assets = $this->options->get($assetType, []);
        if (!is_array($assets)) {
            $assets = [];
        }

        if ($postAssets) {
            $assets[ $postId ] = $postAssets;
        } else {
            unset($assets[ $postId ]); // TODO: check for isset??
        }

        $this->options->set($assetType, $assets);

        return $assets;
    }
    /**
     * @param string $assetType scripts|styles.
     * @param string[] $postAssets
     *
     * @return array|mixed
     */
    private function updateGlobalAssets($assetType, $postAssets)
    {
        $assets = $this->options->get($assetType, '');


        $this->options->set($assetType, $postAssets);

        return $assets;
    }
    /**
     * Remove all files by extension in asset-bundles directory.
     *
     * @param string $extension
     *
     * @return array
     */
    private function deleteAssetsBundles($extension = '')
    {
        $uploadDir = wp_upload_dir();
        $destinationDir = $uploadDir['basedir'] . '/' . VCV_PLUGIN_DIRNAME . '/assets-bundles';

        if ($extension) {
            $extension = '.' . $extension;
        }
        /** @var Application $app */
        $app = vcapp();
        $files = $app->rglob($destinationDir . '/*' . $extension);
        if (is_array($files)) {
            foreach ($files as $file) {
                unlink($file);
            }
        }

        return $files;
    }
    private function getFilePath($filename)
    {
        $uploadDir = wp_upload_dir();
        $destinationDir = $uploadDir['basedir'] . '/' . VCV_PLUGIN_DIRNAME . '/assets-bundles';
        $this->file->checkDir($destinationDir);
        $path = $destinationDir . '/' . $filename;
        return $path;
    }
    private function getFileUrl($filename)
    {
        $uploadDir = wp_upload_dir();
        $url = $uploadDir['baseurl'] . '/' . VCV_PLUGIN_DIRNAME . '/assets-bundles' . '/'
            . $filename;
        return $url;
    }
}
