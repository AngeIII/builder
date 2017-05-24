<?php

namespace VisualComposer\Modules\Settings\Pages;

if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

use VisualComposer\Framework\Container;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Options;
use VisualComposer\Helpers\Traits\EventsFilters;
use VisualComposer\Helpers\Traits\WpFiltersActions;
use VisualComposer\Modules\Settings\Traits\Fields;
use VisualComposer\Modules\Settings\Traits\Page;

/**
 * Class General.
 */
class General extends Container /*implements Module*/
{
    use Fields;
    use Page;
    use EventsFilters;
    use WpFiltersActions;

    /**
     * @var string
     */
    protected $slug = 'vcv-general';

    /**
     * @var string
     */
    protected $templatePath = 'settings/pages/general/index';

    /**
     * @var array
     */
    private $googleFontsSubsetsExcluded = [];

    /**
     * @var array
     */
    private $googleFontsSubsets = [
        'latin',
        'vietnamese',
        'cyrillic',
        'latin-ext',
        'greek',
        'cyrillic-ext',
        'greek-ext',
    ];

    /**
     * General constructor.
     */
    public function __construct()
    {
        $this->optionGroup = 'vcv-general';
        $this->optionSlug = 'vcv-general';

//        /** @see \VisualComposer\Modules\Settings\Pages\General::addPage */
//        $this->addFilter(
//            'vcv:settings:getPages',
//            'addPage',
//            20
//        );
//
//        /** @see \VisualComposer\Modules\Settings\Pages\General::buildPage */
//        $this->wpAddAction(
//            'vcv:settings:initAdmin:page:' . $this->getSlug(),
//            'buildPage'
//        );
    }

    /**
     * @param array $pages
     *
     * @return array
     */
    private function addPage($pages)
    {
        $pages[] = [
            'slug' => $this->getSlug(),
            'title' => __('General Settings', 'vcwb'),
            'controller' => $this,
        ];

        return $pages;
    }

    /**
     * Page: General Settings.
     */
    public function buildPage()
    {
        $this->addSection(
            [
                'page' => $this->getSlug(),
            ]
        );

        // Disable responsive content elements.
        $fieldCallback = function ($data) {
            /** @see \VisualComposer\Modules\Settings\Pages\General::disableResponsiveFieldCallback */
            return $this->call('disableResponsiveFieldCallback', [$data]);
        };

        $this->addField(
            [
                'page' => $this->getSlug(),
                'title' => __('Disable responsive content elements', 'vcwb'),
                'name' => 'not_responsive_css',
                'fieldCallback' => $fieldCallback,
            ]
        );

        // Google fonts subsets.
        $sanitizeCallback = function ($data) {
            /** @see \VisualComposer\Modules\Settings\Pages\General::sanitizeGoogleFontsSubsetsFieldCallback */
            return $this->call('sanitizeGoogleFontsSubsetsFieldCallback', [$data]);
        };
        $fieldCallback = function ($data) {
            /** @see \VisualComposer\Modules\Settings\Pages\General::googleFontsSubsetsFieldCallback */
            return $this->call('googleFontsSubsetsFieldCallback', [$data]);
        };

        $this->addField(
            [
                'page' => $this->getSlug(),
                'title' => __('Google fonts subsets', 'vcwb'),
                'name' => 'google_fonts_subsets',
                'fieldCallback' => $fieldCallback,
                'sanitizeCallback' => $sanitizeCallback,
            ]
        );
    }

    /**
     * @return array
     */
    public function getGoogleFontsSubsetsExcluded()
    {
        return $this->googleFontsSubsetsExcluded;
    }

    /**
     * @param $excluded
     *
     * @return bool
     */
    public function setGoogleFontsSubsetsExcluded($excluded)
    {
        if (is_array($excluded)) {
            $this->googleFontsSubsetsExcluded = $excluded;

            return true;
        }

        return false;
    }

    /**
     * @return array
     */
    public function getGoogleFontsSubsets()
    {
        return $this->googleFontsSubsets;
    }

    /**
     * Not responsive checkbox callback function.
     *
     * @param \VisualComposer\Helpers\Options $options
     *
     * @return mixed|string
     */
    private function disableResponsiveFieldCallback(Options $options)
    {
        $checked = $options->get('not_responsive_css', false);

        return vcview(
            'settings/pages/general/partials/disable-responsive',
            [
                'checked' => $checked,
            ]
        );
    }

    /**
     * @param array $subsetsToSanitize
     *
     * @return array
     */
    private function sanitizeGoogleFontsSubsetsFieldCallback($subsetsToSanitize)
    {
        $sanitized = [];

        if (isset($subsetsToSanitize) && is_array($subsetsToSanitize)) {
            $excluded = $this->getGoogleFontsSubsetsExcluded();
            $subsets = $this->getGoogleFontsSubsets();
            $diff = array_diff($subsets, $excluded);
            foreach ($subsetsToSanitize as $subset) {
                if (in_array($subset, $diff)) {
                    $sanitized[] = $subset;
                }
            }
        }

        return $sanitized;
    }

    /**
     * @param \VisualComposer\Helpers\Options $options
     *
     * @return array
     */
    private function getSubsets(Options $options)
    {
        $checkedSubsets = $options->get('google_fonts_subsets', $this->getGoogleFontsSubsets());

        $excluded = $this->getGoogleFontsSubsetsExcluded();
        $subsets = [];

        foreach ($this->getGoogleFontsSubsets() as $subset) {
            if (in_array($subset, $excluded)) {
                continue;
            }

            $subsets[] = [
                'title' => $subset,
                'checked' => in_array($subset, $checkedSubsets),
            ];
        }

        return $subsets;
    }

    /**
     * Google fonts subsets callback.
     *
     * @return string
     */
    private function googleFontsSubsetsFieldCallback()
    {
        /** @see \VisualComposer\Modules\Settings\Pages\General::getSubsets */
        $subsets = $this->call('getSubsets');

        return vcview(
            'settings/pages/general/partials/google-fonts-subsets',
            [
                'subsets' => $subsets,
            ]
        );
    }
}
