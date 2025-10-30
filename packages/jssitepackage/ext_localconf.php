<?php

defined('TYPO3') or die('Access denied.');

call_user_func(function () {
    // Page TSconfig
    \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addPageTSConfig(
        "@import 'EXT:jssitepackage/Configuration/TsConfig/Page/Page.tsconfig'"
    );

    // User TSconfig
    \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addUserTSConfig(
        "@import 'EXT:jssitepackage/Configuration/TsConfig/User/User.tsconfig'"
    );

    // RTE preset
    $GLOBALS['TYPO3_CONF_VARS']['RTE']['Presets']['jssitepackage']
        = 'EXT:jssitepackage/Configuration/RTE/Default.yaml';
});
