<?php

class FrontendControllerTest extends WP_UnitTestCase
{
    /**
     * Test for some specific strings/patterns in generated output.
     */
    public function testRenderEditorBase()
    {
        wp_set_current_user(1);
        /** @var $module \VisualComposer\Modules\Editors\Frontend\Controller */
        $module = vc_create_module_mock('\VisualComposer\Modules\Editors\Frontend\Controller');

        /** @var \VisualComposer\Helpers\Request $requestHelper */
        $requestHelper = vchelper('Request');
        // Create test post.
        $this->post = new WP_UnitTest_Factory_For_Post($this);
        $postId = $this->post->create(['post_title' => 'Test Post']);
        $requestHelper->setData(['vcv-source-id' => $postId]);
        vchelper('PostType')->setupPost($postId);
        vchelper('Token')->setSiteAuthorized();
        vchelper('Options')->set('bundleUpdateRequired', false);
        $output = vchelper('Filters')->fire('vcv:editors:frontend:render');

        $patterns = [
            '<!DOCTYPE html>',
            'window\.vcvSourceID = ' . $postId . ';',
            'window\.vcvAjaxUrl = \'.+\?vcv-ajax=1\';',
            'window\.vcvNonce = \'.+\';',
            '<iframe class="vcv-layout-iframe"',
            'src=".+vcv-editable=1&vcv-source-id=' . $postId . '&vcv-nonce=.+" id="vcv-editor-iframe"',
            '<\/html>',
        ];

        foreach ($patterns as $pattern) {
            $errorMessage = 'Failed to find `' . $pattern . '` in generated output: "' . $output . '"';
            $this->assertEquals(1, preg_match('/' . $pattern . '/', $output), $errorMessage);
        }
    }
}
