<?php

class RequirementsTest extends WP_UnitTestCase
{
    public function testPluginRequirementsConstants()
    {
        $this->assertTrue(class_exists('VcVCoreRequirements'));

        $this->assertTrue(version_compare(VCV_REQUIRED_PHP_VERSION, '5.3', '>'));
        $this->assertTrue(version_compare(VCV_REQUIRED_PHP_VERSION, '5.3.1', '>'));
        $this->assertFalse(version_compare(VCV_REQUIRED_PHP_VERSION, '5.4', '>'));
        $this->assertFalse(version_compare(VCV_REQUIRED_PHP_VERSION, '5.4.1', '>'));
        $this->assertFalse(version_compare(VCV_REQUIRED_PHP_VERSION, '5.5', '>'));
        $this->assertFalse(version_compare(VCV_REQUIRED_PHP_VERSION, '7.0', '>'));

        $this->assertTrue(version_compare(VCV_REQUIRED_BLOG_VERSION, '4.0', '>'));
        $this->assertTrue(version_compare(VCV_REQUIRED_BLOG_VERSION, '4.0.9', '>'));
        $this->assertFalse(version_compare(VCV_REQUIRED_BLOG_VERSION, '4.1', '>'));
        $this->assertFalse(version_compare(VCV_REQUIRED_BLOG_VERSION, '4.5', '>'));
        $requirements = new VcvCoreRequirements();
        $this->assertTrue($requirements->coreChecks());
    }

    public function testCheckVersion()
    {
        $requirements = $this->getMockBuilder('VcvCoreRequirements')->setMethods(
            ['deactivate']
        )->getMock();
        $requirements->expects($this->exactly(2))->method('deactivate')->with(
            $this->equalTo(VCV_PLUGIN_FULL_PATH)
        )->will($this->returnValue(true));
        /** @var VcvCoreRequirements $requirements */
        $this->assertFalse($requirements->checkVersion('5.0', '4.0'));

        // 5.0
        $this->assertTrue($requirements->checkVersion('5.0', '5.0'));

        // 5.1
        $this->assertTrue($requirements->checkVersion('5.0', '5.1'));

        // 6.0-dev
        $this->assertTrue($requirements->checkVersion('5.0', '6.0-dev'));

        // 5.0-beta
        $this->assertFalse($requirements->checkVersion('5.0', '5.0-beta'));
    }
}
